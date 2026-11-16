'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { randomBytes, randomUUID, createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const { files: publicFiles } = require('./run-ecommerce-read-only');
const { nativeEnvironment } = require('./run-ecommerce-native');
const { collectChecks, checkOutcome } = require('./build-ecommerce-monitoring');
const { record } = require('./record-ecommerce-history');
const project = require('./ecommerce-project');
const { launchInspection } = require('./ecommerce-inspection');
const root = path.resolve(__dirname, '..');
const catalog = require('../specs/ecommerce/requirements/case-catalog.json');
const manifest = require('../specs/ecommerce/requirements/check-links.json');
const other = require('../specs/ecommerce/requirements/non-browser-check-links.json');

function selection(caseId) {
  if (!catalog.cases.some((item) => item.id === caseId)) throw new Error('Unknown case');
  const files = [
    ...new Set(
      manifest.checks
        .filter((item) => item.caseIds.includes(caseId))
        .map((item) => item.file)
        .filter((file) => publicFiles.includes(file)),
    ),
  ];
  if (!files.length) throw new Error('This case needs a separate isolated or native runner');
  return files;
}

function launch(files, directory) {
  const log = fs.openSync(path.join(directory, 'browser.log'), 'wx');
  const child = spawn(
    process.execPath,
    [
      path.join(root, 'node_modules/@playwright/test/cli.js'),
      'test',
      ...files,
      '--project=ecommerce-chromium',
      '--retries=0',
      '--workers=1',
    ],
    {
      cwd: root,
      env: {
        ...nativeEnvironment(),
        CI: '1',
        ECOMMERCE_BASE_URL: project.publicOrigin,
        ECOMMERCE_STAGING_CONFIRMED: 'false',
        ECOMMERCE_ISOLATED_FIXTURES: 'false',
        PW_OUTPUT_DIR: path.join(directory, 'browser'),
        PW_HTML_REPORT_DIR: path.join(directory, 'html'),
        PW_JSON_REPORT_PATH: path.join(directory, 'results.json'),
        PW_JUNIT_REPORT_PATH: path.join(directory, 'junit.xml'),
        PW_ALLURE_RESULTS_DIR: path.join(directory, 'allure'),
      },
      stdio: ['ignore', log, log],
    },
  );
  const timer = setTimeout(() => child.kill(), 300000);
  const completion = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code) => resolve(code));
  }).finally(() => {
    clearTimeout(timer);
    fs.closeSync(log);
  });
  return { completion, stop: () => child.kill() };
}

function createWorkspace({
  directory = path.join(root, 'test-results/workspace'),
  launcher = launch,
  inspector = launchInspection,
} = {}) {
  directory = path.resolve(directory);
  fs.mkdirSync(path.join(directory, 'runs'), { recursive: true });
  const token = randomBytes(32).toString('hex');
  let active = null;
  const jobs = () =>
    fs
      .readdirSync(path.join(directory, 'runs'))
      .filter((id) => /^[a-f0-9-]{36}$/.test(id))
      .flatMap((id) => {
        const file = path.join(directory, 'runs', id, 'job.json');
        if (!fs.existsSync(file)) return [];
        const job = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (job.status === 'running' && job.id !== active?.id)
          return [
            {
              ...job,
              status: 'interrupted',
              error: 'Workspace stopped before completion was recorded.',
            },
          ];
        return [job];
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const server = http.createServer(async (request, response) => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const send = (status, value, type = 'application/json') => {
      response.writeHead(status, {
        'content-type': type + '; charset=utf-8',
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'content-security-policy':
          "default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'",
      });
      response.end(type === 'application/json' ? JSON.stringify(value) : value);
    };
    if (request.headers.host !== new URL(origin).host) return send(403, { error: 'Invalid host' });
    const url = new URL(request.url, origin);
    try {
      if (request.method === 'GET') {
        if (url.pathname === '/') {
          const html = fs.readFileSync(
            path.join(root, 'tools/ecommerce-workspace/index.html'),
            'utf8',
          );
          return send(200, html.replace('__SESSION_TOKEN__', token), 'text/html');
        }
        const assets = { '/workspace.js': 'application/javascript', '/workspace.css': 'text/css' };
        if (assets[url.pathname])
          return send(
            200,
            fs.readFileSync(
              path.join(root, 'tools/ecommerce-workspace', url.pathname.slice(1)),
              'utf8',
            ),
            assets[url.pathname],
          );
        if (url.pathname === '/api/cases')
          return send(200, {
            project: project.name,
            origin: project.publicOrigin,
            cases: catalog.cases.map((item) => {
              const checks = manifest.checks.filter((check) => check.caseIds.includes(item.id));
              return {
                ...item,
                checks,
                otherChecks: other.checks.filter((check) => check.caseIds.includes(item.id)),
                runnableFiles: [
                  ...new Set(
                    checks.map((check) => check.file).filter((file) => publicFiles.includes(file)),
                  ),
                ],
              };
            }),
          });
        if (url.pathname === '/api/runs')
          return send(200, { active: active?.id || null, jobs: jobs() });
        const recording = /^\/api\/runs\/([a-f0-9-]{36})\/recordings\/(recording-\d+\.txt)$/.exec(
          url.pathname,
        );
        if (recording) {
          const job = jobs().find((item) => item.id === recording[1]);
          if (!job?.recordings?.some((item) => item.file === recording[2]))
            return send(404, { error: 'Unknown recording draft' });
          return send(
            200,
            fs.readFileSync(path.join(directory, 'runs', job.id, recording[2]), 'utf8'),
            'text/plain',
          );
        }
        const detail = /^\/api\/runs\/([a-f0-9-]{36})$/.exec(url.pathname);
        if (detail) {
          const job = jobs().find((item) => item.id === detail[1]);
          if (!job) return send(404, { error: 'Run not found' });
          const log = path.join(directory, 'runs', job.id, 'browser.log');
          return send(200, {
            ...job,
            log: fs.existsSync(log) ? fs.readFileSync(log, 'utf8').slice(-60000) : '',
          });
        }
        return send(404, { error: 'Not found' });
      }
      if (
        request.method !== 'POST' ||
        !['/api/run', '/api/inspect', '/api/control'].includes(url.pathname)
      )
        return send(405, { error: 'Unsupported operation' });
      if (request.headers.origin !== origin || request.headers['x-workspace-token'] !== token)
        return send(403, { error: 'Open this workspace locally before starting a run' });
      if (request.headers['content-type'] !== 'application/json')
        return send(415, { error: 'JSON required' });
      let body = '';
      for await (const chunk of request) {
        body += chunk;
        if (body.length > 4096) return send(413, { error: 'Request too large' });
      }
      const input = JSON.parse(body);
      if (url.pathname === '/api/control') {
        if (
          Object.keys(input).sort().join(',') !== 'action,runId' ||
          !['dashboard', 'resume', 'step', 'record-start', 'record-stop', 'stop'].includes(
            input.action,
          )
        )
          return send(400, { error: 'Supply a runId and a supported browser action' });
        if (!active || input.runId !== active.id || !active.control)
          return send(409, { error: 'No matching active inspection' });
        const job = active.job;
        job.interventions.push({
          action: input.action,
          session: job.session || null,
          at: new Date().toISOString(),
          status: 'requested',
        });
        const event = job.interventions.at(-1);
        active.save();
        try {
          const result =
            input.action === 'stop' ? active.stop() : await active.control(input.action);
          event.status = 'completed';
          if (input.action === 'record-stop') {
            const content = String(result);
            const file = `recording-${job.recordings.length + 1}.txt`;
            fs.writeFileSync(path.join(directory, 'runs', job.id, file), content, { flag: 'wx' });
            job.recordings.push({
              file,
              sha256: createHash('sha256').update(content).digest('hex'),
              at: event.at,
              status: 'draft-unverified',
            });
          }
          fs.writeFileSync(
            path.join(directory, 'runs', job.id, 'job.json'),
            JSON.stringify(job, null, 2),
          );
          return send(200, { status: 'completed', recordings: job.recordings });
        } catch (error) {
          event.status = 'failed';
          event.error = error.message;
          fs.writeFileSync(
            path.join(directory, 'runs', job.id, 'job.json'),
            JSON.stringify(job, null, 2),
          );
          return send(409, { error: error.message });
        }
      }
      if (
        Object.keys(input).some((key) => !['caseId', 'verificationOf'].includes(key)) ||
        typeof input.caseId !== 'string' ||
        (input.verificationOf !== undefined && typeof input.verificationOf !== 'string')
      )
        return send(400, {
          error: 'Supply a catalog caseId and optional inspection verificationOf',
        });
      if (url.pathname === '/api/inspect' && input.verificationOf !== undefined)
        return send(400, { error: 'Start a fresh automated run to verify an inspection' });
      if (
        input.verificationOf &&
        !jobs().some(
          (job) =>
            job.id === input.verificationOf &&
            job.kind === 'inspection' &&
            job.caseId === input.caseId &&
            job.status !== 'running',
        )
      )
        return send(422, {
          error: 'Verification must reference a finished inspection of the same case',
        });
      let files;
      try {
        files = selection(input.caseId);
      } catch (error) {
        return send(422, { error: error.message });
      }
      if (active) return send(409, { error: 'A run is already in progress' });
      const id = randomUUID();
      const folder = path.join(directory, 'runs', id);
      fs.mkdirSync(folder);
      const job = {
        id,
        caseId: input.caseId,
        files,
        status: 'running',
        startedAt: new Date().toISOString(),
        origin: project.publicOrigin,
        websiteRevision: null,
        kind: url.pathname === '/api/inspect' ? 'inspection' : 'verification',
        verificationOf: input.verificationOf || null,
        interventions: [],
        recordings: [],
        sessions: [],
        provenance: {
          playwrightVersion: require('@playwright/test/package.json').version,
          inputsSha256: createHash('sha256')
            .update(
              JSON.stringify([
                catalog.cases.find((item) => item.id === input.caseId),
                ...files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')),
                ...[
                  'fixtures/ecommerce-base.ts',
                  'pages/ecommerce-storefront-page.ts',
                  'playwright.config.ts',
                  'package-lock.json',
                ].map((file) => fs.readFileSync(path.join(root, file), 'utf8')),
              ]),
            )
            .digest('hex'),
        },
        scope:
          'All tests in the reviewed public-safe files for this case; a batch can include other cases. Read-only, zero retries. Hosted revision is unknown.',
      };
      if (job.kind === 'inspection')
        job.scope =
          'Interactive inspection of the reviewed public-safe files. Manual actions and recording drafts are retained. Requires a separate fresh automated verification; this run cannot establish acceptance.';
      if (job.verificationOf)
        job.provenance.inspectionInputsUnchanged =
          jobs().find((item) => item.id === job.verificationOf)?.provenance.inputsSha256 ===
          job.provenance.inputsSha256;
      const save = () =>
        fs.writeFileSync(path.join(folder, 'job.json'), JSON.stringify(job, null, 2));
      save();
      active = { id, job, save, stop() {} };
      try {
        const execution =
          job.kind === 'inspection'
            ? inspector(files, folder, {
                onSession(session) {
                  job.session = session;
                  job.sessions.push({ session, attachedAt: new Date().toISOString() });
                  save();
                },
                onEvent(action, detail) {
                  job.interventions.push({ action, detail, at: new Date().toISOString() });
                  save();
                },
              })
            : launcher(files, folder);
        active.stop = execution.stop;
        active.control = execution.control;
        execution.completion
          .then((code) => {
            job.exitCode = code;
            const reportFile = path.join(folder, 'results.json');
            if (job.kind === 'inspection' && !fs.existsSync(reportFile)) {
              job.status = 'inspection-ended';
              return;
            }
            if (!fs.existsSync(reportFile))
              throw new Error('Runner did not produce a results report');
            const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
            const checks = collectChecks(report.suites || []).map(({ spec, test }) => ({
              title: spec.title,
              outcome: checkOutcome(test),
              attempts: test.results?.length || 0,
            }));
            job.checks = checks;
            job.status =
              code === 0 &&
              !report.errors?.length &&
              checks.length &&
              checks.every((check) => check.outcome === 'passed' && check.attempts === 1)
                ? 'passed'
                : 'failed';
            if (job.kind === 'inspection') {
              job.automatedOutcome = job.status;
              job.status = 'inspection-ended';
            } else record(reportFile, path.join(directory, 'history'));
          })
          .catch((error) => {
            job.status = job.kind === 'inspection' ? 'inspection-ended' : 'failed';
            job.error = error.message;
          })
          .finally(() => {
            job.finishedAt = new Date().toISOString();
            save();
            active = null;
          });
      } catch (error) {
        job.status = job.kind === 'inspection' ? 'inspection-ended' : 'failed';
        job.error = error.message;
        active = null;
        save();
      }
      return send(202, job);
    } catch (error) {
      return send(400, { error: error.message });
    }
  });
  server.requestTimeout = 15000;
  server.on('close', () => active?.stop());
  return server;
}
if (require.main === module) {
  const server = createWorkspace();
  server.listen(0, '127.0.0.1', () =>
    console.log(`Zeouf local workspace: http://127.0.0.1:${server.address().port}`),
  );
  process.once('SIGINT', () => server.close());
  process.once('SIGTERM', () => server.close());
}
module.exports = { createWorkspace, selection };
