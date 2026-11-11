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
