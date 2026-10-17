'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const repair = yaml.load(
  fs.readFileSync(path.join(root, '.github/workflows/ecommerce-auto-repair.yml'), 'utf8'),
);
const monitoring = yaml.load(
  fs.readFileSync(path.join(root, '.github/workflows/playwright.yml'), 'utf8'),
);
const website = yaml.load(
  fs.readFileSync(path.join(root, 'templates/ecommerce/website-repair-pr.yml'), 'utf8'),
);
const evaluate = (expression, context) =>
  vm.runInNewContext(
    expression.replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, ''),
    { always: () => true, ...context },
    { timeout: 100 },
  ) === true;

test('the real workflow allows a manual pilot but requires explicit automatic proposal opt-in', () => {
  const context = {
    vars: { ECOMMERCE_REPAIR_ENABLED: 'true' },
    github: { event_name: 'workflow_run', event: { workflow_run: { conclusion: 'failure' } } },
    inputs: {},
  };
  assert.equal(evaluate(repair.jobs.propose.if, context), false);
  context.github.event_name = 'workflow_dispatch';
  assert.equal(evaluate(repair.jobs.propose.if, context), true);
  context.github.event_name = 'workflow_run';
  context.vars.ECOMMERCE_REPAIR_AUTOMATIC = 'true';
  assert.equal(evaluate(repair.jobs.propose.if, context), true);
  context.vars.ECOMMERCE_STAGING_CONFIRMED = 'true';
  assert.equal(evaluate(repair.jobs.propose.if, context), false);
});

test('publication requires independent verification, repository opt-in and an explicit manual request', () => {
  const context = {
    needs: { verify: { outputs: { verified: 'true' } } },
    vars: { ECOMMERCE_REPAIR_PUBLISH_PR: 'true' },
    github: { event_name: 'workflow_dispatch' },
    inputs: { publish_verified_pr: false },
  };
  assert.equal(repair.on.workflow_dispatch.inputs.publish_verified_pr.default, false);
  assert.equal(evaluate(repair.jobs.publish.if, context), false);
  context.inputs.publish_verified_pr = true;
  assert.equal(evaluate(repair.jobs.publish.if, context), true);
  context.github.event_name = 'workflow_run';
  assert.equal(evaluate(repair.jobs.publish.if, context), false);
  context.github.event_name = 'workflow_dispatch';
  context.needs.verify.outputs.verified = 'false';
  assert.equal(evaluate(repair.jobs.publish.if, context), false);
});

test('ordinary monitoring remains available but requested pinning never falls back after a failed deployment probe', () => {
  const steps = monitoring.jobs.test.steps;
  const capture = steps.find((step) => step.id === 'deployment');
  const browser = steps.find(
    (step) => step.name === 'Run expanded Zeouf read-only browser regressions',
  );
  const context = { vars: {}, inputs: {}, steps: { deployment: { outcome: 'skipped' } } };
  assert.equal(evaluate(capture.if, context), false);
  assert.equal(evaluate(browser.if, context), true);
  context.inputs.pin_deployment = true;
  context.steps.deployment.outcome = 'failure';
  assert.equal(evaluate(capture.if, context), true);
  assert.equal(evaluate(browser.if, context), false);
  context.steps.deployment.outcome = 'success';
  assert.equal(evaluate(browser.if, context), true);
});

test('verification workflows have no supplied secrets and website checks use immutable framework and PR revisions', () => {
  assert.equal(JSON.stringify(repair.jobs.verify).includes('secrets.'), false);
  assert.equal(JSON.stringify(repair.jobs.propose).includes('REPAIR_GITHUB_TOKEN'), false);
  assert.equal(JSON.stringify(website).includes('secrets.'), false);
  assert.deepEqual(website.permissions, { contents: 'read' });
  const checkouts = website.jobs.regressions.steps.filter(
    (step) => step.uses === 'actions/checkout@v4',
  );
  assert.equal(checkouts[0].with.ref, '${{ vars.ECOMMERCE_REPAIR_FRAMEWORK_SHA }}');
  assert.equal(checkouts[1].with.ref, '${{ github.event.pull_request.head.sha || github.sha }}');
  assert.equal(
    checkouts.every((step) => step.with['persist-credentials'] === false),
    true,
  );
  assert.equal(
    website.jobs.regressions.steps[0].name,
    'Require a reviewed immutable framework revision',
  );
});
