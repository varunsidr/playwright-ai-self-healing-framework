'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { assessEvaluation, diagnose, buildLocatorDiff } = require('./evaluate-ecommerce-repair');

function examples() {
  const observation = {
    originalSubmitVisible: true,
    replacementSubmitVisible: false,
    replacementTestId: null,
    noticeText: 'Newsletter preview only. Your email was not saved or sent.',
    blockedDocuments: 0,
    attemptedWrites: [],
  };
  const result = (stage, outcome, changes = {}) => ({
    stage,
    outcome,
    runnerErrors: 0,
    sourceSnapshotMatches: true,
    exitCode: outcome === 'passed' ? 0 : 1,
    failureMessage: '',
    observation: { ...observation, ...changes },
  });
  const drift = {
    originalSubmitVisible: false,
    replacementSubmitVisible: true,
    replacementTestId: 'evaluation-newsletter-submit-v2',
    noticeText: null,
  };
  return [
    result('baseline', 'passed'),
    {
      ...result('locator-drift', 'failed', drift),
      failureMessage: 'Timeout waiting for getByTestId(footer-newsletter-submit)',
    },
    result('locator-repair', 'passed', { ...drift, noticeText: observation.noticeText }),
    {
      ...result('application-defect', 'failed', { noticeText: 'Newsletter preview unavailable.' }),
      failureMessage: 'expect(locator).toBeVisible() failed',
    },
    {
      ...result('environment-unavailable', 'failed', { blockedDocuments: 1, noticeText: null }),
      failureMessage: 'page.goto: net::ERR_CONNECTION_REFUSED',
    },
  ];
}

test('a verified rehearsal requires all observed faults, intact assertions and a passing locator rerun', () => {
  const assessment = assessEvaluation(examples(), true);
  assert.equal(assessment.status, 'verified-rehearsal');
  assert.equal(assessment.correctDecisions, 3);
  assert.equal(assessment.autonomousRepairEvaluated, false);
  assert.match(assessment.reviewStatus, /pending/);
});

test('green application/environment faults expose masking instead of successful repair', () => {
  for (const index of [3, 4]) {
    const results = examples();
    results[index].outcome = 'passed';
    results[index].exitCode = 0;
    assert.equal(assessEvaluation(results, true).status, 'failed');
  }
});

test('skip, flaky, expected failure and missing stage never prove a passing repair', () => {
  for (const outcome of ['skipped', 'flaky', 'expected-failure', 'not-run']) {
    const results = examples();
    results[2].outcome = outcome;
    assert.equal(assessEvaluation(results, true).repairVerified, false);
    assert.equal(assessEvaluation(results, true).status, 'failed');
  }
  assert.equal(assessEvaluation(examples().slice(0, 4), true).status, 'failed');
});

test('an unavailable baseline blocks evaluation without claiming classified live acceptance', () => {
  const results = examples();
  results[0].outcome = 'failed';
  assert.equal(assessEvaluation(results.slice(0, 1), true).status, 'blocked');
  assert.equal(assessEvaluation([], true).status, 'blocked');
});

test('source changes, inventory mismatch and runner errors invalidate evidence', () => {
  assert.equal(assessEvaluation(examples(), true, false).status, 'failed');
  assert.equal(assessEvaluation(examples(), false).status, 'failed');
  for (const field of ['runnerErrors', 'sourceSnapshotMatches']) {
    const results = examples();
    results[2][field] = field === 'runnerErrors' ? 1 : false;
    assert.equal(assessEvaluation(results, true).status, 'failed');
  }
});

test('a locator proposal retains method context and rejects unsupported replacements', () => {
  const source = [
    'class Example {',
    '',
    '  async submitNewsletterPreview(email: string) {',
    "    await this.page.getByTestId('footer-newsletter-email').fill(email);",
    "    await this.page.getByTestId('footer-newsletter-submit').click();",
    '  }',
    '',
    '  async openHome() {}',
    '}',
  ].join('\n');
  const diff = buildLocatorDiff(source, 'evaluation-newsletter-submit-v2');
  assert.match(diff, /\+    await this.page.getByTestId\('evaluation-newsletter-submit-v2'\)/);
  assert.match(diff, / async openHome/);
  assert.throws(() => buildLocatorDiff(source, 'different-button'), /Unexpected replacement/);
  assert.throws(
    () => buildLocatorDiff('different implementation', 'evaluation-newsletter-submit-v2'),
    /Original locator method differs/,
  );
});

test('a passing test cannot certify a failed process or an unrecorded baseline source snapshot', () => {
  const results = examples();
  results[2].exitCode = 1;
  assert.equal(assessEvaluation(results, true).status, 'failed');
  results[0].sourceSnapshotMatches = false;
  assert.equal(assessEvaluation(results, true).status, 'blocked');
});

test('a passing rerun with changed preview semantics or a write attempt is rejected', () => {
  for (const changes of [
    { noticeText: 'Subscribed successfully.' },
    { attemptedWrites: ['POST /api/newsletter'] },
    { originalSubmitVisible: true },
  ]) {
    const results = examples();
    Object.assign(results[2].observation, changes);
    assert.equal(assessEvaluation(results, true).repairVerified, false);
  }
});

test('error text alone cannot distinguish an application defect from an unavailable environment', () => {
  const results = examples();
  const environment = results[4];
  environment.observation.blockedDocuments = 0;
  assert.equal(diagnose(environment), 'unknown');
  results[1].observation.originalSubmitVisible = true;
  assert.equal(diagnose(results[1]), 'unknown');
  assert.equal(diagnose({ ...results[3], observation: null }), 'unknown');
});
