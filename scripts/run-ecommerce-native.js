'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const runtime = require('./ecommerce-repair/runtime');
const { collectChecks, checkOutcome } = require('./build-ecommerce-monitoring');
const root = path.resolve(__dirname, '..');
const revision = '843646b7d0c52ef5149f7905b19ec5d87fe5054b';
const hash = (value) => createHash('sha256').update(value).digest('hex');

function nativeEnvironment(inherited = runtime.cleanEnvironment()) {
  return Object.fromEntries(
    Object.entries(inherited).filter(
      ([key]) => !/^(?:DATABASE_URL|DIRECT_URL|PG[A-Z_]+|POSTGRES.*|REDIS.*)$/i.test(key),
    ),
  );
}

function liveOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('Native live checks require a credential-free HTTPS Zeouf origin');
  return url.origin;
}

function tapStats(text) {
  const count = (label) =>
    Number(text.match(new RegExp('^# ' + label + ' (\\d+)\\s*$', 'm'))?.[1] ?? NaN);
  const stats = Object.fromEntries(
    ['tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'].map((label) => [label, count(label)]),
  );
  if (
    !Number.isInteger(stats.tests) ||
    stats.tests < 1 ||
    stats.pass !== stats.tests ||
    ['fail', 'cancelled', 'skipped', 'todo'].some((label) => stats[label] !== 0)
  )
    throw new Error('Native Node test evidence is incomplete or not clean');
  return stats;
}

function browserStats(report, discovered) {
  const observed = collectChecks(report.suites);
  const identity = ({ spec, test }) => JSON.stringify([spec.file, spec.title, test.projectName]);
  const expected = collectChecks(discovered.suites).map(identity).sort();
  if (
    !expected.length ||
    new Set(expected).size !== expected.length ||
    report.errors?.length ||
    JSON.stringify(observed.map(identity).sort()) !== JSON.stringify(expected) ||
    observed.some(
      ({ test }) =>
        checkOutcome(test) !== 'passed' || test.results.length !== 1 || test.results[0].retry !== 0,
    )
  )
    throw new Error('Native browser suite did not pass every discovered check once');
  return report.stats;
}

function sourceHashes(website) {
  return Object.fromEntries(
    runtime
      .command('git', ['ls-files', '-z'], website)
      .split('\0')
      .filter(Boolean)
      .map((file) => {
        const bytes = fs.readFileSync(path.join(website, file));
        return [
          file,
          hash(
            /\.(?:tsx?|jsx?|mjs|json|md|csv|sql|ya?ml|css|txt)$/.test(file)
              ? bytes.toString('utf8').replace(/\r\n/g, '\n')
              : bytes,
          ),
        ];
      }),
  );
}

async function main(args = process.argv.slice(2)) {
  if (args.length !== 2)
    throw new Error(
      'Usage: test:ecommerce:native -- <clean-Zeouf-checkout> <new-evidence-directory>',
    );
  const source = path.resolve(args[0]),
    output = path.resolve(args[1]);
  if (fs.existsSync(output))
    throw new Error('Use a new evidence directory; previous results are retained');
  if (
    runtime.command('git', ['rev-parse', 'HEAD'], source) !== revision ||
    runtime.command('git', ['status', '--porcelain', '--untracked-files=no'], source)
  )
    throw new Error('Use the clean reviewed Zeouf source revision ' + revision);
  const origin = liveOrigin(
    process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app',
  );
  fs.mkdirSync(output, { recursive: true });
  const website = path.join(runtime.makeWorkspace(), 'website');
  const result = {
    schemaVersion: 1,
    status: 'preparing',
    websiteRevision: revision,
    websiteWorkspace: website,
    liveOrigin: origin,
    fullAcceptance: 'not-assessed',
    stages: [],
    caseEvidence: [],
  };
  try {
    runtime.command('git', ['clone', '--quiet', '--no-hardlinks', source, website], root);
    runtime.command('git', ['checkout', '--quiet', '--detach', revision], website);
    if (
      fs.readdirSync(website).some((file) => /^\.env(?:\.|$)/.test(file) && file !== '.env.example')
    )
      throw new Error('Native checkout contains environment files');
    const before = sourceHashes(website);
    fs.writeFileSync(
      path.join(output, 'website-inputs.json'),
      JSON.stringify(before, null, 2) + '\n',
    );
    const execute = async (name, command, args, env = nativeEnvironment()) => {
      const log = path.join(output, name + '.log');
      const execution = await runtime.run(command, args, website, log, { env });
      const stage = {
        name,
        code: execution.code,
        log,
        status: execution.code === 0 ? 'passed' : 'failed',
      };
      result.stages.push(stage);
      return stage;
    };
    const install = await execute('website-install', process.execPath, [
      runtime.npmCli(),
      'ci',
      '--no-audit',
      '--no-fund',
    ]);
    if (install.code !== 0) throw new Error('Native dependency installation failed');
    const npm = (name, script) =>
      execute(name, process.execPath, [runtime.npmCli(), 'run', script]);
    for (const script of ['docs:check', 'docs:sync', 'docs:check']) {
      const stage = await npm(
        'website-' + script.replace(':', '-') + '-' + result.stages.length,
        script,
      );
      if (stage.code !== 0) throw new Error('Native documentation command failed: ' + script);
    }
    for (const [name, file] of [
      ['documentation-tests', 'requirements.test.mjs'],
      ['purchase-sql-tests', 'purchase.test.mjs'],
    ]) {
      const stage = await execute(name, process.execPath, [
        '--test',
        '--test-reporter=tap',
        'scripts/' + file,
      ]);
      stage.stats = tapStats(fs.readFileSync(stage.log, 'utf8'));
      if (stage.code !== 0) throw new Error(name + ' failed');
    }
    const cli = path.join(website, 'node_modules/@playwright/test/cli.js');
    const browserInstall = await execute('native-browser-install', process.execPath, [
      cli,
      'install',
      'chromium',
    ]);
    if (browserInstall.code !== 0) throw new Error('Native Chromium installation failed');
    for (const [name, config] of [
      ['ui', 'playwright.config.ts'],
      ['catalog', 'playwright.catalog.config.ts'],
      ['live', 'playwright.live.config.ts'],
    ]) {
      const env = {
        ...nativeEnvironment(),
        PLAYWRIGHT_BASE_URL: origin,
        PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(output, name + '-results.json'),
      };
      const discovery = JSON.parse(
        runtime.command(
          process.execPath,
          [cli, 'test', '--config=' + config, '--list', '--reporter=json'],
          website,
          { env: { ...env, PLAYWRIGHT_JSON_OUTPUT_FILE: undefined } },
        ),
      );
      fs.writeFileSync(
        path.join(output, name + '-discovery.json'),
        JSON.stringify(discovery, null, 2) + '\n',
      );
      const stage = await execute(
        'native-' + name,
        process.execPath,
        [
          cli,
          'test',
          '--config=' + config,
          '--workers=1',
          '--retries=0',
          '--reporter=line,json',
          '--output=' + path.join(output, name + '-artifacts'),
        ],
        env,
      );
      const reportFile = env.PLAYWRIGHT_JSON_OUTPUT_FILE;
      if (!fs.existsSync(reportFile)) {
        stage.error = 'Missing native JSON report';
        continue;
      }
      const contents = fs.readFileSync(reportFile, 'utf8');
      stage.report = reportFile;
      stage.sha256 = hash(contents);
      try {
        stage.stats = browserStats(JSON.parse(contents), discovery);
      } catch (error) {
        stage.status = 'failed';
        stage.error = error.message;
      }
    }
    result.sourceInputsUnchanged = JSON.stringify(before) === JSON.stringify(sourceHashes(website));
    if (!result.sourceInputsUnchanged)
      throw new Error('Native validation changed tracked website inputs');
    result.caseEvidence = [
      {
        caseId: 'TC-OPS-06-CORE',
        stages: result.stages
          .filter((stage) => /docs|documentation/.test(stage.name))
          .map((stage) => stage.name),
        scope:
          'Pinned docs check/sync and native regression fixtures; manual evidence preservation and drift/review safeguards. No stakeholder sign-off.',
      },
      {
        caseId: 'TC-OPS-07-CORE',
        stages: ['native-ui', 'native-catalog'],
        scope:
          'Native fixture suites run sequentially with dedicated servers, placeholder services and separate artifacts. No migrated live integration claim.',
      },
      {
        caseId: 'TC-OPS-08-CORE',
        stages: ['native-live'],
        scope:
          'Native hosted read-only smoke suite; no local webServer, writes denied by its guard. Public deployed revision remains independently unverified.',
      },
    ].map((item) => ({
      ...item,
      outcome: item.stages.every(
        (name) => result.stages.find((stage) => stage.name === name)?.status === 'passed',
      )
        ? 'passed'
        : 'failed',
    }));
    result.status = result.stages.every((stage) => stage.status === 'passed') ? 'passed' : 'failed';
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
  } finally {
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('Native Zeouf checks: ' + result.status + '. Evidence: ' + output);
    if (result.status !== 'passed') process.exitCode = 1;
  }
  return result;
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main, liveOrigin, tapStats, browserStats, nativeEnvironment };
