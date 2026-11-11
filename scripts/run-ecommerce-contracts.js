'use strict';

const fs = require('node:fs');
const path = require('node:path');
const runtime = require('./ecommerce-repair/runtime');
const { nativeEnvironment, tapStats } = require('./run-ecommerce-native');
const { validateSource, fingerprint, revision } = require('./ecommerce-contracts/source');
const root = path.resolve(__dirname, '..');
const inputs = [
  'src/app/api/checkout/route.ts',
  'src/app/api/reviews/route.ts',
  'src/lib/reviewImages.ts',
  'supabase_schema.sql',
  'supabase_reviews_migration.sql',
  'supabase_security_hardening_migration.sql',
  'supabase_review_workflow_migration.sql',
];

async function main(args = process.argv.slice(2)) {
  if (args.length !== 2)
    throw new Error(
      'Usage: test:ecommerce:contracts -- <clean-pinned-website> <new-evidence-directory>',
    );
  const website = validateSource(args[0]);
  const output = path.resolve(args[1]);
  if (fs.existsSync(output))
    throw new Error('Use a new evidence directory; previous evidence is retained.');
  fs.mkdirSync(output, { recursive: true });
  const previousSource = process.env.ECOMMERCE_CONTRACT_SOURCE;
  process.env.ECOMMERCE_CONTRACT_SOURCE = website;
  const before = fingerprint(inputs);
  const result = {
    schemaVersion: 1,
    status: 'running',
    websiteRevision: revision,
    environment: 'isolated-handler-and-postgresql',
    fullAcceptance: 'not-assessed',
    sourceInputs: before,
  };
  try {
    const files = fs
      .readdirSync(path.join(root, 'tests/ecommerce/contracts'))
      .filter((file) => file.endsWith('.test.js'))
      .sort();
    const execution = await runtime.run(
      process.execPath,
      [
        '--test',
        '--test-reporter=tap',
        ...files.map((file) => path.join(root, 'tests/ecommerce/contracts', file)),
      ],
      root,
      path.join(output, 'contracts.log'),
      { env: { ...nativeEnvironment(), ECOMMERCE_CONTRACT_SOURCE: website } },
    );
    result.sourceInputsUnchanged = JSON.stringify(before) === JSON.stringify(fingerprint(inputs));
    if (execution.code !== 0) throw new Error('Checkout/review contract tests failed.');
    result.stats = tapStats(fs.readFileSync(path.join(output, 'contracts.log'), 'utf8'));
    if (!result.sourceInputsUnchanged)
      throw new Error('Website inputs changed during contract execution.');
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    process.exitCode = 1;
    console.error(error.message);
    const log = path.join(output, 'contracts.log');
    if (fs.existsSync(log))
      console.error(fs.readFileSync(log, 'utf8').split('\n').slice(-100).join('\n'));
  } finally {
    if (previousSource === undefined) delete process.env.ECOMMERCE_CONTRACT_SOURCE;
    else process.env.ECOMMERCE_CONTRACT_SOURCE = previousSource;
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('Local ecommerce contracts: ' + result.status + '. Evidence: ' + output);
  }
  return result;
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
