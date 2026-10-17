'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const catalog = require('../specs/ecommerce/requirements/case-catalog.json');
const manifest = require('../specs/ecommerce/requirements/check-links.json');
const { validateDiscovery } = require('./check-ecommerce-mappings');

const check = manifest.checks.find((item) => item.testTitle);
const scoped = { schemaVersion: 1, checks: [check] };
const spec = {
  title: check.testTitle,
  file: check.file.replace(/^tests\//, ''),
  tests: [{ projectName: check.project, annotations: [] }],
};
const discovery = (specs) => ({ suites: [{ title: 'Example', specs }], errors: [] });

test('title selectors resolve to one actual test and reject renamed or duplicate tests', () => {
  assert.equal(validateDiscovery(catalog, scoped, discovery([spec])).checks, 1);
  assert.throws(
    () => validateDiscovery(catalog, scoped, discovery([{ ...spec, title: 'Renamed test' }])),
    /found 0/,
  );
  assert.throws(() => validateDiscovery(catalog, scoped, discovery([spec, spec])), /found 2/);
});

test('mapping cannot attach two IDs to one test or conflict with a source annotation', () => {
  assert.throws(
    () =>
      validateDiscovery(
        catalog,
        { schemaVersion: 1, checks: [check, { ...check, id: 'CHK-SECOND-ID' }] },
        discovery([spec]),
      ),
    /Duplicate test selector/,
  );
  assert.throws(
    () =>
      validateDiscovery(
        catalog,
        scoped,
        discovery([
          {
            ...spec,
            tests: [
              {
                projectName: check.project,
                annotations: [{ type: 'zeouf-check', description: 'CHK-WRONG-ID' }],
              },
            ],
          },
        ]),
      ),
    /conflicting source annotation/,
  );
});

test('explicit source IDs remain supported and collection errors cannot be treated as success', () => {
  const { testTitle: _testTitle, ...explicit } = check;
  const annotated = {
    ...spec,
    tests: [
      { projectName: check.project, annotations: [{ type: 'zeouf-check', description: check.id }] },
    ],
  };
  assert.equal(
    validateDiscovery(catalog, { schemaVersion: 1, checks: [explicit] }, discovery([annotated]))
      .checks,
    1,
  );
  assert.throws(
    () =>
      validateDiscovery(catalog, scoped, {
        suites: [],
        errors: [{ message: 'Cannot load tests' }],
      }),
    /Cannot load tests/,
  );
});
