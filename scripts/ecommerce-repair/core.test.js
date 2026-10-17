'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const core = require('./core');

const packet = {
  blockers: [],
  failures: [{ checkId: 'CHK-CATEGORY', caseIds: ['TC-CAT-01-CORE'] }],
};
const sources = {
  requirements: 'Women and Men remain distinct',
  'website/src/components/ProductListing.tsx': 'return category.includes(subCategoryName);',
  'framework/pages/ecommerce-storefront-page.ts': "getByTestId('old-id')",
  'observed-failures': 'Expected Men only; received Women and Men',
};
const diagnosis = {
  category: 'application',
  reason: 'Category filtering violates the reviewed requirement',
  checkIds: ['CHK-CATEGORY'],
  evidence: [
    {
      source: 'observed-failures',
      quote: sources['observed-failures'],
      explanation: 'Rendered membership differs from the expectation',
    },
    {
      source: 'requirements',
      quote: sources.requirements,
      explanation: 'Expected distinct collections',
    },
    {
      source: 'website/src/components/ProductListing.tsx',
      quote: sources['website/src/components/ProductListing.tsx'],
      explanation: 'Missing parent-category check',
    },
  ],
};

test('real evidence routes application and test defects to different repositories', () => {
  assert.equal(core.validateDiagnosis(packet, diagnosis, sources), 'website');
  const healed = {
    ...diagnosis,
    category: 'test',
    evidence: [
      diagnosis.evidence[0],
      diagnosis.evidence[2],
      {
        source: 'framework/pages/ecommerce-storefront-page.ts',
        quote: sources['framework/pages/ecommerce-storefront-page.ts'],
        explanation: 'Observed selector drift',
      },
    ],
  };
  assert.equal(core.validateDiagnosis(packet, healed, sources), 'framework');
  assert.equal(
    core.validateDiagnosis(
      packet,
      { ...diagnosis, category: 'environment', evidence: [] },
      sources,
    ),
    'environment',
  );
  assert.equal(
    core.validateDiagnosis(packet, { ...diagnosis, category: 'unknown', evidence: [] }, sources),
    'review',
  );
});
test('invented quotations, missing checks and incomplete reports never authorize repair', () => {
  assert.throws(
    () => core.validateDiagnosis(packet, { ...diagnosis, checkIds: [] }, sources),
    /exactly/,
  );
  assert.throws(
    () =>
      core.validateDiagnosis(
        packet,
        {
          ...diagnosis,
          evidence: [{ source: 'requirements', quote: 'invented', explanation: 'claim' }],
        },
        sources,
      ),
    /Unsupported/,
  );
  assert.throws(
    () =>
      core.validateDiagnosis(packet, { ...diagnosis, evidence: [diagnosis.evidence[0]] }, sources),
    /requires observed/,
  );
  assert.equal(
    core.validateDiagnosis({ ...packet, blockers: ['Missing report'] }, diagnosis, sources),
    'review',
  );
  assert.deepEqual(
    core.diagnosisSchema(sources).properties.evidence.items.properties.source.enum,
    Object.keys(sources),
  );
});
test('repair scope rejects tests, expectations, credentials, CI changes and traversal', () => {
  core.validateChangedFiles('website', ['src/components/ProductListing.tsx', 'docs/BRD.md']);
  core.validateChangedFiles('framework', ['pages/ecommerce-storefront-page.ts']);
  for (const file of [
    'tests/ecommerce/catalog.spec.ts',
    'fixtures/ecommerce-base.ts',
    'package.json',
    '.github/workflows/playwright.yml',
    '../file',
    '.env.local',
    'AGENTS.md',
  ])
    assert.throws(() => core.validateChangedFiles('framework', [file]), /Forbidden|may not/);
  assert.throws(
    () => core.validateChangedFiles('website', ['scripts/requirements.mjs']),
    /may not/,
  );
  assert.throws(() => core.safePath('/safe', '../outside'), /Unsafe/);
});
test('a green report needs every expected check, one clean attempt and unchanged inventories', () => {
  const report = {
    config: { metadata: { caseCatalogSha256: 'catalog', checkManifestSha256: 'manifest' } },
    errors: [],
    suites: [
      {
        specs: [
          {
            tests: [
              {
                projectName: 'ecommerce-chromium',
                expectedStatus: 'passed',
                status: 'expected',
                annotations: [{ type: 'zeouf-check', description: 'CHK-CATEGORY' }],
                results: [{ status: 'passed' }],
              },
            ],
          },
        ],
      },
    ],
  };
  const hashes = report.config.metadata;
  assert.equal(core.verifyReport(report, ['CHK-CATEGORY'], 0, hashes), true);
  assert.equal(core.verifyReport(report, ['CHK-CATEGORY', 'CHK-MISSING'], 0, hashes), false);
  assert.equal(core.verifyReport(report, ['CHK-CATEGORY'], 1, hashes), false);
  assert.equal(
    core.verifyReport(report, ['CHK-CATEGORY'], 0, { ...hashes, caseCatalogSha256: 'changed' }),
    false,
  );
  const item = report.suites[0].specs[0].tests[0];
  item.results.push({ status: 'passed' });
  assert.equal(core.verifyReport(report, ['CHK-CATEGORY'], 0, hashes), false);
  item.results = [{ status: 'skipped' }];
  assert.equal(core.verifyReport(report, ['CHK-CATEGORY'], 0, hashes), false);
});
test('the healer can repair a test ID but cannot change assertions, mock behavior or add sleeps', () => {
  const before = "class Page { async submit() { await this.page.getByTestId('old-id').click(); } }";
  const after = before.replace('old-id', 'current-id');
  core.validateHealerChange(before, after);
  assert.throws(
    () => core.validateHealerChange(before, after.replace('click()', 'evaluate(() => true)')),
    /literal repairs only/,
  );
  assert.throws(
    () =>
      core.validateHealerChange(
        before,
        after.replace(
          'await this.page',
          'await new Promise(r => setTimeout(r, 1000)); await this.page',
        ),
      ),
    /literal repairs only/,
  );
  assert.throws(
    () => core.validateHealerChange(before, 'import fs from "fs";\n' + after),
    /literal repairs only/,
  );
});
