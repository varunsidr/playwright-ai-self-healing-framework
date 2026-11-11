'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { candidate, assess, offlinePrediction } = require('./benchmark');
test('benchmark refuses unknown, ambiguous and behavior-changing locator proposals', () => {
  const source = "const button = page.getByTestId('old'); expect(button).toBeVisible();";
  assert.match(
    candidate(source, { oldId: 'old', newId: 'new' }, [{ id: 'new' }]),
    /getByTestId\('new'\)/,
  );
  for (const [replacement, snapshot] of [
    [{ oldId: 'old', newId: 'new' }, []],
    [{ oldId: 'other', newId: 'new' }, [{ id: 'new' }]],
    [{ oldId: 'old', newId: 'new' }, [{ id: 'new' }, { id: 'new' }]],
  ])
    assert.throws(() => candidate(source, replacement, snapshot));
});
test('benchmark counts unsafe repair attempts even when verification rejects them', () => {
  const truth = [
    { id: 'a', classification: 'test', repairable: true },
    { id: 'b', classification: 'application', repairable: false },
  ];
  const score = assess(
    truth,
    [
      { id: 'a', classification: 'test', replacement: { oldId: 'old', newId: 'new' } },
      { id: 'b', classification: 'test', replacement: { oldId: 'old', newId: 'new' } },
    ],
    { a: { passed: true }, b: { passed: false } },
  );
  assert.equal(score.independentlyVerifiedRepairs, 1);
  assert.equal(score.unsafeProposals, 1);
  assert.equal(score.classificationAccuracy, 0.5);
  assert.equal(score.proposalPrecision, 0.5);
  assert.throws(() => assess(truth, [], {}));
});

test('offline predictor abstains from ambiguous and mixed failures without changing behavior', () => {
  const packet = {
    id: 'one',
    previousSnapshot: [{ id: 'old', tag: 'BUTTON', label: 'Account', text: '' }],
    snapshot: [{ id: 'new', tag: 'BUTTON', label: 'Account', text: '' }],
    functionalProbe: { expectedBehaviorObserved: true },
  };
  assert.deepEqual(offlinePrediction(packet).replacement, { oldId: 'old', newId: 'new' });
  for (const changed of [
    { ...packet, snapshot: null },
    { ...packet, snapshot: [...packet.snapshot, { ...packet.snapshot[0], id: 'another' }] },
    { ...packet, functionalProbe: { expectedBehaviorObserved: false } },
    { ...packet, functionalProbe: null },
  ]) {
    assert.equal(offlinePrediction(changed).classification, 'unknown');
    assert.equal(offlinePrediction(changed).replacement, null);
  }
  assert.equal(
    offlinePrediction({ id: 'network', error: 'net::ERR_CONNECTION_REFUSED', snapshot: [] })
      .classification,
    'environment',
  );
});

test('benchmark CLI rejects external-agent mode before reading or sending any inputs', async () => {
  const { main } = require('../run-ecommerce-agent-benchmark');
  await assert.rejects(main(['unused', 'unused', '--agent']), /Usage: benchmark:ecommerce:offline/);
});
