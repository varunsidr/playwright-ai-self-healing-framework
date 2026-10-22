'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { combineReviewedUpdates } = require('./reviewed-requirement-updates');
const catalog = require('../specs/ecommerce/requirements/requirement-updates.json');
const analytics = require('../specs/ecommerce/requirements/analytics-requirement-updates.json');

test('scoped reviews preserve independent requirement and case revisions', () => {
  const result = combineReviewedUpdates([catalog, analytics]);
  assert.equal(
    result.requirements.find((item) => item.id === 'CAT-07').sourceRevision,
    catalog.sourceRevision,
  );
  assert.equal(
    result.requirements.find((item) => item.id === 'ANL-01').sourceRevision,
    analytics.sourceRevision,
  );
  assert.equal(
    result.cases.find((item) => item.id === 'TC-CAT-007-01').sourceRevision,
    catalog.sourceRevision,
  );
  assert.equal(
    result.cases.find((item) => item.id === 'TC-ANL-001-01').sourceRevision,
    analytics.sourceRevision,
  );
});

test('duplicate reviewed requirement IDs fail across batches', () => {
  assert.throws(
    () => combineReviewedUpdates([catalog, { ...analytics, requirements: catalog.requirements }]),
    /Duplicate/,
  );
});

test('duplicate reviewed case IDs fail across batches', () => {
  assert.throws(
    () => combineReviewedUpdates([catalog, { ...analytics, cases: catalog.cases }]),
    /Duplicate/,
  );
});

test('missing evidence, invalid review dates and mismatched source links fail', () => {
  for (const change of [
    { reviewEvidence: '' },
    { reviewedAt: 'yesterday' },
    { sourceRevision: 'short' },
    { sourceDocuments: catalog.sourceDocuments },
  ])
    assert.throws(() => combineReviewedUpdates([{ ...analytics, ...change }]), /provenance/);
});

test('combining reviews does not mutate input records or their case provenance', () => {
  const before = JSON.stringify([catalog, analytics]);
  const result = combineReviewedUpdates([catalog, analytics]);
  result.cases[0].reviewedRequirementIds.push('ANL-01');
  result.requirements[0].sourceRevision = 'changed';
  assert.equal(JSON.stringify([catalog, analytics]), before);
  assert.deepEqual(combineReviewedUpdates([catalog, analytics]).cases[0].reviewedRequirementIds, [
    'CAT-07',
  ]);
});
