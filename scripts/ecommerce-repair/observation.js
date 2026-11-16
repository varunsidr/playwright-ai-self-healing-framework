'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const core = require('./core');
const runtime = require('./runtime');
const deployment = require('./deployment');
const { redact } = require('./evidence');
const { validatePublication } = require('./publish');

const json = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const duration = (item) => {
  const value = Date.parse(item?.completed_at) - Date.parse(item?.started_at);
  return Number.isFinite(value) && value >= 0 ? value : null;
};
const escape = (value) =>
  redact(String(value ?? 'Unavailable'))
    .replace(
      /[<>&|`]/g,
      (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '|': '&#124;', '`': '&#96;' })[char],
    )
    .replace(/[\r\n]+/g, ' ');

function buildObservation(directory) {
  const readErrors = [];
  const read = (name) => {
    if (!fs.existsSync(path.join(directory, name))) return null;
    try {
      return json(path.join(directory, name));
    } catch {
      readErrors.push('Unreadable JSON evidence: ' + name);
      return null;
    }
  };
  const state = read('state.json'),
    packet = read('failure-packet.json'),
    diagnosis = read('diagnosis.json');
  const sources = read('evidence-sources.json'),
    proposal = read('proposal.json');
  const execution = read('execution.json') || {
    jobs: [],
    warnings: ['CI execution metadata unavailable'],
    metrics: { complete: false },
  };
  const sourceRun = read('source-run.json');
  const blockers = [
    ...readErrors,
    ...(Array.isArray(packet?.blockers) ? packet.blockers : []),
    ...(Array.isArray(state?.blockers) ? state.blockers : []),
  ];
  if (!Array.isArray(execution.jobs)) {
    execution.jobs = [];
    blockers.push('Invalid CI job metadata');
  }
  const observationJob = execution.jobs.find((job) => job.name === 'Observe failure');
  const verificationJob = execution.jobs.find((job) => job.name === 'Verify isolated proposal');
  const step = (name) => observationJob?.steps?.find((item) => item.name === name);
  const attempted = (item) => !!item && !['skipped', null, undefined].includes(item.conclusion);
  let grounded = false;
  if (diagnosis && packet && sources) {
    try {
      core.validateDiagnosis(packet, diagnosis, sources);
      grounded = true;
    } catch (error) {
      blockers.push('Diagnosis rejected: ' + error.message);
    }
  }
  let verified = false;
  if (proposal?.status === 'verified-candidate') {
    try {
      if (verificationJob?.conclusion !== 'success')
        throw new Error('Independent verification job did not succeed');
      if (!sourceRun || sourceRun.frameworkRevision !== proposal.frameworkRevision)
        throw new Error('Original trusted source-run identity is missing or differs');
      if (!grounded || core.validateDiagnosis(packet, diagnosis, sources) !== proposal.role)
        throw new Error('Proposal does not match the grounded diagnosis');
      const patch = fs.readFileSync(path.join(directory, 'candidate.patch'));
      const report = fs.readFileSync(path.join(directory, 'candidate-results.json'));
      validatePublication(proposal, patch, report);
      const bytes = fs.readFileSync(path.join(directory, 'website-deployment.json'));
      if (core.hash(bytes) !== proposal.deploymentSha256)
        throw new Error('Deployment digest mismatch');
      deployment.validatePacket(
        packet,
        JSON.parse(bytes),
        bytes,
        proposal.frameworkRevision,
        proposal.websiteRevision,
      );
      const original = fs.readFileSync(
        path.join(directory, 'original/ecommerce-read-only-results.json'),
      );
      if (packet.reports.length !== 1 || core.hash(original) !== packet.reports[0].sha256)
        throw new Error('Original failure report digest mismatch');
      deployment.validateBinding(
        JSON.parse(original).config?.metadata || {},
        JSON.parse(bytes),
        bytes,
      );
      if (!runtime.reproduced(packet, { code: 1, report: read('baseline-results.json') }))
        throw new Error('Baseline failure did not reproduce');
      verified = true;
    } catch (error) {
      blockers.push('Verification rejected: ' + error.message);
    }
  }
  for (const job of execution.jobs)
    for (const item of job.steps || [])
      if (['failure', 'cancelled', 'timed_out'].includes(item.conclusion))
        blockers.push(job.name + ': ' + item.name + ' (' + item.conclusion + ')');
  const proposalAttempted = attempted(step('Propose isolated repair'));
  const captured = !!proposal && fs.existsSync(path.join(directory, 'candidate.patch'));
  const rejected = step('Capture guarded proposal')?.conclusion === 'failure';
  let status = 'blocked';
  if (verified) status = 'verified-candidate-for-review';
  else if (rejected) status = 'proposal-rejected';
  else if (captured) status = 'verification-incomplete-or-failed';
  else if (grounded && diagnosis.category === 'environment') status = 'environment-blocked';
  else if (grounded && diagnosis.category === 'unknown') status = 'needs-review';
  else if (state?.status === 'no-browser-failures') status = 'no-mapped-browser-failures';
  const inputs = [
    'source-run.json',
    'failure-packet.json',
    'state.json',
    'evidence-sources.json',
    'diagnosis.json',
    'repair.json',
    'proposal.json',
    'candidate.patch',
    'baseline-results.json',
    'candidate-results.json',
    'website-deployment.json',
    'execution.json',
  ];
  const hashes = Object.fromEntries(
    inputs
      .filter((name) => fs.existsSync(path.join(directory, name)))
      .map((name) => [name, core.hash(fs.readFileSync(path.join(directory, name)))]),
  );
  return {
    schemaVersion: 1,
    mode: 'manual-observation',
    generatedAt: new Date().toISOString(),
    status,
    sourceRun,
    observationRunId: execution.observationRunId || null,
    observationRunAttempt: execution.observationRunAttempt || null,
    failedCheckIds: Array.isArray(packet?.failures)
      ? packet.failures.map((item) => item.checkId)
      : [],
    diagnosis: {
      category: diagnosis?.category || null,
      grounded,
      reason: diagnosis?.reason || null,
      evidence: Array.isArray(diagnosis?.evidence)
        ? diagnosis.evidence.filter((item) => item && typeof item === 'object')
        : [],
    },
    proposal: {
      attempted: proposalAttempted,
      captured,
      rejected,
      role: proposal?.role || state?.role || null,
      files: Array.isArray(proposal?.files) ? proposal.files : [],
      patchSha256: proposal?.patchSha256 || null,
      diffExcerpt: fs.existsSync(path.join(directory, 'candidate.patch'))
        ? redact(fs.readFileSync(path.join(directory, 'candidate.patch'), 'utf8')).slice(0, 24000)
        : null,
      diffTruncated:
        fs.existsSync(path.join(directory, 'candidate.patch')) &&
        fs.statSync(path.join(directory, 'candidate.patch')).size > 24000,
    },
    verification: {
      attempted: verificationJob?.conclusion !== 'skipped' && !!verificationJob,
      passed: verified,
      originalFailurePreserved: true,
    },
    measurements: {
      observationJobMs: duration(observationJob),
      verificationJobMs: duration(verificationJob),
      agentStages: (observationJob?.steps || [])
        .filter((item) =>
          ['Diagnose recorded failure', 'Propose isolated repair'].includes(item.name),
        )
        .map((item) => ({
          name: item.name,
          conclusion: item.conclusion,
          elapsedMs: duration(item),
        })),
      tokenUsage:
        execution.metrics?.usageAvailable || execution.metrics?.complete
          ? execution.metrics.usage
          : null,
      usageComplete: execution.metrics?.complete === true,
      diagnosticAccuracy: null,
      note: 'Human labels are required for diagnosis accuracy; usage is not a dollar-cost estimate.',
    },
    blockers: [...new Set(blockers)],
    warnings: Array.isArray(execution.warnings) ? execution.warnings : [],
    hashes,
    automaticChanges: false,
    publication: false,
    merge: false,
    deployment: false,
  };
}

function markdown(record) {
  const usage = record.measurements.tokenUsage;
  const diff = record.proposal.diffExcerpt || 'No candidate patch was captured.';
  const fence = '`'.repeat(
    Math.max(3, ...[...diff.matchAll(/`+/g)].map((match) => match[0].length + 1)),
  );
  return [
    '# Zeouf CI observation',
    '',
    `Status: **${escape(record.status)}**. Original failure outcomes remain unchanged.`,
    '',
    '| Item | Observed result |',
    '| --- | --- |',
    `| Source run | ${escape(record.sourceRun ? record.sourceRun.repository + ' / ' + record.sourceRun.runId : 'Unavailable')} |`,
    `| Failed checks | ${escape(record.failedCheckIds.join(', ') || 'Unavailable')} |`,
    `| Diagnosis | ${escape(record.diagnosis.category)}; grounded: ${record.diagnosis.grounded} |`,
    `| Proposal | attempted: ${record.proposal.attempted}; captured: ${record.proposal.captured}; rejected: ${record.proposal.rejected} |`,
    `| Independent verification | ${record.verification.passed ? 'Passed against unchanged tests' : 'Not established'} |`,
    `| Observation / verification job time | ${escape(record.measurements.observationJobMs)} / ${escape(record.measurements.verificationJobMs)} ms |`,
    `| Input / cached input / output tokens | ${usage ? [usage.input_tokens, usage.cached_input_tokens ?? 0, usage.output_tokens].join(' / ') + (record.measurements.usageComplete ? '' : ' (partial; completeness not established)') : 'Unavailable (not zero)'} |`,
    '| Diagnosis accuracy | Unscored; requires human review |',
    '',
    'No branch, PR, merge or deployment is created by this workflow.',
    '',
    '## Diagnosis evidence',
    '',
    escape(record.diagnosis.reason),
    '',
    ...record.diagnosis.evidence.map(
      (item) => `- ${escape(item.source)}: ${escape(item.quote)} — ${escape(item.explanation)}`,
    ),
    '',
    '## Proposal and verification evidence',
    '',
    `Changed paths: ${escape(record.proposal.files.join(', ') || 'None captured')}.`,
    '',
    fence + 'diff',
    diff,
    fence,
    '',
    ...(record.proposal.diffTruncated
      ? ['Patch excerpt truncated; inspect the complete candidate.patch artifact.', '']
      : []),
    'Inspect `candidate.patch`, `proposal.json`, `baseline-results.json`, `candidate-results.json`, and the browser artifacts when present. Input hashes are recorded in `observation.json`.',
    '',
    '## Blockers and measurement gaps',
    '',
    ...[...record.blockers, ...record.warnings].map((item) => '- ' + escape(item)),
    '',
    'Copy `review-template.json` to `review.json` and supply a human reviewer, rationale, expected category and proposal safety before aggregating reviewed accuracy.',
    '',
  ].join('\n');
}

function report(directory, summaryFile = process.env.GITHUB_STEP_SUMMARY) {
  fs.mkdirSync(directory, { recursive: true });
  const record = buildObservation(directory);
  write(path.join(directory, 'observation.json'), record);
  const text = markdown(record);
  fs.writeFileSync(path.join(directory, 'observation.md'), text);
  if (summaryFile) fs.appendFileSync(summaryFile, text);
  write(path.join(directory, 'review-template.json'), {
    schemaVersion: 1,
    observationSha256: core.hash(fs.readFileSync(path.join(directory, 'observation.json'))),
    reviewer: '',
    rationale: '',
    expectedCategory: null,
    proposalSafety: 'unreviewed',
  });
  return record;
}

function aggregate(directories) {
  const records = directories.map((directory) => {
    const bytes = fs.readFileSync(path.join(directory, 'observation.json'));
    const observation = JSON.parse(bytes);
    const recomputed = buildObservation(directory);
    const { generatedAt: recordedTime, ...recorded } = observation;
    const { generatedAt: recomputedTime, ...current } = recomputed;
    assert.deepEqual(
      recorded,
      current,
      'Observation differs from its source evidence; regenerate it and obtain fresh review',
    );
    let review = null;
    if (fs.existsSync(path.join(directory, 'review.json'))) {
      review = json(path.join(directory, 'review.json'));
      if (
        review.schemaVersion !== 1 ||
        review.observationSha256 !== core.hash(bytes) ||
        !review.reviewer?.trim() ||
        !review.rationale?.trim() ||
        !['test', 'application', 'environment', 'unknown'].includes(review.expectedCategory) ||
        !['safe', 'unsafe', 'not-proposed'].includes(review.proposalSafety) ||
        (observation.proposal.attempted
          ? review.proposalSafety === 'not-proposed'
          : review.proposalSafety !== 'not-proposed')
      )
        throw new Error('Human review is incomplete, stale or inconsistent with its observation');
    }
    if (!observation.sourceRun)
      throw new Error('Aggregation needs an eligible source-run identity');
    return { observation, review };
  });
  const identities = records.map(
    ({ observation: item }) =>
      `${item.sourceRun.repository}/${item.sourceRun.runId}/${item.sourceRun.runAttempt}`,
  );
  if (new Set(identities).size !== identities.length)
    throw new Error(
      'Choose one observation per original source-run attempt; duplicates cannot inflate the pilot sample',
    );
  const reviewed = records.filter((item) => item.review);
  const reviewedProposals = reviewed.filter((item) => item.observation.proposal.attempted);
  const captured = records.filter((item) => item.observation.proposal.captured).length;
  const verified = records.filter((item) => item.observation.verification.passed).length;
  const correct = reviewed.filter(
    (item) => item.observation.diagnosis.category === item.review.expectedCategory,
  ).length;
  const unsafe = reviewedProposals.filter((item) => item.review.proposalSafety === 'unsafe').length;
  return {
    schemaVersion: 1,
    observations: records.length,
    proposalAttempts: records.filter((item) => item.observation.proposal.attempted).length,
    capturedProposals: captured,
    rejectedProposals: records.filter((item) => item.observation.proposal.rejected).length,
    independentlyVerifiedRepairs: verified,
    verifiedRepairRate: captured ? verified / captured : null,
    humanReviewedObservations: reviewed.length,
    correctReviewedDiagnoses: correct,
    reviewedDiagnosisAccuracy: reviewed.length ? correct / reviewed.length : null,
    humanReviewedProposals: reviewedProposals.length,
    unsafeReviewedProposals: unsafe,
    reviewedUnsafeProposalRate: reviewedProposals.length ? unsafe / reviewedProposals.length : null,
    note: 'Run-level diagnoses, not per-check accuracy. Unreviewed observations remain in totals and outside reviewed-rate denominators. Rejected proposals are not automatically labeled unsafe.',
  };
}

function main(args = process.argv.slice(2)) {
  const [mode, directory, ...inputs] = args;
  if (!directory || !['report', 'aggregate'].includes(mode))
    throw new Error(
      'Expected report <directory> or aggregate <new-output-directory> <observation-directory> [...]',
    );
  if (mode === 'report') {
    if (inputs.length) throw new Error('Report accepts one evidence directory');
    return report(path.resolve(directory));
  }
  if (!inputs.length || fs.existsSync(directory))
    throw new Error('Aggregate requires observation directories and a new output directory');
  const result = aggregate(inputs.map((input) => path.resolve(input)));
  fs.mkdirSync(directory, { recursive: true });
  write(path.join(directory, 'pilot-metrics.json'), result);
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { buildObservation, markdown, report, aggregate, main, duration };
