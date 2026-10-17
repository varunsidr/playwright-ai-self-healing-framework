'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./core');
const runtime = require('./runtime');
const root = path.resolve(__dirname, '../..');

async function main(args = process.argv.slice(2)) {
  const [source, outputArgument] = args;
  if (!source)
    throw new Error(
      'Usage: prepare:website-integration -- <website-checkout> <new-output-directory>',
    );
  const directory = path.resolve(outputArgument || 'test-results/website-repair-integration');
  if (fs.existsSync(directory)) throw new Error('Use a fresh output directory');
  fs.mkdirSync(directory, { recursive: true });
  const workspace = runtime.makeWorkspace(),
    website = path.join(workspace, 'website');
  const baseline = runtime.snapshot(path.resolve(source), website, false);
  const workflow = '.github/workflows/repair-pr.yml';
  if (fs.existsSync(path.join(website, workflow)))
    throw new Error('Website already has a repair PR workflow; review it instead of overwriting');
  fs.mkdirSync(path.dirname(path.join(website, workflow)), { recursive: true });
  fs.copyFileSync(
    path.join(root, 'templates/ecommerce/website-repair-pr.yml'),
    path.join(website, workflow),
  );
  fs.appendFileSync(
    path.join(website, 'docs/BRD.md'),
    '\n\n### Repair PR verification process\n\nThe development workflow adds an isolated verification check for proposed website commits using a separately reviewed, immutable framework revision. It changes no customer behavior, requirement IDs, acceptance criteria or existing gaps. Browser fixture and source-review evidence remain separate from production database and deployed acceptance.\n',
  );
  fs.appendFileSync(
    path.join(website, 'docs/QA_TESTING_GUIDE.md'),
    '\n\n### Website repair PR verification\n\nInstall `.github/workflows/repair-pr.yml` through a reviewed PR. Set the website repository variable `ECOMMERCE_REPAIR_FRAMEWORK_SHA` to the full reviewed framework commit containing `verify:website-pr`, then require the `Zeouf unchanged public regressions` check alongside existing storefront and requirements checks. The workflow builds the proposed website commit with placeholder services and runs frozen public-safe framework regressions with zero retries. This is local UI/fixture coverage; it does not authorize production database writes or prove deployed acceptance. Keep branch protections and human review in place, and inspect Vercel preview settings before pushing repair branches.\n',
  );
  await runtime.install(website, directory, 'website');
  runtime.command(process.execPath, [runtime.npmCli(), 'run', 'docs:sync'], website, {
    env: runtime.websiteEnvironment(),
  });
  runtime.command(
    process.execPath,
    [
      runtime.npmCli(),
      'run',
      'docs:review',
      '--',
      '--no-functional-change',
      '--summary',
      'Reviewed the isolated repair PR CI workflow and appended BRD/QA instructions. Existing requirements, acceptance rows, gaps and customer behavior are unchanged; browser fixture verification is distinct from production acceptance.',
    ],
    website,
    { env: runtime.websiteEnvironment() },
  );
  const checked = await runtime.run(
    process.execPath,
    [runtime.npmCli(), 'run', 'docs:check'],
    website,
    path.join(directory, 'documentation-check.log'),
    { env: runtime.websiteEnvironment() },
  );
  if (checked.code !== 0) throw new Error('Website integration documentation checks failed');
  for (const file of ['docs/BRD.md', 'docs/QA_TESTING_GUIDE.md'])
    core.validateWebsiteDocs(
      runtime.command('git', ['show', `${baseline.baseline}:${file}`], website, { raw: true }),
      fs.readFileSync(path.join(website, file), 'utf8'),
    );
  runtime.command('git', ['add', '--intent-to-add', '--', workflow], website);
  const files = runtime
    .command('git', ['diff', '--name-only', baseline.baseline], website)
    .split('\n')
    .filter(Boolean);
  const allowed = new Set([
    workflow,
    'docs/BRD.md',
    'docs/QA_TESTING_GUIDE.md',
    'docs/REQUIREMENTS_TRACEABILITY.csv',
    'docs/requirements-history.json',
    'docs/requirements-reviews.json',
    'docs/requirements-source-snapshot.json',
  ]);
  if (files.some((file) => !allowed.has(file)))
    throw new Error('Integration setup changed unrelated website files');
  const patch = runtime.command(
    'git',
    ['diff', '--binary', baseline.baseline, '--', ...files],
    website,
    { raw: true },
  );
  fs.writeFileSync(path.join(directory, 'website-integration.patch'), patch);
  runtime.command(
    'git',
    ['apply', '--check', '--reverse', path.join(directory, 'website-integration.patch')],
    website,
  );
  const result = {
    status: 'reviewable-integration-patch',
    websiteRevision: baseline.sourceRevision,
    workspace,
    files,
    patchSha256: core.hash(patch),
    documentationCheck: 'passed',
    frameworkVariable: 'ECOMMERCE_REPAIR_FRAMEWORK_SHA',
    requiredCheck: 'Zeouf unchanged public regressions',
    published: false,
  };
  fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(
    path.join(directory, 'README.md'),
    `# Website repair CI integration\n\nStatus: reviewable patch; not installed or published.\n\nWebsite baseline: ${baseline.sourceRevision}\n\nReview website-integration.patch. After the framework implementation is merged, configure ECOMMERCE_REPAIR_FRAMEWORK_SHA to that reviewed full commit, apply this patch on a website feature branch, and open a PR. If the website advanced, regenerate the patch from its new committed revision. Documentation checks passed and existing requirement/acceptance/gap rows were preserved.\n\nRequire the Zeouf unchanged public regressions status after its first successful run. No source behavior or deployment settings were changed. The original website working copy was not edited.\n`,
  );
  console.log(`Prepared website integration patch: ${directory}`);
  return result;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
