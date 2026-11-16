'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const runtime = require('./ecommerce-repair/runtime');
const { safePath, hash } = require('./ecommerce-repair/core');
const { nativeEnvironment } = require('./run-ecommerce-native');
const { collectChecks, checkOutcome } = require('./build-ecommerce-monitoring');
const root = path.resolve(__dirname, '..');

async function main(output = process.argv[2]) {
  if (!output) throw new Error('Supply a new Linux matrix evidence directory');
  output = path.resolve(output);
  if (fs.existsSync(output)) throw new Error('Use a new evidence directory');
  fs.mkdirSync(output, { recursive: true });
  const version = require('@playwright/test/package.json').version;
  const image = `mcr.microsoft.com/playwright:v${version}-noble`;
  const name = 'zeouf-matrix-' + randomUUID();
  const wrapper = 'zeouf-playwright-node24:' + randomUUID();
  const state = {
    status: 'running',
    image,
    container: name,
    startedAt: new Date().toISOString(),
    sourceHashes: {},
  };
  try {
    const source = path.join(output, 'source'),
      artifacts = path.join(output, 'artifacts');
    fs.mkdirSync(source);
    fs.mkdirSync(artifacts);
    const files = runtime
      .command('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], root)
      .split('\0')
      .filter(Boolean);
    for (const file of files) {
      if (/(^|\/)\.(?:env(?:\.|$)|git|codex|vscode|agents)/.test(file)) continue;
      const from = safePath(root, file),
        to = safePath(source, file);
      if (!fs.existsSync(from)) continue;
      if (!fs.lstatSync(from).isFile())
        throw new Error('Linux snapshot requires regular source files');
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      state.sourceHashes[file] = hash(fs.readFileSync(from));
    }
    const env = nativeEnvironment();
    const pull = await runtime.run(
      'docker',
      ['pull', image],
      root,
      path.join(output, 'image-pull.log'),
      { env, timeout: 600000 },
    );
    if (pull.code !== 0) throw new Error('Official Playwright Linux image could not be pulled');
    state.imageId = runtime.command(
      'docker',
      ['image', 'inspect', image, '--format', '{{.Id}}'],
      root,
    );
    if (Number(process.versions.node.split('.')[0]) !== 24)
      throw new Error('Run this framework with Node 24');
    const build = path.join(output, 'image');
    fs.mkdirSync(build);
    const dockerfile = `FROM node:${process.versions.node}-bookworm-slim AS node24\nFROM ${image}\nCOPY --from=node24 /usr/local/bin/node /opt/node24/node\nCOPY --from=node24 /usr/local/lib/node_modules/npm /opt/node24/npm\nENV PATH="/opt/node24:$PATH"\n`;
    fs.writeFileSync(path.join(build, 'Dockerfile'), dockerfile);
    const built = await runtime.run(
      'docker',
      ['build', '--tag', wrapper, build],
      root,
      path.join(output, 'image-build.log'),
      { env, timeout: 600000 },
    );
    if (built.code !== 0) throw new Error('Node 24 browser image could not be built');
    state.nodeVersion = process.version;
    state.wrapperImageId = runtime.command(
      'docker',
      ['image', 'inspect', wrapper, '--format', '{{.Id}}'],
      root,
    );
    const run = await runtime.run(
      'docker',
      [
        'run',
        '--rm',
        '--init',
        '--name',
        name,
        '--shm-size=1g',
        '--memory=3g',
        '--cpus=2',
        '--mount',
        `type=bind,source=${source},target=/source,readonly`,
        '--mount',
        `type=bind,source=${artifacts},target=/artifacts`,
        '-e',
        'CI=1',
        '-e',
        'ECOMMERCE_STAGING_CONFIRMED=false',
        '-e',
        `ECOMMERCE_BASE_URL=${require('./ecommerce-project').publicOrigin}`,
        '-e',
        `EXPECTED_PLAYWRIGHT_VERSION=${version}`,
        '-e',
        'PW_OUTPUT_DIR=/artifacts/browser',
        '-e',
        'PW_HTML_REPORT_DIR=/artifacts/html',
        '-e',
        'PW_JSON_REPORT_PATH=/artifacts/results.json',
        '-e',
        'PW_JUNIT_REPORT_PATH=/artifacts/junit.xml',
        '-e',
        'PW_ALLURE_RESULTS_DIR=/artifacts/allure',
        wrapper,
        '/opt/node24/node',
        '/source/scripts/ecommerce-agents/linux-entry.js',
      ],
      root,
      path.join(output, 'runner.log'),
      { env, timeout: 600000 },
    );
    state.exitCode = run.code;
    const report = JSON.parse(fs.readFileSync(path.join(artifacts, 'results.json'), 'utf8'));
    const checks = collectChecks(report.suites);
    state.checks = checks.map(({ spec, test }) => ({
      project: test.projectName,
      title: spec.title,
      outcome: checkOutcome(test),
    }));
    if (
      run.code !== 0 ||
      report.errors?.length ||
      checks.length !== 20 ||
      checks.some(
        ({ test }) =>
          checkOutcome(test) !== 'passed' ||
          test.results.length !== 1 ||
          test.results[0].retry !== 0,
      )
    )
      throw new Error('Linux browser matrix did not pass every selected check once');
    state.status = 'passed';
  } catch (error) {
    state.status = 'blocked';
    state.error = error.message;
    process.exitCode = 1;
  } finally {
    const inspect = spawnSync('docker', ['inspect', name], { stdio: 'ignore', windowsHide: true });
    if (inspect.status === 0)
      spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore', windowsHide: true });
    const remaining = spawnSync(
      'docker',
      ['ps', '-a', '--filter', `name=^/${name}$`, '--format', '{{.ID}}'],
      { encoding: 'utf8', windowsHide: true },
    );
    state.containerRemoved = remaining.status === 0 && !remaining.stdout.trim();
    if (!state.containerRemoved) {
      state.status = 'blocked';
      state.error =
        (state.error ? state.error + '; ' : '') + 'Container cleanup could not be verified';
      process.exitCode = 1;
    }
    spawnSync('docker', ['image', 'rm', wrapper], { stdio: 'ignore', windowsHide: true });
    state.finishedAt = new Date().toISOString();
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(state, null, 2));
    console.log('Linux browser matrix: ' + state.status + '. Evidence: ' + output);
  }
  return state;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
