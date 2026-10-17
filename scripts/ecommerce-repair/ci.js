'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./core');
const runtime = require('./runtime');
const deployment = require('./deployment');
const root = path.resolve(__dirname, '../..');
const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const output = (key, value) => {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
};

function gateProposal(state, repair, diagnosis, packet) {
  if (repair.blockers?.length)
    throw new Error(`Repair agent reported blockers: ${repair.blockers.join('; ')}`);
  const target = state[state.role];
  const files = runtime.changedFiles(target, state.baselines[state.role].baseline, state.role);
  runtime.assertFrozen(
    state[state.role === 'website' ? 'framework' : 'website'],
    state.frozen[state.role === 'website' ? 'framework' : 'website'],
  );
  const protectedNow = runtime.trackedHashes(state.framework),
    protectedBefore = { ...state.frozen.framework };
  if (state.role === 'framework') {
    const file = 'pages/ecommerce-storefront-page.ts';
    const before = runtime.command(
      'git',
      ['show', `${state.baselines.framework.baseline}:${file}`],
      state.framework,
      { raw: true },
    );
    core.validateHealerChange(before, fs.readFileSync(path.join(state.framework, file), 'utf8'));
    delete protectedNow[file];
    delete protectedBefore[file];
  }
  if (JSON.stringify(protectedNow) !== JSON.stringify(protectedBefore))
    throw new Error('Protected tests/requirements/configuration changed');
  if (state.role === 'website') {
    for (const file of ['docs/BRD.md', 'docs/QA_TESTING_GUIDE.md'])
      core.validateWebsiteDocs(
        runtime.command(
          'git',
          ['show', `${state.baselines.website.baseline}:${file}`],
          state.website,
          { raw: true },
        ),
        fs.readFileSync(path.join(state.website, file), 'utf8'),
      );
    const permitted = new Set(
      diagnosis.evidence
        .filter((item) => item.source.startsWith('website/src/'))
        .map((item) => item.source.slice(8)),
    );
    if (files.some((file) => file.startsWith('src/') && !permitted.has(file)))
      throw new Error('Patch exceeds diagnosed website source files');
    if (
      !repair.documentationReview?.trim() ||
      !repair.requirementIds?.length ||
      repair.requirementIds.some((id) => !packet.requirements.some((item) => item.id === id))
    )
      throw new Error('Missing explicit website requirement review');
  }
  return files;
}

async function main(args = process.argv.slice(2)) {
  const [mode, directoryArgument, websiteArgument, reportArgument, deploymentArgument] = args;
  const directory = path.resolve(directoryArgument || 'test-results/ecommerce-repair-ci');
  fs.mkdirSync(directory, { recursive: true });
  const stateFile = path.join(directory, 'state.json');
  if (mode === 'prepare') {
    if (fs.existsSync(stateFile)) throw new Error('Existing CI repair state must not be reused');
    const packet = core.packetFromReports(root, [path.resolve(reportArgument)]);
    write(path.join(directory, 'failure-packet.json'), packet);
    if (packet.blockers.length || !packet.failures.length) {
      write(stateFile, {
        status: packet.blockers.length ? 'needs-review' : 'no-browser-failures',
        blockers: packet.blockers,
      });
      output('active', 'false');
      return;
    }
    const workspace = runtime.makeWorkspace();
    const state = {
      status: 'prepared',
      workspace,
      framework: path.join(workspace, 'framework'),
      website: path.join(workspace, 'website'),
      baselines: {},
      frozen: {},
    };
    state.baselines.framework = runtime.snapshot(root, state.framework, false);
    state.baselines.website = runtime.snapshot(path.resolve(websiteArgument), state.website, false);
    if (!deploymentArgument)
      throw new Error('CI repair requires the captured website deployment record');
    const deploymentBytes = fs.readFileSync(path.resolve(deploymentArgument));
    const record = JSON.parse(deploymentBytes);
    deployment.validatePacket(
      packet,
      record,
      deploymentBytes,
      state.baselines.framework.sourceRevision,
      state.baselines.website.sourceRevision,
    );
    await deployment.verifyRecord(record);
    fs.writeFileSync(path.join(directory, 'website-deployment.json'), deploymentBytes);
    state.frozen.framework = runtime.trackedHashes(state.framework);
    state.frozen.website = runtime.trackedHashes(state.website);
    const sources = runtime.sourceEvidence(state.framework, state.website, packet);
    write(path.join(directory, 'evidence-sources.json'), sources);
    write(path.join(directory, 'diagnosis.schema.json'), core.diagnosisSchema(sources));
    fs.writeFileSync(
      path.join(directory, 'diagnosis-prompt.txt'),
      core.diagnosisPrompt(packet, sources),
    );
    write(stateFile, state);
    output('active', 'true');
    output('framework', state.framework);
    output('website_revision', state.baselines.website.sourceRevision);
    output('framework_revision', state.baselines.framework.sourceRevision);
  } else if (mode === 'route') {
    const state = json(stateFile),
      packet = json(path.join(directory, 'failure-packet.json')),
      diagnosis = json(path.join(directory, 'diagnosis.json'));
    state.role = core.validateDiagnosis(
      packet,
      diagnosis,
      json(path.join(directory, 'evidence-sources.json')),
    );
    state.status =
      state.role === 'environment'
        ? 'environment-blocked'
        : state.role === 'review'
          ? 'needs-review'
          : 'diagnosed';
    state.summary = diagnosis.reason;
    runtime.assertFrozen(state.framework, state.frozen.framework);
    runtime.assertFrozen(state.website, state.frozen.website);
    write(stateFile, state);
    output('role', state.role);
    if (['website', 'framework'].includes(state.role)) {
      fs.writeFileSync(
        path.join(directory, 'repair-prompt.txt'),
        core.repairPrompt(state.role, packet, diagnosis),
      );
      output('target', state[state.role]);
    }
  } else if (mode === 'capture') {
    const state = json(stateFile),
      packet = json(path.join(directory, 'failure-packet.json')),
      diagnosis = json(path.join(directory, 'diagnosis.json')),
      repair = json(path.join(directory, 'repair.json'));
    gateProposal(state, repair, diagnosis, packet);
    if (state.role === 'website') {
      await runtime.install(state.website, directory, 'website-documentation');
      runtime.command(process.execPath, [runtime.npmCli(), 'run', 'docs:sync'], state.website, {
        env: runtime.websiteEnvironment(),
      });
      runtime.command(
        process.execPath,
        [
          runtime.npmCli(),
          'run',
          'docs:review',
          '--',
          '--summary',
          repair.documentationReview,
          '--requirements',
          repair.requirementIds.join(','),
        ],
        state.website,
        { env: runtime.websiteEnvironment() },
      );
    }
    const files = gateProposal(state, repair, diagnosis, packet);
    const patch = runtime.command(
      'git',
      ['diff', '--binary', state.baselines[state.role].baseline, '--', ...files],
      state[state.role],
      { raw: true },
    );
    fs.writeFileSync(path.join(directory, 'candidate.patch'), patch);
    runtime.command(
      'git',
      ['apply', '--check', '--reverse', path.join(directory, 'candidate.patch')],
      state[state.role],
    );
    const proposal = {
      schemaVersion: 1,
      status: 'unverified-proposal',
      role: state.role,
      frameworkRevision: state.baselines.framework.sourceRevision,
      websiteRevision: state.baselines.website.sourceRevision,
      patchSha256: core.hash(patch),
      files,
      summary: repair.summary,
      deploymentSha256: core.hash(fs.readFileSync(path.join(directory, 'website-deployment.json'))),
    };
    write(path.join(directory, 'proposal.json'), proposal);
    state.status = proposal.status;
    write(stateFile, state);
    output('has_patch', 'true');
    output('role', state.role);
  } else if (mode === 'verify') {
    const proposal = json(path.join(directory, 'proposal.json')),
      packet = json(path.join(directory, 'failure-packet.json'));
    if (proposal.status !== 'unverified-proposal') throw new Error('Unexpected proposal state');
    const patchFile = path.join(directory, 'candidate.patch');
    if (core.hash(fs.readFileSync(patchFile)) !== proposal.patchSha256)
      throw new Error('Proposal patch digest mismatch');
    core.validateChangedFiles(proposal.role, proposal.files);
    const workspace = runtime.makeWorkspace(),
      framework = path.join(workspace, 'framework'),
      website = path.join(workspace, 'website');
    const baselines = {
      framework: runtime.snapshot(root, framework, false),
      website: runtime.snapshot(path.resolve(websiteArgument), website, false),
    };
    if (
      baselines.framework.sourceRevision !== proposal.frameworkRevision ||
      baselines.website.sourceRevision !== proposal.websiteRevision
    )
      throw new Error('Verification checkouts differ from proposal revisions');
    const deploymentBytes = fs.readFileSync(path.join(directory, 'website-deployment.json'));
    const record = JSON.parse(deploymentBytes);
    if (core.hash(deploymentBytes) !== proposal.deploymentSha256)
      throw new Error('Proposal deployment record digest mismatch');
    deployment.validatePacket(
      packet,
      record,
      deploymentBytes,
      baselines.framework.sourceRevision,
      baselines.website.sourceRevision,
    );
    await deployment.verifyRecord(record);
    const sources = runtime.sourceEvidence(framework, website, packet),
      diagnosis = json(path.join(directory, 'diagnosis.json'));
    if (core.validateDiagnosis(packet, diagnosis, sources) !== proposal.role)
      throw new Error('Proposal route differs from grounded diagnosis');
    const frozen = {
      framework: runtime.trackedHashes(framework),
      website: runtime.trackedHashes(website),
    };
    await runtime.install(framework, directory, 'framework');
    await runtime.install(website, directory, 'website');
    await runtime.buildWebsite(website, directory, 'baseline');
    let server = await runtime.startWebsite(website, directory, 'baseline');
    try {
      const baseline = await runtime.browserRun(
        framework,
        packet,
        directory,
        'baseline',
        server.url,
      );
      if (!runtime.reproduced(packet, baseline))
        throw new Error('Original failures did not reproduce before patch');
    } finally {
      server.stop();
    }
    const target = proposal.role === 'website' ? website : framework;
    runtime.command('git', ['apply', '--check', patchFile], target);
    runtime.command('git', ['apply', patchFile], target);
    const state = { ...baselines, baselines, frozen, framework, website, role: proposal.role };
    const files = gateProposal(state, json(path.join(directory, 'repair.json')), diagnosis, packet);
    if (JSON.stringify([...files].sort()) !== JSON.stringify([...proposal.files].sort()))
      throw new Error('Applied patch paths differ from verified proposal');
    if (proposal.role === 'website') await runtime.buildWebsite(website, directory, 'candidate');
    else {
      const result = await runtime.run(
        process.execPath,
        [runtime.npmCli(), 'run', 'check'],
        framework,
        path.join(directory, 'candidate-framework-check.log'),
      );
      if (result.code !== 0) throw new Error('Framework checks failed');
    }
    server = await runtime.startWebsite(website, directory, 'candidate');
    let verification;
    try {
      verification = await runtime.browserRun(
        framework,
        packet,
        directory,
        'candidate',
        server.url,
        true,
      );
    } finally {
      server.stop();
    }
    const hashes = {
      caseCatalogSha256: core.hash(
        fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/case-catalog.json')),
      ),
      checkManifestSha256: core.hash(
        fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/check-links.json')),
      ),
    };
    if (
      !core.verifyReport(
        verification.report,
        verification.expectedCheckIds,
        verification.code,
        hashes,
      )
    )
      throw new Error('Independent regression verification failed');
    gateProposal(state, json(path.join(directory, 'repair.json')), diagnosis, packet);
    proposal.status = 'verified-candidate';
    proposal.verification = {
      passed: true,
      expectedCheckIds: verification.expectedCheckIds,
      inventoryHashes: hashes,
      stats: verification.report.stats,
      reportSha256: core.hash(fs.readFileSync(verification.reportFile)),
    };
    write(path.join(directory, 'proposal.json'), proposal);
    output('verified', 'true');
    output('role', proposal.role);
  } else throw new Error('Expected prepare, route, capture or verify');
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main, gateProposal };
