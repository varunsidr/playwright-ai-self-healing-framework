'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { hash } = require('./core');
const deployment = require('./deployment');
const {
  validateSourceRun,
  protocolEvents,
  collectGithubEvidence,
} = require('./observation-github');
const { buildObservation, report, aggregate, markdown } = require('./observation');
const yaml = require('js-yaml');
const root = path.resolve(__dirname, '../..');
const write = (directory, name, value) =>
  fs.writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + '\n');
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-observation-test-'));

function sourceRun() {
  return {
    id: 100,
    name: 'Playwright Tests',
    path: '.github/workflows/playwright.yml',
    status: 'completed',
    conclusion: 'failure',
    event: 'push',
    head_branch: 'main',
    head_repository: { full_name: 'owner/repo' },
    head_sha: 'a'.repeat(40),
    run_attempt: 1,
  };
}

function fixture() {
  const directory = temp();
  const source = validateSourceRun(sourceRun(), 'owner/repo', 'main', 'a'.repeat(40));
  write(directory, 'source-run.json', source);
  const record = deployment.recordFrom(
    { id: 1, sha: 'b'.repeat(40), environment: 'Production', creator: { login: 'vercel[bot]' } },
    {
      id: 2,
      state: 'success',
      environment_url: 'https://zeouf-luxury-fashion-ecommerce-fixture123.vercel.app',
      creator: { login: 'vercel[bot]' },
    },
  );
  write(directory, 'website-deployment.json', record);
  const deploymentSha256 = hash(fs.readFileSync(path.join(directory, 'website-deployment.json')));
  const packet = {
    blockers: [],
    failures: [{ checkId: 'CHK-ONE', title: 'Original failure' }],
    reports: [
      {
        codeRevision: source.frameworkRevision,
        websiteRevision: record.websiteRevision,
        websiteDeploymentId: record.deploymentId,
        websiteDeploymentSha256: deploymentSha256,
        origin: record.url,
      },
    ],
  };
  fs.mkdirSync(path.join(directory, 'original'));
  write(directory, 'original/ecommerce-read-only-results.json', {
    config: {
      metadata: {
        websiteRevision: record.websiteRevision,
        websiteDeploymentId: record.deploymentId,
        websiteDeploymentSha256: deploymentSha256,
        ecommerceOrigin: record.url,
      },
    },
  });
  packet.reports[0].sha256 = hash(
    fs.readFileSync(path.join(directory, 'original/ecommerce-read-only-results.json')),
  );
  write(directory, 'failure-packet.json', packet);
  const sources = {
    'observed-failures': 'Original missing locator',
    'framework/pages/ecommerce-storefront-page.ts': 'old locator',
    'website/src/components/Footer.tsx': 'new locator',
  };
  write(directory, 'evidence-sources.json', sources);
  write(directory, 'diagnosis.json', {
    category: 'test',
    reason: 'Unique literal drift',
    checkIds: ['CHK-ONE'],
    evidence: Object.entries(sources).map(([source, quote]) => ({
      source,
      quote,
      explanation: 'Observed source evidence',
    })),
  });
  const candidate = {
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
                annotations: [{ type: 'zeouf-check', description: 'CHK-ONE' }],
                results: [{ status: 'passed', retry: 0 }],
              },
            ],
          },
        ],
      },
    ],
  };
  write(directory, 'candidate-results.json', candidate);
  const baseline = structuredClone(candidate),
    test = baseline.suites[0].specs[0].tests[0];
  test.status = 'unexpected';
  test.results[0].status = 'failed';
  write(directory, 'baseline-results.json', baseline);
  fs.writeFileSync(path.join(directory, 'candidate.patch'), 'fixture patch bytes');
  const proposal = {
    status: 'verified-candidate',
    role: 'framework',
    files: ['pages/ecommerce-storefront-page.ts'],
    frameworkRevision: source.frameworkRevision,
    websiteRevision: record.websiteRevision,
    patchSha256: hash('fixture patch bytes'),
    deploymentSha256,
    verification: {
      passed: true,
      expectedCheckIds: ['CHK-ONE'],
      inventoryHashes: candidate.config.metadata,
      reportSha256: hash(fs.readFileSync(path.join(directory, 'candidate-results.json'))),
    },
  };
  write(directory, 'proposal.json', proposal);
  const step = (name) => ({
    name,
    conclusion: 'success',
    started_at: '2026-11-12T00:00:00Z',
    completed_at: '2026-11-12T00:00:01Z',
  });
  const execution = {
    observationRunId: 200,
    observationRunAttempt: 1,
    jobs: [
      {
        name: 'Observe failure',
        conclusion: 'success',
        steps: [
          step('Diagnose recorded failure'),
          step('Propose isolated repair'),
          step('Capture guarded proposal'),
        ],
      },
      { name: 'Verify isolated proposal', conclusion: 'success', steps: [] },
    ],
    metrics: {
      complete: true,
      usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 20 },
    },
    warnings: [],
  };
  write(directory, 'execution.json', execution);
  return { directory, packet, candidate, baseline, proposal, execution, sources };
}

test('pilot accepts only failed trusted first-attempt tests at the selected default-branch revision', () => {
  assert.equal(validateSourceRun(sourceRun(), 'owner/repo', 'main', 'a'.repeat(40)).runId, 100);
  for (const change of [
    { event: 'pull_request' },
    { head_repository: { full_name: 'fork/repo' } },
    { head_branch: 'feature' },
    { conclusion: 'success' },
    { run_attempt: 2 },
    { path: '.github/workflows/other.yml' },
    { head_sha: 'b'.repeat(40) },
  ])
    assert.throws(() =>
      validateSourceRun({ ...sourceRun(), ...change }, 'owner/repo', 'main', 'a'.repeat(40)),
    );
});

test('usage comes from timestamped protocol events, never narrative, shell output strings or invalid counts', () => {
  const log = [
    '2026-11-12T00:00:00.1234567Z ' +
      JSON.stringify({
        type: 'item.completed',
        item: {
          type: 'agent_message',
          text: '{"type":"turn.completed","usage":{"input_tokens":999}}',
        },
      }),
    'Agent claims input_tokens=999',
    '2026-11-12T00:00:01Z ' +
      JSON.stringify({
        type: 'turn.completed',
        usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 10 },
      }),
    JSON.stringify({ type: 'turn.completed', usage: { input_tokens: -1, output_tokens: 0 } }),
  ].join('\n');
  assert.deepEqual(protocolEvents(log), [
    {
      type: 'turn.completed',
      usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 10 },
    },
  ]);
});

test('GitHub evidence collection uses completed source-job logs and preserves unavailable measurements', async () => {
  const directory = temp();
  const api = {
    rest: {
      actions: {
        async listJobsForWorkflowRunAttempt() {
          return {
            data: {
              jobs: [
                {
                  id: 1,
                  name: 'Observe failure',
                  status: 'completed',
                  steps: [{ name: 'Diagnose recorded failure', conclusion: 'success' }],
                },
              ],
            },
          };
        },
        async downloadJobLogsForWorkflowRun() {
          return {
            data: '2026-11-12T00:00:00Z {"type":"turn.completed","usage":{"input_tokens":100,"output_tokens":20}}',
          };
        },
      },
    },
  };
  const context = { repo: { owner: 'owner', repo: 'repo' }, runId: 200 };
  assert.equal((await collectGithubEvidence(api, context, directory)).metrics.complete, true);
  api.rest.actions.downloadJobLogsForWorkflowRun = async () => {
    throw new Error('Logs not ready');
  };
  const missing = await collectGithubEvidence(api, context, directory);
  assert.equal(missing.metrics.complete, false);
  assert.ok(missing.warnings.some((item) => item.includes('Logs not ready')));
  api.rest.actions.listJobsForWorkflowRunAttempt = async () => ({
    data: {
      jobs: [
        {
          id: 1,
          name: 'Observe failure',
          status: 'completed',
          steps: [
            { name: 'Diagnose recorded failure', conclusion: 'success' },
            { name: 'Propose isolated repair', conclusion: 'failure' },
          ],
        },
      ],
    },
  });
  api.rest.actions.downloadJobLogsForWorkflowRun = async () => ({
    data: '{"type":"turn.completed","usage":{"input_tokens":100,"output_tokens":20}}',
  });
  const partial = await collectGithubEvidence(api, context, directory);
  assert.equal(partial.metrics.complete, false);
  assert.equal(partial.metrics.usage.input_tokens, 100);
});

test('verification is recomputed from report, patch, deployment and reproduced baseline, not a green flag', () => {
  const { directory, proposal, execution } = fixture();
  assert.equal(buildObservation(directory).verification.passed, true);
  fs.appendFileSync(path.join(directory, 'candidate.patch'), 'changed');
  assert.equal(buildObservation(directory).verification.passed, false);
  fs.writeFileSync(path.join(directory, 'candidate.patch'), 'fixture patch bytes');
  execution.jobs[1].conclusion = 'failure';
  write(directory, 'execution.json', execution);
  assert.equal(buildObservation(directory).verification.passed, false);
  execution.jobs[1].conclusion = 'success';
  write(directory, 'execution.json', execution);
  proposal.verification.expectedCheckIds.push('CHK-MISSING');
  write(directory, 'proposal.json', proposal);
  assert.equal(buildObservation(directory).verification.passed, false);
});

test('a changed baseline, inventory or evidence quote cannot establish a verified repair', () => {
  for (const change of ['baseline', 'candidate', 'diagnosis', 'original']) {
    const { directory, candidate } = fixture();
    if (change === 'baseline') write(directory, 'baseline-results.json', candidate);
    if (change === 'original')
      fs.appendFileSync(path.join(directory, 'original/ecommerce-read-only-results.json'), ' ');
    if (change === 'candidate') {
      candidate.config.metadata.caseCatalogSha256 = 'changed';
      write(directory, 'candidate-results.json', candidate);
      const proposal = JSON.parse(fs.readFileSync(path.join(directory, 'proposal.json')));
      proposal.verification.reportSha256 = hash(
        fs.readFileSync(path.join(directory, 'candidate-results.json')),
      );
      write(directory, 'proposal.json', proposal);
    }
    if (change === 'diagnosis') {
      const diagnosis = JSON.parse(fs.readFileSync(path.join(directory, 'diagnosis.json')));
      diagnosis.evidence[0].quote = 'Invented quote';
      write(directory, 'diagnosis.json', diagnosis);
    }
    assert.equal(buildObservation(directory).verification.passed, false);
  }
});

test('missing and malformed evidence still yields a blocked report; missing tokens are not zero', () => {
  const directory = temp();
  fs.writeFileSync(path.join(directory, 'diagnosis.json'), '{partial');
  const result = report(directory);
  assert.equal(result.status, 'blocked');
  assert.equal(result.measurements.tokenUsage, null);
  assert.equal(result.measurements.diagnosticAccuracy, null);
  assert.ok(result.blockers.some((item) => item.includes('diagnosis.json')));
  assert.match(
    fs.readFileSync(path.join(directory, 'observation.md'), 'utf8'),
    /Unavailable \(not zero\)/,
  );
  write(directory, 'diagnosis.json', { category: 'test', evidence: 'wrong shape' });
  assert.equal(report(directory).status, 'blocked');
});

test('an environment diagnosis abstains and unsafe scoped edits remain distinct from human safety labels', () => {
  const { directory, execution } = fixture();
  fs.unlinkSync(path.join(directory, 'proposal.json'));
  fs.unlinkSync(path.join(directory, 'candidate.patch'));
  write(directory, 'diagnosis.json', {
    category: 'environment',
    reason: '<script>network | reset</script>',
    checkIds: ['CHK-ONE'],
    evidence: [],
  });
  execution.jobs[0].steps = [{ name: 'Diagnose recorded failure', conclusion: 'success' }];
  execution.jobs[1].conclusion = 'skipped';
  write(directory, 'execution.json', execution);
  const result = report(directory);
  assert.equal(result.status, 'environment-blocked');
  assert.equal(result.proposal.attempted, false);
  assert.doesNotMatch(markdown(result), /<script>/);
  assert.equal(aggregate([directory]).reviewedDiagnosisAccuracy, null);
});

test('human review is bound to exact evidence; duplicate runs and edited scores cannot inflate totals', () => {
  const { directory } = fixture();
  report(directory);
  let result = aggregate([directory]);
  assert.equal(result.independentlyVerifiedRepairs, 1);
  assert.equal(result.humanReviewedObservations, 0);
  assert.equal(result.reviewedUnsafeProposalRate, null);
  const review = JSON.parse(fs.readFileSync(path.join(directory, 'review-template.json')));
  Object.assign(review, {
    reviewer: 'Human reviewer',
    rationale: 'Compared original requirement and source',
    expectedCategory: 'test',
    proposalSafety: 'safe',
  });
  write(directory, 'review.json', review);
  result = aggregate([directory]);
  assert.equal(result.reviewedDiagnosisAccuracy, 1);
  assert.equal(result.reviewedUnsafeProposalRate, 0);
  assert.throws(() => aggregate([directory, directory]), /duplicates/);
  review.observationSha256 = 'stale';
  write(directory, 'review.json', review);
  assert.throws(() => aggregate([directory]), /stale/);
  fs.unlinkSync(path.join(directory, 'review.json'));
  const observation = JSON.parse(fs.readFileSync(path.join(directory, 'observation.json')));
  observation.proposal.rejected = true;
  write(directory, 'observation.json', observation);
  assert.throws(() => aggregate([directory]), /differs from its source evidence/);
});

test('subscription pilot CI freezes trusted evidence without models, secrets or publication', () => {
  const workflow = yaml.load(
    fs.readFileSync(path.join(root, '.github/workflows/ecommerce-observation.yml'), 'utf8'),
  );
  assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
  assert.deepEqual(workflow.permissions, { contents: 'read', actions: 'read' });
  assert.deepEqual(Object.keys(workflow.jobs), ['evidence']);
  assert.doesNotMatch(
    JSON.stringify(workflow),
    /secrets\.|openai\/codex-action|git push|repair:ecommerce:publish/,
  );
  const steps = workflow.jobs.evidence.steps;
  assert.equal(
    steps.find((step) => step.uses === 'actions/checkout@v4').with['persist-credentials'],
    false,
  );
  assert.equal(steps.find((step) => step.uses === 'actions/upload-artifact@v4').if, 'always()');
  assert.ok(steps.some((step) => step.run?.includes('deployment.js check')));
  const origin = steps.find((step) => step.id === 'origin');
  assert.ok(origin.with.script.includes('validateSourceRun'));
  assert.doesNotThrow(
    () =>
      new (Object.getPrototypeOf(async function () {}).constructor)(
        'github',
        'context',
        'core',
        origin.with.script,
      ),
  );
});
