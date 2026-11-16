'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createWorkspace, selection } = require('./ecommerce-workspace');

test('workspace selection accepts only reviewed public-safe case files', () => {
  assert.deepEqual(selection('TC-CNT-001-01'), ['tests/ecommerce/newsletter-preview.spec.ts']);
  assert.throws(() => selection('../../secrets'), /Unknown case/);
  assert.throws(() => selection('TC-CHK-007-01'), /separate isolated or native runner/);
});

test('interactive success remains an inspection, retains intervention drafts, and requires fresh verification', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-inspection-test-'));
  let finish;
  const report = {
    config: { metadata: {} },
    errors: [],
    suites: [
      {
        specs: [
          {
            title: 'newsletter',
            tests: [
              {
                projectName: 'ecommerce-chromium',
                expectedStatus: 'passed',
                status: 'expected',
                results: [{ status: 'passed', retry: 0 }],
              },
            ],
          },
        ],
      },
    ],
  };
  const server = createWorkspace({
    directory,
    inspector(files, folder, hooks) {
      fs.writeFileSync(path.join(folder, 'results.json'), JSON.stringify(report));
      hooks.onSession('tw-123abc');
      return {
        completion: new Promise((resolve) => {
          finish = resolve;
        }),
        stop() {
          finish(0);
        },
        async control(action) {
          return action === 'record-stop' ? "await page.getByRole('button').click();" : '';
        },
      };
    },
    launcher(files, folder) {
      fs.writeFileSync(path.join(folder, 'results.json'), JSON.stringify(report));
      return { completion: Promise.resolve(0), stop() {} };
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const token = /name="workspace-token" content="([a-f0-9]+)"/.exec(
    await (await fetch(origin)).text(),
  )[1];
  const post = (endpoint, body, source = origin) =>
    fetch(origin + endpoint, {
      method: 'POST',
      headers: { origin: source, 'content-type': 'application/json', 'x-workspace-token': token },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await post('/api/inspect', { caseId: 'TC-CNT-001-01' }, 'https://untrusted.example')).status,
    403,
  );
  const job = await (await post('/api/inspect', { caseId: 'TC-CNT-001-01' })).json();
  assert.equal(job.kind, 'inspection');
  assert.equal((await post('/api/control', { runId: job.id, action: 'run-code' })).status, 400);
  assert.equal((await post('/api/control', { runId: 'other', action: 'resume' })).status, 409);
  assert.equal((await post('/api/control', { runId: job.id, action: 'record-start' })).status, 200);
  const recording = await (
    await post('/api/control', { runId: job.id, action: 'record-stop' })
  ).json();
  assert.equal(recording.recordings[0].status, 'draft-unverified');
  assert.equal(
    (await fetch(origin + '/api/runs/' + job.id + '/recordings/recording-1.txt')).status,
    200,
  );
  assert.equal(
    (await fetch(origin + '/api/runs/' + job.id + '/recordings/recording-99.txt')).status,
    404,
  );
  assert.equal(
    fs.readFileSync(path.join(directory, 'runs', job.id, 'recording-1.txt'), 'utf8'),
    "await page.getByRole('button').click();",
  );
  finish(0);
  await new Promise((resolve) => setImmediate(resolve));
  const detail = await (await fetch(origin + '/api/runs/' + job.id)).json();
  assert.equal(detail.status, 'inspection-ended');
  assert.equal(detail.automatedOutcome, 'passed');
  assert.equal(detail.interventions.length, 2);
  assert.equal(fs.existsSync(path.join(directory, 'history')), false);
  assert.equal(
    (await post('/api/run', { caseId: 'TC-CNT-001-01', verificationOf: 'unknown' })).status,
    422,
  );
  const verification = await (
    await post('/api/run', { caseId: job.caseId, verificationOf: job.id })
  ).json();
  await new Promise((resolve) => setImmediate(resolve));
  const verified = await (await fetch(origin + '/api/runs/' + verification.id)).json();
  assert.equal(verified.status, 'passed');
  assert.equal(verified.verificationOf, job.id);
  assert.equal(verified.provenance.inspectionInputsUnchanged, true);
  assert.equal(fs.existsSync(path.join(directory, 'history/summary.json')), true);
});

test('workspace rejects external origins and arbitrary execution inputs and preserves a failed batch', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-workspace-test-'));
  let finish,
    launched = 0;
  const server = createWorkspace({
    directory,
    launcher(files, folder) {
      launched++;
      assert.deepEqual(files, ['tests/ecommerce/newsletter-preview.spec.ts']);
      fs.writeFileSync(
        path.join(folder, 'results.json'),
        JSON.stringify({
          config: { metadata: {} },
          errors: [],
          suites: [
            {
              specs: [
                {
                  title: 'unchanged expectation',
                  file: files[0],
                  tests: [
                    {
                      projectName: 'ecommerce-chromium',
                      expectedStatus: 'passed',
                      status: 'unexpected',
                      results: [{ status: 'failed', retry: 0 }],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      );
      return {
        completion: new Promise((resolve) => {
          finish = resolve;
        }),
        stop() {},
      };
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const html = await (await fetch(origin)).text();
  const token = /name="workspace-token" content="([a-f0-9]+)"/.exec(html)[1];
  const post = (body, overrides = {}) =>
    fetch(origin + '/api/run', {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        'x-workspace-token': token,
        ...overrides,
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await post({ caseId: 'TC-CNT-001-01' }, { origin: 'https://untrusted.example' })).status,
    403,
  );
  assert.equal((await post({ caseId: 'TC-CNT-001-01', args: ['--update-snapshots'] })).status, 400);
  assert.equal((await post({ caseId: 'TC-CHK-007-01' })).status, 422);
  assert.equal((await fetch(origin + '/api/runs/../../package.json')).status, 404);
  assert.equal(launched, 0);
  const response = await post({ caseId: 'TC-CNT-001-01' });
  assert.equal(response.status, 202);
  const job = await response.json();
  assert.equal((await post({ caseId: 'TC-CNT-001-01' })).status, 409);
  finish(1);
  await new Promise((resolve) => setImmediate(resolve));
  const detail = await (await fetch(origin + '/api/runs/' + job.id)).json();
  assert.equal(detail.status, 'failed');
  assert.equal(detail.checks[0].outcome, 'failed');
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(directory, 'history/summary.json'))).runs[0].failed,
    1,
  );
});
