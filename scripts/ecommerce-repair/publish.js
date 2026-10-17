'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./core');
const runtime = require('./runtime');
const deployment = require('./deployment');

const repositories = {
  website: 'varunsidr/Luxury_fashion_ecommerce',
  framework: 'varunsidr/playwright-ai-self-healing-framework',
};
function validatePublication(proposal, patch, report) {
  if (proposal.status !== 'verified-candidate' || proposal.verification?.passed !== true)
    throw new Error('Only independently verified candidates may open a PR');
  if (core.hash(patch) !== proposal.patchSha256)
    throw new Error('Publication patch digest mismatch');
  if (core.hash(report) !== proposal.verification.reportSha256)
    throw new Error('Publication verification report digest mismatch');
  if (
    !proposal.verification.inventoryHashes ||
    !Array.isArray(proposal.verification.expectedCheckIds) ||
    !core.verifyReport(
      JSON.parse(report.toString('utf8')),
      proposal.verification.expectedCheckIds,
      0,
      proposal.verification.inventoryHashes,
    )
  )
    throw new Error('Publication report is not a complete clean verification');
  core.validateChangedFiles(proposal.role, proposal.files);
  if (
    !/^[a-f0-9]{40}$/.test(proposal.frameworkRevision) ||
    !/^[a-f0-9]{40}$/.test(proposal.websiteRevision)
  )
    throw new Error('Missing immutable source revisions');
  return repositories[proposal.role];
}
async function github(endpoint, token, method = 'GET', body) {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(`GitHub ${method} ${response.status}: ${data.message || 'request failed'}`);
  return data;
}
async function main(args = process.argv.slice(2)) {
  const directory = path.resolve(args[0] || 'test-results/ecommerce-repair-ci');
  const proposal = JSON.parse(fs.readFileSync(path.join(directory, 'proposal.json'), 'utf8'));
  const patch = fs.readFileSync(path.join(directory, 'candidate.patch'));
  const report = fs.readFileSync(path.join(directory, 'candidate-results.json'));
  const repository = validatePublication(proposal, patch, report);
  const packet = JSON.parse(fs.readFileSync(path.join(directory, 'failure-packet.json'), 'utf8'));
  const deploymentBytes = fs.readFileSync(path.join(directory, 'website-deployment.json'));
  const record = JSON.parse(deploymentBytes);
  if (core.hash(deploymentBytes) !== proposal.deploymentSha256)
    throw new Error('Publication deployment record digest mismatch');
  deployment.validatePacket(
    packet,
    record,
    deploymentBytes,
    proposal.frameworkRevision,
    proposal.websiteRevision,
  );
  await deployment.verifyRecord(record);
  const token = process.env.GH_TOKEN;
  if (!token)
    throw new Error(
      'GH_TOKEN with branch/PR access to the selected repository is required; no PR was created',
    );
  const info = await github(`/repos/${repository}`, token),
    base = info.default_branch;
  const ref = await github(`/repos/${repository}/git/ref/heads/${encodeURIComponent(base)}`, token);
  const revision =
    proposal.role === 'website' ? proposal.websiteRevision : proposal.frameworkRevision;
  if (ref.object.sha !== revision)
    throw new Error('The target branch advanced since verification; rerun on the new revision');
  const branch = `repair/zeouf-${core
    .hash(
      `${revision}:${packet.failures
        .map((item) => item.checkId)
        .sort()
        .join(',')}`,
    )
    .slice(0, 16)}`;
  const existing = await github(
    `/repos/${repository}/pulls?state=open&head=${encodeURIComponent(repository.split('/')[0] + ':' + branch)}`,
    token,
  );
  if (existing.length) {
    fs.writeFileSync(
      path.join(directory, 'publication.json'),
      JSON.stringify({ status: 'existing-pr', url: existing[0].html_url }, null, 2) + '\n',
    );
    console.log(`Existing repair PR: ${existing[0].html_url}`);
    return;
  }
  const workspace = runtime.makeWorkspace(),
    checkout = path.join(workspace, 'publish');
  runtime.command(
    'git',
    ['clone', '--quiet', `https://github.com/${repository}.git`, checkout],
    workspace,
  );
  runtime.command('git', ['checkout', '--quiet', '--detach', revision], checkout);
  const patchFile = path.join(directory, 'candidate.patch');
  runtime.command('git', ['apply', '--check', patchFile], checkout);
  runtime.command('git', ['apply', patchFile], checkout);
  const changes = runtime
    .command('git', ['diff', '--name-only', revision], checkout)
    .split('\n')
    .filter(Boolean);
  const fresh = runtime
    .command('git', ['ls-files', '--others', '--exclude-standard', '-z'], checkout)
    .split('\0')
    .filter(Boolean);
  const files = [...new Set([...changes, ...fresh])];
  core.validateChangedFiles(proposal.role, files);
  if (JSON.stringify(files.sort()) !== JSON.stringify([...proposal.files].sort()))
    throw new Error('Publication patch files differ from the verified list');
  const commit = await github(`/repos/${repository}/git/commits/${revision}`, token);
  const tree = [];
  for (const file of files) {
    const target = core.safePath(checkout, file);
    if (fs.lstatSync(target).isSymbolicLink())
      throw new Error('Publication symlinks are forbidden');
    const blob = await github(`/repos/${repository}/git/blobs`, token, 'POST', {
      content: fs.readFileSync(target).toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path: file, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const updated = await github(`/repos/${repository}/git/trees`, token, 'POST', {
    base_tree: commit.tree.sha,
    tree,
  });
  const newCommit = await github(`/repos/${repository}/git/commits`, token, 'POST', {
    message: `fix: repair verified Zeouf ${proposal.role} regression`,
    tree: updated.sha,
    parents: [revision],
  });
  const latest = await github(
    `/repos/${repository}/git/ref/heads/${encodeURIComponent(base)}`,
    token,
  );
  if (latest.object.sha !== revision)
    throw new Error('Target branch advanced during publication; rerun verification');
  await github(`/repos/${repository}/git/refs`, token, 'POST', {
    ref: `refs/heads/${branch}`,
    sha: newCommit.sha,
  });
  const title = `Fix Zeouf ${proposal.role === 'website' ? 'website' : 'locator'} regression`;
  const body = `${proposal.summary}\n\nOriginal failing checks: ${packet.failures.map((item) => item.checkId).join(', ')}. Their tests and expected behavior were preserved.\n\nIndependent verification: ${proposal.verification.stats.expected} passed, zero retries. Original failure reproduced before the patch. Source revision: ${revision}. Patch SHA-256: ${proposal.patchSha256}.\n\nThis is a verified local candidate. Production deployment and its read-only rerun remain pending. No automatic merge or deployment is performed.`;
  const pr = await github(`/repos/${repository}/pulls`, token, 'POST', {
    title,
    body,
    head: branch,
    base,
    draft: true,
  });
  fs.writeFileSync(
    path.join(directory, 'publication.json'),
    JSON.stringify({ status: 'draft-pr-created', url: pr.html_url, branch, repository }, null, 2) +
      '\n',
  );
  console.log(`Draft repair PR: ${pr.html_url}`);
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { validatePublication, main };
