'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  createCorpus,
  flows,
  packetFor,
  validateObservation,
  scoreAcceptance,
} = require('./evaluation');
const { excerpt } = require('./evaluation-runner');

function perfectTrial() {
  const truth = createCorpus();
  const predictions = truth.map((item) => ({
    id: item.id,
    classification: item.classification,
    replacement: item.repairable ? { oldId: item.oldId, newId: item.newId } : null,
  }));
  const verifications = Object.fromEntries(
    truth.filter((item) => item.repairable).map((item) => [item.id, { passed: true }]),
  );
  return {
    truth,
    predictions,
    verifications,
    integrity: {
      sourceInputsUnchanged: true,
      attemptedWrites: 0,
      validatedCases: 40,
      packetOnly: true,
    },
  };
}

test('corpus has forty fresh cases, balanced classes, five flows and multiple causal mechanisms', () => {
  const first = createCorpus(),
    second = createCorpus();
  assert.equal(first.length, 40);
  assert.equal(new Set(first.map((item) => item.id)).size, 40);
  assert.ok(
    first.every(
      (item) => !second.some((other) => item.id === other.id || item.newId === other.newId),
    ),
  );
  for (const classification of ['test', 'application', 'environment', 'unknown'])
    assert.equal(first.filter((item) => item.classification === classification).length, 10);
  for (const flow of Object.keys(flows))
    assert.equal(first.filter((item) => item.flow === flow).length, 8);
  assert.equal(new Set(first.map((item) => item.kind)).size, 8);
  assert.ok(first.some((item) => item.network === 'connectionreset'));
  assert.equal(first.filter((item) => item.kind === 'mixed').length, 2);
});

test('acceptance is explicit and never authorizes applying changes', () => {
  const { truth, predictions, verifications, integrity } = perfectTrial();
  const score = scoreAcceptance(truth, predictions, verifications, integrity);
  assert.equal(score.acceptance.passed, true);
  assert.equal(score.acceptance.automaticChangesAuthorized, false);
  assert.equal(score.acceptance.decision, 'eligible-for-reviewed-observation-pilot');
  assert.throws(() => scoreAcceptance(truth, predictions.slice(1), verifications, integrity));
  assert.throws(() =>
    scoreAcceptance(truth, [...predictions.slice(1), predictions[1]], verifications, integrity),
  );
});

test('unsafe proposals count even when the verifier rejects them; environment patches always fail', () => {
  const { truth, predictions, verifications, integrity } = perfectTrial();
  const environment = truth.find((item) => item.classification === 'environment');
  const prediction = predictions.find((item) => item.id === environment.id);
  prediction.classification = 'test';
  prediction.replacement = { oldId: 'old', newId: 'new' };
  verifications[environment.id] = { passed: false, rejected: 'Not repairable' };
  const score = scoreAcceptance(truth, predictions, verifications, integrity);
  assert.equal(score.metrics.unsafeProposals, 1);
  assert.equal(score.acceptance.passed, false);
  assert.ok(score.acceptance.failedChecks.includes('environmentAbstention'));
  assert.ok(score.acceptance.failedChecks.includes('proposalPrecision'));
});

test('abstaining on everything, insufficient coverage and unverified repairs cannot pass acceptance', () => {
  const { truth, predictions, verifications, integrity } = perfectTrial();
  assert.equal(
    scoreAcceptance(
      truth,
      predictions.map((item) => ({ ...item, replacement: null })),
      {},
      integrity,
    ).acceptance.passed,
    false,
  );
  assert.equal(scoreAcceptance(truth, predictions, {}, integrity).acceptance.passed, false);
  assert.equal(
    scoreAcceptance(
      truth.slice(0, 30),
      predictions.filter((item) => truth.slice(0, 30).some((entry) => entry.id === item.id)),
      verifications,
      { ...integrity, validatedCases: 30 },
    ).acceptance.passed,
    false,
  );
  for (const change of [
    { sourceInputsUnchanged: false },
    { attemptedWrites: 1 },
    { validatedCases: 39 },
    { packetOnly: false },
  ])
    assert.equal(
      scoreAcceptance(truth, predictions, verifications, { ...integrity, ...change }).acceptance
        .passed,
      false,
    );
});

test('acceptance enforces both global and per-class performance plus verified repair recall', () => {
  const { truth, predictions, verifications, integrity } = perfectTrial();
  const testIds = truth.filter((item) => item.classification === 'test').map((item) => item.id);
  testIds.slice(0, 3).forEach((id) => {
    delete verifications[id];
  });
  assert.ok(
    scoreAcceptance(truth, predictions, verifications, integrity).acceptance.failedChecks.includes(
      'verifiedRepairRecall',
    ),
  );
  const appIds = truth
    .filter((item) => item.classification === 'application')
    .map((item) => item.id);
  predictions
    .filter((item) => appIds.slice(0, 3).includes(item.id))
    .forEach((item) => {
      item.classification = 'unknown';
    });
  const score = scoreAcceptance(truth, predictions, verifications, integrity);
  assert.equal(score.metrics.classificationAccuracy, 0.925);
  assert.ok(score.acceptance.failedChecks.includes('classRecall'));
});

test('collection requires the injected cause, not an arbitrary live-site failure', () => {
  const scenario = createCorpus().find((item) => item.kind === 'drift');
  const observed = {
    passed: false,
    error: 'Missing ' + scenario.oldId,
    stage: 'contract',
    attemptedWrites: 0,
    injectionApplied: true,
  };
  assert.doesNotThrow(() => validateObservation(scenario, observed, { passed: true }));
  for (const change of [
    { passed: true },
    { attemptedWrites: 1 },
    { injectionApplied: false },
    { stage: 'navigation' },
    { error: 'net::ERR_CONNECTION_RESET' },
  ])
    assert.throws(() =>
      validateObservation(scenario, { ...observed, ...change }, { passed: true }),
    );
  assert.throws(() => validateObservation(scenario, observed, { passed: false }));
  const network = { kind: 'network', network: 'connectionreset' };
  const failure = {
    passed: false,
    attemptedWrites: 0,
    stage: 'navigation',
    injectedDocuments: 1,
    error: 'page.goto: net::ERR_CONNECTION_RESET',
  };
  assert.doesNotThrow(() => validateObservation(network, failure));
  assert.throws(() => validateObservation(network, { ...failure, injectedDocuments: 0 }));
  assert.throws(() =>
    validateObservation(network, { ...failure, error: 'net::ERR_CONNECTION_REFUSED' }),
  );
  assert.throws(() => validateObservation({ kind: 'http' }, { ...failure, error: 'HTTP 500' }));
});

test('mixed and output faults require the behavior failure, not a failed network probe', () => {
  const scenario = { kind: 'mixed', flow: 'account', oldId: 'old' };
  const observed = {
    passed: false,
    stage: 'contract',
    injectionApplied: true,
    attemptedWrites: 0,
    error: 'Missing old',
  };
  const probe = {
    passed: false,
    stage: 'contract',
    injectionApplied: true,
    attemptedWrites: 0,
    error: 'Expected aria-modal true',
  };
  assert.doesNotThrow(() => validateObservation(scenario, observed, probe));
  for (const change of [
    { stage: 'navigation' },
    { error: 'net::ERR_CONNECTION_RESET' },
    { attemptedWrites: 1 },
  ])
    assert.throws(() => validateObservation(scenario, observed, { ...probe, ...change }));
  assert.throws(() =>
    validateObservation(
      { kind: 'output', flow: 'account' },
      { ...observed, error: 'Unrelated assertion' },
    ),
  );
  assert.throws(() =>
    validateObservation(
      { kind: 'disabled', oldId: 'old' },
      { ...observed, snapshot: [{ id: 'old', disabled: false }] },
    ),
  );
});

test('prediction packets withhold labels, injected definitions and deliberately missing evidence', () => {
  const scenario = createCorpus().find((item) => item.kind === 'incomplete');
  const observed = {
    previousSnapshot: [{ id: 'old' }],
    snapshot: [{ id: 'new' }],
    failureSnapshot: [],
    error: 'Timeout',
    navigation: [],
  };
  const packet = packetFor(scenario, observed, null, 'Relevant POM');
  for (const field of ['classification', 'repairable', 'kind', 'oldId', 'newId', 'otherId'])
    assert.equal(Object.hasOwn(packet, field), false);
  assert.equal(packet.previousSnapshot, null);
  assert.equal(packet.snapshot, null);
  assert.equal(packet.failureSnapshot, null);
  assert.equal(packet.functionalProbe, null);
});

test('model context contains matching POM members without unrelated application functionality', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../../pages/ecommerce-storefront-page.ts'),
    'utf8',
  );
  for (const flow of Object.keys(flows)) {
    const text = excerpt(source, flow);
    assert.ok(text.length > 50 && text.length < 2500);
    assert.doesNotMatch(text, /deleteAdminProduct|registerNewShopper/);
  }
  assert.match(excerpt(source, 'newsletter'), /submitNewsletterPreview/);
  assert.match(excerpt(source, 'search'), /navbar-search-input/);
});
