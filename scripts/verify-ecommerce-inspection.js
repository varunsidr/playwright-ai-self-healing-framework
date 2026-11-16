'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createWorkspace } = require('./ecommerce-workspace');

async function main() {
  const directory = path.resolve(process.argv[2] || 'test-results/inspection-verification');
  if (fs.existsSync(directory)) throw new Error('Use a new inspection verification directory');
  fs.mkdirSync(directory, { recursive: true });
  const server = createWorkspace({ directory: path.join(directory, 'workspace') });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let inspection;
  const html = await (await fetch(origin)).text();
  const token = /name="workspace-token" content="([a-f0-9]+)"/.exec(html)[1];
  const api = async (endpoint, input) => {
    const response = await fetch(
      origin + endpoint,
      input
        ? {
            method: 'POST',
            headers: { origin, 'content-type': 'application/json', 'x-workspace-token': token },
            body: JSON.stringify(input),
          }
        : undefined,
    );
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    return body;
  };
  const waitFor = async (id, predicate) => {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      const job = await api('/api/runs/' + id);
      if (predicate(job)) return job;
      if (job.status !== 'running')
        throw new Error(job.error || 'Inspection ended before the expected state; see browser.log');
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw new Error('Inspection state timed out; see browser.log');
  };
  try {
    inspection = await api('/api/inspect', { caseId: 'TC-CNT-001-01' });
    const attached = await waitFor(inspection.id, (job) => Boolean(job.session));
    console.log('Attached ' + attached.session);
    const control = (action) => api('/api/control', { runId: inspection.id, action });
    const cli = (args) => {
      const result = spawnSync(
        process.execPath,
        [require.resolve('@playwright/test/cli'), 'cli', '--session=' + attached.session, ...args],
        {
          cwd: path.resolve(__dirname, '..'),
          encoding: 'utf8',
          windowsHide: true,
          timeout: 25000,
          maxBuffer: 1024 * 1024,
        },
      );
      if (result.status !== 0 || result.error)
        throw new Error(
          'Verification CLI action failed: ' + (result.stderr || result.error?.message),
        );
      fs.appendFileSync(path.join(directory, 'cli.log'), result.stdout);
      return result.stdout;
    };
    // Advance fixture setup and the first navigation while keeping the actual test paused.
    let snapshot = '';
    for (let index = 0; index < 15; index++) {
      await control('step');
      snapshot = cli(['snapshot']);
      if (snapshot.includes('zeouf home')) break;
    }
    assert.match(snapshot, /zeouf home/);
    await control('record-start');
    // A read-only home link supplies a real recorded browser interaction.
    cli(['click', "getByRole('link', { name: 'zeouf home', exact: true })"]);
    await control('record-stop');
    const recorded = await api('/api/runs/' + inspection.id);
    assert.equal(recorded.recordings.length, 1);
    const draft = await (
      await fetch(origin + `/api/runs/${inspection.id}/recordings/${recorded.recordings[0].file}`)
    ).text();
    assert.match(draft, /click|goto/);
    await control('resume');
    const ended = await waitFor(inspection.id, (job) => job.status !== 'running');
    assert.equal(ended.status, 'inspection-ended');
    assert.equal(fs.existsSync(path.join(directory, 'workspace/history')), false);
    const verification = await api('/api/run', {
      caseId: inspection.caseId,
      verificationOf: inspection.id,
    });
    const verified = await waitFor(verification.id, (job) => job.status !== 'running');
    assert.equal(verified.status, 'passed');
    assert.equal(verified.provenance.inspectionInputsUnchanged, true);
    fs.writeFileSync(
      path.join(directory, 'result.json'),
      JSON.stringify({ status: 'passed', inspection: ended, verification: verified }, null, 2),
    );
    console.log(
      'Real inspection, recorded action, and fresh automated verification passed: ' + directory,
    );
  } finally {
    if (inspection)
      await api('/api/control', { runId: inspection.id, action: 'stop' }).catch(() => {});
    await new Promise((resolve) => server.close(resolve));
  }
}

if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
