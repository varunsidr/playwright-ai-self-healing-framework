'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { nativeEnvironment } = require('./run-ecommerce-native');
const project = require('./ecommerce-project');
const root = path.resolve(__dirname, '..');
const cli = require.resolve('@playwright/test/cli');

function launchInspection(files, directory, { onSession = () => {}, onEvent = () => {} } = {}) {
  const log = fs.openSync(path.join(directory, 'browser.log'), 'wx');
  const env = {
    ...nativeEnvironment(),
    ECOMMERCE_BASE_URL: project.publicOrigin,
    ECOMMERCE_STAGING_CONFIRMED: 'false',
    ECOMMERCE_ISOLATED_FIXTURES: 'false',
    PW_OUTPUT_DIR: path.join(directory, 'browser'),
    PW_HTML_REPORT_DIR: path.join(directory, 'html'),
    PW_JSON_REPORT_PATH: path.join(directory, 'results.json'),
    PW_JUNIT_REPORT_PATH: path.join(directory, 'junit.xml'),
    PW_ALLURE_RESULTS_DIR: path.join(directory, 'allure'),
  };
  let session = null,
    pending = '',
    closed = false,
    busy = false;
  const sessions = new Set();
  const invoke = (args) =>
    new Promise((resolve, reject) => {
      const controller = spawn(process.execPath, [cli, 'cli', ...args], {
        cwd: root,
        env,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let text = '';
      controller.stdout.on('data', (data) => {
        text = (text + data).slice(-100000);
      });
      controller.stderr.on('data', (data) => {
        text = (text + data).slice(-100000);
      });
      const timer = setTimeout(() => controller.kill(), 20000);
      controller.once('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      controller.once('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error('Browser control failed; inspect the runner log'));
        else resolve(text.slice(0, 100000));
      });
    });
  const child = spawn(
    process.execPath,
    [
      cli,
      'test',
      ...files,
      '--project=ecommerce-chromium',
      '--retries=0',
      '--workers=1',
      '--debug=cli',
    ],
    {
      cwd: root,
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  const output = (data) => {
    if (closed) return;
    fs.writeSync(log, data);
    pending = (pending + data.toString()).slice(-16000);
    const match = /playwright-cli attach (tw-[a-f0-9]+)/.exec(pending);
    if (!match || session === match[1]) return;
    const next = match[1];
    session = next;
    sessions.add(next);
    pending = '';
    invoke(['attach', next])
      .then(() => {
        if (!closed && session === next) onSession(next);
      })
      .catch((error) => onEvent('attach-failed', error.message));
  };
  child.stdout.on('data', output);
  child.stderr.on('data', output);
  const stop = () => {
    if (closed) return;
    if (process.platform === 'win32' && child.pid)
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
        timeout: 5000,
      });
    else child.kill('SIGTERM');
  };
  const timer = setTimeout(() => {
    onEvent('expired', 'Inspection reached its 15-minute limit');
    stop();
  }, 900000);
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  }).finally(async () => {
    closed = true;
    clearTimeout(timer);
    fs.closeSync(log);
    await Promise.all(
      [...sessions].map((name) => invoke(['--session=' + name, 'detach']).catch(() => {})),
    );
  });
  return {
    completion,
    stop,
    async control(action) {
      if (closed || !session) throw new Error('Wait for the browser session to attach');
      if (busy) throw new Error('A browser control is already in progress');
      const commands = {
        dashboard: 'show',
        resume: 'resume',
        step: 'step-over',
        'record-start': 'recording-start',
        'record-stop': 'recording-stop',
      };
      if (!commands[action]) throw new Error('Unsupported browser control');
      busy = true;
      try {
        return await invoke(['--session=' + session, commands[action]]);
      } finally {
        busy = false;
      }
    },
  };
}

module.exports = { launchInspection };
