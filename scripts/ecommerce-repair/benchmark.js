'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { validateHealerChange } = require('./core');

const classification = ['test', 'application', 'environment', 'unknown'];
const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['predictions'],
  properties: {
    predictions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'classification', 'evidence', 'replacement'],
        properties: {
          id: { type: 'string' },
          classification: { type: 'string', enum: classification },
          evidence: { type: 'array', items: { type: 'string' } },
          replacement: {
            anyOf: [
              { type: 'null' },
              {
                type: 'object',
                additionalProperties: false,
                required: ['oldId', 'newId'],
                properties: { oldId: { type: 'string' }, newId: { type: 'string' } },
              },
            ],
          },
        },
      },
    },
  },
};
function loadPage(source) {
  const module = { exports: {} };
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new vm.Script(code).runInNewContext({
    module,
    exports: module.exports,
    require(name) {
      if (name !== '@playwright/test') throw new Error('Unexpected POM dependency');
      return require('@playwright/test');
    },
  });
  return module.exports.EcommerceStorefrontPage;
}
function candidate(source, replacement, snapshot) {
  if (
    !replacement ||
    !/^[a-zA-Z0-9_./:-]+$/.test(replacement.newId) ||
    !/^[a-zA-Z0-9_./:-]+$/.test(replacement.oldId)
  )
    throw new Error('Invalid literal locator proposal');
  if (snapshot.filter((item) => item.id === replacement.newId).length !== 1)
    throw new Error('Replacement must identify exactly one observed element');
  const token = `getByTestId('${replacement.oldId}')`;
  if (!source.includes(token))
    throw new Error('Proposed old selector is not an existing POM literal');
  const changed = source.replaceAll(token, `getByTestId('${replacement.newId}')`);
  validateHealerChange(source, changed);
  return changed;
}
function assess(truth, predictions, verifications) {
  if (
    predictions.length !== truth.length ||
    new Set(predictions.map((item) => item.id)).size !== truth.length ||
    truth.some((item) => !predictions.some((prediction) => prediction.id === item.id))
  )
    throw new Error('Predictions must cover the corpus exactly once');
  const matrix = Object.fromEntries(
    classification.map((label) => [
      label,
      Object.fromEntries(classification.map((other) => [other, 0])),
    ]),
  );
  let correct = 0,
    proposals = 0,
    verified = 0,
    unsafeProposals = 0;
  for (const expected of truth) {
    const prediction = predictions.find((item) => item.id === expected.id);
    if (!classification.includes(prediction.classification))
      throw new Error('Unsupported predicted class');
    matrix[expected.classification][prediction.classification]++;
    if (expected.classification === prediction.classification) correct++;
    if (prediction.replacement) {
      proposals++;
      if (!expected.repairable || prediction.classification !== 'test') unsafeProposals++;
      if (expected.repairable && verifications[expected.id]?.passed === true) verified++;
    }
  }
  const eligible = truth.filter((item) => item.repairable).length;
  return {
    cases: truth.length,
    correctClassifications: correct,
    classificationAccuracy: correct / truth.length,
    confusionMatrix: matrix,
    repairEligible: eligible,
    proposals,
    independentlyVerifiedRepairs: verified,
    proposalPrecision: proposals ? verified / proposals : null,
    verifiedRepairRecall: eligible ? verified / eligible : null,
    unsafeProposals,
    note: 'Controlled synthetic corpus. Labels excluded from prediction inputs. Results do not establish AI-model accuracy, real-world generalization or reliability.',
  };
}
function offlinePrediction(packet) {
  const base = { id: packet.id, classification: 'unknown', evidence: [], replacement: null };
  if (
    /ERR_CONNECTION_REFUSED|ERR_INTERNET_DISCONNECTED|net::ERR_/i.test(packet.error || '') &&
    !packet.snapshot?.length
  )
    return {
      ...base,
      classification: 'environment',
      evidence: ['Document navigation failed before UI observations were available.'],
    };
  if (!packet.snapshot || !packet.previousSnapshot)
    return { ...base, evidence: ['Insufficient observed UI evidence.'] };
  const controls = packet.previousSnapshot.filter((item) => ['INPUT', 'BUTTON'].includes(item.tag));
  const missing = controls.filter(
    (item) => !packet.snapshot.some((current) => current.id === item.id),
  );
  const currentControls = packet.snapshot.filter(
    (item) => !packet.previousSnapshot.some((previous) => previous.id === item.id),
  );
  const pairs = missing.flatMap((previous) =>
    currentControls
      .filter(
        (current) =>
          current.tag === previous.tag &&
          current.label === previous.label &&
          current.text === previous.text,
      )
      .map((current) => ({ oldId: previous.id, newId: current.id })),
  );
  const failedBehavior =
    packet.functionalProbe?.expectedBehaviorObserved === false ||
    (packet.expectedNotice &&
      packet.snapshot.some(
        (item) => item.id === 'footer-newsletter-success' && item.text !== packet.expectedNotice,
      ));
  if (failedBehavior)
    return {
      ...base,
      classification: missing.length ? 'unknown' : 'application',
      evidence: [
        'Observed output violates the unchanged expected behavior.',
        ...(missing.length ? ['Control identifiers also changed; causes are mixed.'] : []),
      ],
    };
  if (
    missing.length === 1 &&
    pairs.length === 1 &&
    packet.functionalProbe?.expectedBehaviorObserved === true
  )
    return {
      ...base,
      classification: 'test',
      evidence: [
        'One previous control is missing and one current control has its same tag, label and text.',
        'Using the current control preserved the expected behavior.',
      ],
      replacement: pairs[0],
    };
  return { ...base, evidence: ['A unique safe locator-only repair was not established.'] };
}
module.exports = { responseSchema, loadPage, candidate, assess, offlinePrediction };
