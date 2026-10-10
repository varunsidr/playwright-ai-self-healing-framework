'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const catalog = require('../specs/ecommerce/requirements/case-catalog.json');
const manifest = require('../specs/ecommerce/requirements/check-links.json');
const {
  buildMonitoring,
  checkOutcome,
  combinedOutcome,
  validateManifest,
  renderMonitoring,
} = require('./build-ecommerce-monitoring');

function reportFor(check = manifest.checks[0], overrides = {}) {
  return {
    config: { rootDir: '/workspace/tests', metadata: { codeRevision: 'test-revision' } },
    suites: [
      {
        title: 'Pilot',
        specs: [
          {
            id: check.id,
            title: 'Example check',
            file: check.file.replace(/^tests\//, ''),
            tests: [
              {
                projectName: check.project,
                annotations: [{ type: 'zeouf-check', description: check.id }],
                expectedStatus: 'passed',
                status: 'expected',
                results: [{ status: 'passed', retry: 0, attachments: [] }],
                ...overrides,
              },
            ],
          },
        ],
      },
    ],
    errors: [],
  };
}

test('pass evidence never promotes a case to full acceptance; untouched cases remain not-run', () => {
  const data = buildMonitoring(catalog, manifest, [{ file: 'pilot.json', report: reportFor() }]);
  const item = data.cases.find((entry) => entry.id === manifest.checks[0].caseIds[0]);
  assert.equal(item.checkOutcome, 'passed');
  assert.equal(item.acceptance, 'not-assessed');
  assert.equal(data.checks[1].outcome, 'not-run');
  assert.equal(data.reports[0].codeRevision, 'test-revision');
  assert.equal(data.reports[0].websiteRevision, null);
  assert.equal(data.reports[0].inventoryRecordedAtExecution, false);
});

test('retry passes, expected failures, skipped, interrupted and empty results stay distinct', () => {
  assert.equal(
    checkOutcome({
      expectedStatus: 'passed',
      status: 'flaky',
      results: [{ status: 'failed' }, { status: 'passed', retry: 1 }],
    }),
    'flaky',
  );
  assert.equal(
    checkOutcome({ expectedStatus: 'failed', status: 'expected', results: [{ status: 'failed' }] }),
    'expected-failure',
  );
  assert.equal(
    checkOutcome({ expectedStatus: 'passed', status: 'skipped', results: [{ status: 'skipped' }] }),
    'skipped',
  );
  assert.equal(
    checkOutcome({
      expectedStatus: 'passed',
      status: 'unexpected',
      results: [{ status: 'interrupted' }],
    }),
    'interrupted',
  );
  assert.equal(checkOutcome({ results: [] }), 'not-run');
  assert.equal(checkOutcome({ status: 'expected', results: [{ status: 'passed' }] }), 'unknown');
  assert.equal(combinedOutcome(['passed', 'not-run']), 'partial-run');
  assert.equal(combinedOutcome(['passed', 'skipped']), 'partial-run');
});

test('separate batches preserve a failure even when another batch passes the same check', () => {
  const failed = reportFor(manifest.checks[0], {
    status: 'unexpected',
    results: [
      {
        status: 'failed',
        retry: 0,
        attachments: [
          { name: 'trace', contentType: 'application/zip', path: 'test-results/failure/trace.zip' },
        ],
      },
      { status: 'failed', retry: 1 },
    ],
  });
  const data = buildMonitoring(catalog, manifest, [
    { file: 'failed.json', report: failed },
    { file: 'passed.json', report: reportFor() },
  ]);
  assert.equal(data.checks[0].outcome, 'failed');
  assert.equal(data.checks[0].observations.length, 2);
  assert.equal(data.checks[0].observations[0].attempts.length, 2);
  assert.equal(
    data.checks[0].observations[0].attempts[0].attachments[0].path,
    'test-results/failure/trace.zip',
  );
});

test('missing reports and runner errors expose incomplete evidence without inventing blockers', () => {
  const report = reportFor();
  report.errors.push({ message: 'Runner setup failed' });
  const data = buildMonitoring(catalog, manifest, [
    { file: 'missing.json', report: null },
    { file: 'error.json', report },
  ]);
  assert.equal(data.evidenceComplete, false);
  assert.equal(data.reports[1].runnerErrors, 1);
  assert.match(renderMonitoring(data), /\*\*false\*\*/);
  assert.equal(buildMonitoring(catalog, manifest, []).evidenceComplete, false);
});

test('unknown annotations, wrong projects, wrong files and reused IDs are rejected', () => {
  for (const overrides of [
    { annotations: [{ type: 'zeouf-check', description: 'CHK-UNKNOWN' }] },
    { projectName: 'chromium' },
  ]) {
    assert.throws(() =>
      buildMonitoring(catalog, manifest, [
        { file: 'report.json', report: reportFor(manifest.checks[0], overrides) },
      ]),
    );
  }
  const wrongFile = reportFor();
  wrongFile.suites[0].specs[0].file = 'ecommerce/seed.spec.ts';
  assert.throws(
    () => buildMonitoring(catalog, manifest, [{ file: 'report.json', report: wrongFile }]),
    /location differs/,
  );
  const duplicate = reportFor();
  duplicate.suites[0].specs.push({ ...duplicate.suites[0].specs[0], id: 'different-test' });
  assert.throws(
    () => buildMonitoring(catalog, manifest, [{ file: 'report.json', report: duplicate }]),
    /reused/,
  );
});

test('inventory changes and duplicate report input cannot silently reuse evidence', () => {
  const report = reportFor();
  report.config.metadata.caseCatalogSha256 = 'old';
  assert.throws(
    () =>
      buildMonitoring(catalog, manifest, [{ file: 'report.json', report }], {
        caseCatalogSha256: 'new',
      }),
    /original revision/,
  );
  const input = { file: 'report.json', report: reportFor() };
  assert.throws(() => buildMonitoring(catalog, manifest, [input, input]), /Duplicate report/);
});

test('Windows runner paths work and unmapped ecommerce tests remain visible', () => {
  const report = reportFor();
  report.config.rootDir = 'C:\\workspace\\tests';
  report.suites[0].specs[0].file = 'ecommerce\\auth-confirmation-mismatch.spec.ts';
  report.suites[0].specs.push({
    title: 'Unmapped',
    file: 'ecommerce/seed.spec.ts',
    tests: [{ projectName: 'ecommerce-chromium', annotations: [], results: [] }],
  });
  const data = buildMonitoring(catalog, manifest, [{ file: 'report.json', report }]);
  assert.equal(data.checks[0].outcome, 'passed');
  assert.equal(data.reports[0].unmappedTests, 1);
});

test('mapping validation rejects unknown cases, duplicate IDs and unreviewed file links', () => {
  assert.throws(
    () =>
      validateManifest(catalog, {
        schemaVersion: 1,
        checks: [{ ...manifest.checks[0], caseIds: ['TC-UNKNOWN'] }],
      }),
    /Unknown case/,
  );
  assert.throws(
    () =>
      validateManifest(catalog, {
        schemaVersion: 1,
        checks: [manifest.checks[0], manifest.checks[0]],
      }),
    /duplicate check/,
  );
  assert.throws(
    () =>
      validateManifest(catalog, {
        schemaVersion: 1,
        checks: [{ ...manifest.checks[0], file: manifest.checks[1].file }],
      }),
    /reviewed file links/,
  );
});
