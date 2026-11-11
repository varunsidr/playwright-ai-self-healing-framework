'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateOrigin } = require('./ci-report-origin');
const { build } = require('./build-ci-report-site');
const sha = 'a'.repeat(40);
const run = () => ({
  name: 'Playwright Tests',
  status: 'completed',
  conclusion: 'failure',
  event: 'push',
  head_branch: 'main',
  head_repository: { full_name: 'owner/repo' },
  head_sha: sha,
  id: 123,
  run_attempt: 1,
});
test('report publication rejects PRs, forks, stale revisions and unfinished runs', () => {
  assert.equal(validateOrigin(run(), 'owner/repo', 'main', sha).testConclusion, 'failure');
  for (const change of [
    { event: 'pull_request' },
    { head_repository: { full_name: 'fork/repo' } },
    { head_sha: 'b'.repeat(40) },
    { status: 'in_progress' },
    { name: 'other workflow' },
  ])
    assert.throws(() => validateOrigin({ ...run(), ...change }, 'owner/repo', 'main', sha));
});
test('publisher preserves original failed evidence without rerunning or rewriting tests', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-report-test-'));
  const downloads = path.join(directory, 'downloads');
  fs.mkdirSync(path.join(downloads, 'playwright-report/ecommerce'), { recursive: true });
  const html = '<html>Original failing test report</html>';
  fs.writeFileSync(path.join(downloads, 'playwright-report/ecommerce/index.html'), html);
  const result = build(
    validateOrigin(run(), 'owner/repo', 'main', sha),
    downloads,
    path.join(directory, 'site'),
  );
  assert.equal(result.testConclusion, 'failure');
  assert.equal(result.publicationIsTestPass, false);
  assert.equal(
    fs.readFileSync(path.join(directory, 'site/reports/ecommerce/index.html'), 'utf8'),
    html,
  );
  assert.match(
    fs.readFileSync(path.join(directory, 'site/index.html'), 'utf8'),
    /Original test conclusion: <strong>failure/,
  );
});
test('missing artifacts remain missing instead of becoming a synthetic passing report', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-report-empty-'));
  assert.deepEqual(
    build(validateOrigin(run(), 'owner/repo', 'main', sha), directory, path.join(directory, 'site'))
      .reports,
    [],
  );
  assert.match(
    fs.readFileSync(path.join(directory, 'site/index.html'), 'utf8'),
    /No HTML report artifact/,
  );
});
