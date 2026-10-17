'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('./core');
const runtime = require('./runtime');
const root = path.resolve(__dirname, '../..');

async function main(args = process.argv.slice(2)) {
  const [sourceWebsite, outputDirectory, ...flags] = args;
  if (!sourceWebsite || flags.some((flag) => flag !== '--working-tree'))
    throw new Error(
      'Usage: verify:website-pr -- <website-checkout> <new-output-directory> [--working-tree]',
    );
  const directory = path.resolve(outputDirectory || 'test-results/website-repair-pr');
  if (fs.existsSync(directory))
    throw new Error('Use a fresh verification directory; prior evidence must be retained');
  fs.mkdirSync(directory, { recursive: true });
  const workspace = runtime.makeWorkspace(),
    framework = path.join(workspace, 'framework'),
    website = path.join(workspace, 'website');
  const result = {
    schemaVersion: 1,
    status: 'verifying',
    context: 'isolated-website-pr',
    framework: runtime.snapshot(root, framework, flags.includes('--working-tree')),
    website: runtime.snapshot(path.resolve(sourceWebsite), website, false),
  };
  const frozen = runtime.trackedHashes(framework);
  let server;
  try {
    await runtime.install(framework, directory, 'framework');
    await runtime.install(website, directory, 'website');
    await runtime.buildWebsite(website, directory, 'website-pr');
    server = await runtime.startWebsite(website, directory, 'website-pr');
    const run = await runtime.browserRun(
      framework,
      { failures: [], cases: [] },
      directory,
      'website-pr',
      server.url,
      false,
      true,
    );
    result.expectedCheckIds = run.expectedCheckIds;
    result.inventoryHashes = {
      caseCatalogSha256: core.hash(
        fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/case-catalog.json')),
      ),
      checkManifestSha256: core.hash(
        fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/check-links.json')),
      ),
    };
    runtime.assertFrozen(framework, frozen);
    result.stats = run.report.stats;
    result.reportSha256 = core.hash(fs.readFileSync(run.reportFile));
    if (!core.verifyReport(run.report, run.expectedCheckIds, run.code, result.inventoryHashes))
      throw new Error(
        'Website PR did not pass every unchanged public regression with zero retries',
      );
    result.status = 'verified';
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    process.exitCode = 1;
  } finally {
    if (server) server.stop();
    fs.writeFileSync(path.join(directory, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    fs.writeFileSync(
      path.join(directory, 'result.md'),
      `# Website repair PR verification\n\nStatus: **${result.status}**\n\nWebsite commit: ${result.website.sourceRevision}\n\nFramework commit: ${result.framework.sourceRevision}${flags.includes('--working-tree') ? ' plus recorded local working source' : ''}\n\nChecks: ${result.stats?.expected || 0} passed; ${result.stats?.unexpected || 0} failed; ${result.stats?.skipped || 0} skipped.\n\n${result.error || 'All selected checks passed with zero retries.'}\n\nThis uses an isolated local website build, placeholder service configuration and frozen framework tests. It is not deployed or database acceptance.\n`,
    );
    console.log(`Website PR verification: ${result.status}. Evidence: ${directory}`);
  }
  return result;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
