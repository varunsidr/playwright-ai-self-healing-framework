'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { record } = require('./record-ecommerce-history');
function fixture(metadata = {}) {
  return {
    config: { metadata },
    stats: { startTime: '2026-11-09T00:00:00Z' },
    suites: [
      {
        specs: [
          {
            file: 'case.spec.ts',
            title: 'A check',
            tests: [
              {
                projectName: 'ecommerce-chromium',
                expectedStatus: 'passed',
                status: 'flaky',
                results: [
                  { status: 'failed', retry: 0, duration: 5 },
                  { status: 'passed', retry: 1, duration: 4 },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}
test('history is immutable/idempotent and preserves the initial failure of a retry pass', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-history-'));
  const report = path.join(dir, 'report.json');
  fs.writeFileSync(
    report,
    JSON.stringify(
      fixture({
        codeRevision: 'a'.repeat(40),
        websiteRevision: 'b'.repeat(40),
        caseCatalogSha256: 'c',
        checkManifestSha256: 'd',
      }),
    ),
  );
  record(report, path.join(dir, 'history'));
  record(report, path.join(dir, 'history'));
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'history/summary.json')));
  assert.equal(summary.runs.length, 1);
  assert.equal(summary.runs[0].flaky, 1);
  assert.equal(summary.comparableGroups[0].firstAttemptFailures, 1);
});
test('history retains unknown builds without pretending they are comparable', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-history-unknown-'));
  const file = path.join(dir, 'report.json');
  fs.writeFileSync(file, JSON.stringify(fixture()));
  const entry = record(file, path.join(dir, 'history'));
  assert.equal(entry.comparisonEligible, false);
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(dir, 'history/summary.json'))).comparableGroups,
    [],
  );
});

test('history compares the same isolated fixture across ephemeral ports without merging public targets', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-history-local-'));
  const metadata = {
    codeRevision: 'a'.repeat(40),
    websiteRevision: 'b'.repeat(40),
    caseCatalogSha256: 'c',
    checkManifestSha256: 'd',
    ecommerceEnvironment: 'isolated-browser-fixture',
  };
  for (const [index, ecommerceOrigin] of [
    'http://127.0.0.1:31001',
    'http://127.0.0.1:31002',
  ].entries()) {
    const file = path.join(dir, index + '.json');
    fs.writeFileSync(file, JSON.stringify(fixture({ ...metadata, ecommerceOrigin })));
    record(file, path.join(dir, 'history'));
  }
  for (const [index, ecommerceOrigin] of ['https://a.example', 'https://b.example'].entries()) {
    const file = path.join(dir, 'public-' + index + '.json');
    fs.writeFileSync(
      file,
      JSON.stringify(
        fixture({ ...metadata, ecommerceOrigin, ecommerceEnvironment: 'public-read-only' }),
      ),
    );
    record(file, path.join(dir, 'history'));
  }
  const summary = JSON.parse(fs.readFileSync(path.join(dir, 'history/summary.json')));
  assert.equal(summary.runs.length, 4);
  assert.equal(summary.comparableGroups.length, 3);
  assert.equal(
    summary.comparableGroups.find(
      (group) => group.comparisonOrigin === 'local:isolated-browser-fixture',
    ).observations,
    2,
  );
  assert.notEqual(summary.runs[0].origin, summary.runs[1].origin);
});
