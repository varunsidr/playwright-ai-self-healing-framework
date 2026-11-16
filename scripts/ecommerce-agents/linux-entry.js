'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

if (require.main === module) {
  if (process.platform !== 'linux')
    throw new Error('This entry point runs only inside the Linux browser container');
  if (Number(process.versions.node.split('.')[0]) !== 24)
    throw new Error('The browser image must satisfy the Node 24 project policy');
  const cwd = '/tmp/zeouf-matrix';
  fs.cpSync('/source', cwd, { recursive: true });
  const run = (command, args) => {
    const result = spawnSync(command, args, { cwd, env: process.env, stdio: 'inherit' });
    if (result.error || result.status !== 0)
      throw new Error('Linux command failed: ' + command + ' ' + args.slice(0, 2).join(' '));
  };
  run(process.execPath, [
    '/opt/node24/npm/bin/npm-cli.js',
    'ci',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
  ]);
  const version = require(path.join(cwd, 'node_modules/@playwright/test/package.json')).version;
  if (version !== process.env.EXPECTED_PLAYWRIGHT_VERSION)
    throw new Error('Linux package and browser image versions differ');
  fs.writeFileSync(
    '/artifacts/environment.json',
    JSON.stringify(
      { node: process.version, playwright: version, platform: process.platform },
      null,
      2,
    ),
  );
  run(process.execPath, [
    path.join(cwd, 'node_modules/@playwright/test/cli.js'),
    'test',
    '--config=playwright.matrix.config.ts',
    '--retries=0',
    '--workers=1',
  ]);
}
