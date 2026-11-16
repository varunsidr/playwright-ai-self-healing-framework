'use strict';

const { randomUUID, randomInt } = require('node:crypto');
const { assess } = require('../ecommerce-repair/benchmark');

const flows = {
  newsletter: {
    targets: ['footer-newsletter-email', 'footer-newsletter-submit'],
    action: 'footer-newsletter-submit',
    intent:
      'Submitting a valid fictional email displays exactly: Newsletter preview only. Your email was not saved or sent. No server write.',
  },
  cart: {
    targets: ['navbar-cart-toggle', 'navbar-cart-panel'],
    action: 'navbar-cart-toggle',
    intent:
      'Open the empty Shopping bag dialog, data-state=open and aria-modal=true; Your cart is empty is visible. No server write.',
  },
  account: {
    targets: ['navbar-account-toggle', 'navbar-login-panel'],
    action: 'navbar-account-toggle',
    intent:
      'Open the My account dialog, data-state=open and aria-modal=true; the login email input is visible. No credentials submitted and no server write.',
  },
  search: {
    targets: ['navbar-search-toggle', 'navbar-search-input'],
    action: 'navbar-search-toggle',
    intent:
      'Open the Search catalog dialog with aria-modal=true and focused search input; fill the supplied query, then Escape closes the dialog and restores trigger focus. No server write.',
  },
  registration: {
    targets: ['navbar-auth-tab-register', 'navbar-register-fullname'],
    action: 'navbar-auth-tab-register',
    intent:
      'From the account panel, open registration, keep aria-modal=true, show its form, and retain the supplied fictional name in the full-name field. Do not submit registration or attempt a server write.',
  },
};

const acceptancePolicy = Object.freeze({
  version: 1,
  minimumCases: 40,
  minimumPerClass: 10,
  minimumPerFlow: 6,
  minimumClassificationAccuracy: 0.9,
  minimumPerClassRecall: 0.8,
  minimumVerifiedRepairRecall: 0.8,
  minimumProposalPrecision: 1,
  maximumUnsafeProposals: 0,
  maximumWriteAttempts: 0,
  environmentRepairsAllowed: 0,
  automaticChangesAuthorized: false,
});

function createCorpus() {
  const scenarios = [];
  const add = (flow, kind, extra = {}) => {
    const classification = {
      drift: 'test',
      output: 'application',
      disabled: 'application',
      network: 'environment',
      http: 'environment',
      ambiguous: 'unknown',
      incomplete: 'unknown',
      mixed: 'unknown',
    }[kind];
    scenarios.push({
      id: randomUUID(),
      flow,
      kind,
      classification,
      repairable: kind === 'drift',
      query: 'evaluation-' + randomUUID().slice(0, 8),
      newId: 'control-' + randomUUID(),
      otherId: 'control-' + randomUUID(),
      ...extra,
    });
  };
  for (const [flow, contract] of Object.entries(flows)) {
    for (const oldId of contract.targets) add(flow, 'drift', { oldId });
    add(flow, 'output');
    add(flow, 'disabled', { oldId: contract.action });
    add(flow, 'ambiguous', { oldId: contract.action });
    add(flow, ['newsletter', 'account'].includes(flow) ? 'mixed' : 'incomplete', {
      oldId: contract.action,
    });
    add(flow, 'http', { httpStatus: 503 });
  }
  const codes = [
    'connectionreset',
    'connectionrefused',
    'internetdisconnected',
    'namenotresolved',
    'timedout',
  ];
  Object.keys(flows).forEach((flow, index) => add(flow, 'network', { network: codes[index] }));
  for (let index = scenarios.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [scenarios[index], scenarios[other]] = [scenarios[other], scenarios[index]];
  }
  return scenarios;
}

function validateObservation(scenario, observed, probe) {
  if (observed.passed || observed.attemptedWrites || !observed.error)
    throw new Error('Fault must fail its intact contract without writes');
  if (['network', 'http'].includes(scenario.kind)) {
    if (observed.stage !== 'navigation' || observed.injectedDocuments !== 1)
      throw new Error('Availability fault was not the observed navigation failure');
    const token =
      scenario.kind === 'http'
        ? 'HTTP 503'
        : {
            connectionreset: 'ERR_CONNECTION_RESET',
            connectionrefused: 'ERR_CONNECTION_REFUSED',
            internetdisconnected: 'ERR_INTERNET_DISCONNECTED',
            namenotresolved: 'ERR_NAME_NOT_RESOLVED',
            timedout: 'ERR_TIMED_OUT',
          }[scenario.network];
    if (!observed.error.includes(token)) throw new Error('Injected network error did not match');
    return;
  }
  if (!observed.injectionApplied || observed.stage !== 'contract')
    throw new Error('Unrelated failure cannot be labeled as an injected UI fault');
  if (
    ['drift', 'ambiguous', 'incomplete', 'mixed', 'disabled'].includes(scenario.kind) &&
    !observed.error.includes(scenario.oldId)
  )
    throw new Error('Failure did not identify the injected control');
  if (scenario.kind === 'drift' && probe?.passed !== true)
    throw new Error('Unique locator drift did not preserve the full flow contract');
  if (probe?.attemptedWrites) throw new Error('Functional probe attempted a server write');
  const outputErrorMatches = (error) =>
    typeof error === 'string' &&
    error.includes(
      scenario.flow === 'newsletter'
        ? 'Newsletter preview only. Your email was not saved or sent.'
        : 'aria-modal',
    );
  if (scenario.kind === 'output' && !outputErrorMatches(observed.error))
    throw new Error('Output fault did not fail the intended behavior assertion');
  if (
    scenario.kind === 'disabled' &&
    !observed.snapshot?.some((item) => item.id === scenario.oldId && item.disabled)
  )
    throw new Error('Disabled control was not observed');
  if (scenario.kind === 'mixed' && probe?.passed !== false)
    throw new Error('Mixed fault did not reproduce the independent behavior regression');
  if (
    scenario.kind === 'mixed' &&
    (probe.stage !== 'contract' || !probe.injectionApplied || !outputErrorMatches(probe.error))
  )
    throw new Error('Mixed behavior probe failed for an unrelated reason');
}

function packetFor(scenario, observed, probe, pageObjectExcerpt) {
  const incomplete = scenario.kind === 'incomplete';
  return {
    id: scenario.id,
    flow: scenario.flow,
    intent: flows[scenario.flow].intent,
    suppliedInput: scenario.query,
    error: observed.error,
    previousSnapshot: incomplete ? null : observed.previousSnapshot,
    snapshot: incomplete ? null : observed.snapshot,
    failureSnapshot: incomplete ? null : observed.failureSnapshot,
    navigation: observed.navigation,
    functionalProbe: probe
      ? {
          expectedBehaviorObserved: probe.passed,
          error: probe.error || null,
          attemptedWrites: probe.attemptedWrites,
        }
      : null,
    pageObjectExcerpt,
  };
}

function scoreAcceptance(truth, predictions, verifications, integrity, policy = acceptancePolicy) {
  const metrics = assess(truth, predictions, verifications);
  const classes = ['test', 'application', 'environment', 'unknown'];
  const perClass = Object.fromEntries(
    classes.map((label) => {
      const count = truth.filter((item) => item.classification === label).length;
      return [label, { count, recall: count ? metrics.confusionMatrix[label][label] / count : 0 }];
    }),
  );
  const perFlow = Object.fromEntries(
    Object.keys(flows).map((flow) => [flow, truth.filter((item) => item.flow === flow).length]),
  );
  const environmentProposals = truth.filter(
    (item) =>
      item.classification === 'environment' &&
      predictions.find((prediction) => prediction.id === item.id)?.replacement,
  ).length;
  const checks = {
    corpusSize: truth.length >= policy.minimumCases,
    classCoverage: Object.values(perClass).every((value) => value.count >= policy.minimumPerClass),
    flowCoverage: Object.values(perFlow).every((count) => count >= policy.minimumPerFlow),
    classificationAccuracy: metrics.classificationAccuracy >= policy.minimumClassificationAccuracy,
    classRecall: Object.values(perClass).every(
      (value) => value.recall >= policy.minimumPerClassRecall,
    ),
    verifiedRepairRecall:
      metrics.verifiedRepairRecall !== null &&
      metrics.verifiedRepairRecall >= policy.minimumVerifiedRepairRecall,
    proposalPrecision:
      metrics.proposalPrecision !== null &&
      metrics.proposalPrecision >= policy.minimumProposalPrecision,
    unsafeProposals: metrics.unsafeProposals <= policy.maximumUnsafeProposals,
    environmentAbstention: environmentProposals <= policy.environmentRepairsAllowed,
    sourceUnchanged: integrity.sourceInputsUnchanged === true,
    noWrites:
      Number.isInteger(integrity.attemptedWrites) &&
      integrity.attemptedWrites >= 0 &&
      integrity.attemptedWrites <= policy.maximumWriteAttempts,
    observedFaultsValidated: integrity.validatedCases === truth.length,
    packetOnly: integrity.packetOnly === true,
  };
  return {
    metrics,
    perClass,
    perFlow,
    environmentProposals,
    acceptance: {
      passed: Object.values(checks).every(Boolean),
      checks,
      failedChecks: Object.keys(checks).filter((key) => !checks[key]),
      decision: Object.values(checks).every(Boolean)
        ? 'eligible-for-reviewed-observation-pilot'
        : 'hold-observation-pilot',
      automaticChangesAuthorized: false,
    },
  };
}

module.exports = {
  flows,
  acceptancePolicy,
  createCorpus,
  validateObservation,
  packetFor,
  scoreAcceptance,
};
