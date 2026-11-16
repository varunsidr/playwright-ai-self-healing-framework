'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { summarizeEvents } = require('./protocol');
const { redact } = require('./evidence');

function validateSourceRun(run, repository, defaultBranch, revision) {
  if (
    run.name !== 'Playwright Tests' ||
    run.path !== '.github/workflows/playwright.yml' ||
    run.status !== 'completed' ||
    run.conclusion !== 'failure' ||
    !['push', 'workflow_dispatch'].includes(run.event) ||
    run.head_branch !== defaultBranch ||
    run.head_repository?.full_name !== repository ||
    !/^[a-f0-9]{40}$/.test(run.head_sha) ||
    run.head_sha !== revision ||
    run.run_attempt !== 1 ||
    !Number.isSafeInteger(run.id) ||
    run.id <= 0
  )
    throw new Error(
      'Pilot requires a failed first-attempt same-repository default-branch Playwright Tests run at the selected workflow revision. Run fresh pinned tests after framework changes.',
    );
  return {
    repository,
    runId: run.id,
    runAttempt: run.run_attempt,
    frameworkRevision: run.head_sha,
    workflow: run.name,
    branch: run.head_branch,
    event: run.event,
    url: `https://github.com/${repository}/actions/runs/${run.id}`,
  };
}

function protocolEvents(log) {
  const events = [];
  for (const line of log.split('\n')) {
    const text = line.replace(/^\d{4}-\d\d-\d\dT\S+Z\s+/, '').trim();
    if (!text.startsWith('{')) continue;
    try {
      const event = JSON.parse(text);
      if (event.type === 'turn.completed') {
        const usage = event.usage;
        if (
          usage &&
          Object.values(usage).some(
            (value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0,
          )
        )
          continue;
        events.push({ type: event.type, ...(usage ? { usage } : {}) });
      } else if (event.type === 'turn.failed' || event.type === 'error') {
        events.push({
          type: event.type,
          error: redact(JSON.stringify(event.error || 'Agent error')).slice(0, 1000),
        });
      } else if (
        event.type === 'item.completed' &&
        ['mcp_tool_call', 'command_execution', 'file_change', 'web_search'].includes(
          event.item?.type,
        )
      ) {
        const { type, server, tool, status } = event.item;
        events.push({ type: event.type, item: { type, server, tool, status } });
      }
    } catch {
      /* Ordinary action output is not a protocol event. */
    }
  }
  return events;
}

async function collectGithubEvidence(github, context, directory) {
  fs.mkdirSync(directory, { recursive: true });
  const warnings = [];
  let jobs = [];
  try {
    const response = await github.rest.actions.listJobsForWorkflowRunAttempt({
      ...context.repo,
      run_id: context.runId,
      attempt_number: Number(process.env.GITHUB_RUN_ATTEMPT || 1),
      per_page: 100,
    });
    jobs = response.data.jobs.filter((job) =>
      ['Observe failure', 'Verify isolated proposal'].includes(job.name),
    );
    if (jobs.filter((job) => job.name === 'Observe failure').length !== 1)
      throw new Error('Observation job identity is missing or ambiguous');
  } catch (error) {
    warnings.push('Job metadata unavailable: ' + error.message);
  }
  let events = [];
  const observation = jobs.find((job) => job.name === 'Observe failure');
  if (observation?.status === 'completed') {
    try {
      const response = await github.rest.actions.downloadJobLogsForWorkflowRun({
        ...context.repo,
        job_id: observation.id,
      });
      const log =
        typeof response.data === 'string'
          ? response.data
          : Buffer.from(response.data).toString('utf8');
      events = protocolEvents(log);
    } catch (error) {
      warnings.push('Agent usage log unavailable: ' + error.message);
    }
  }
  const encoded = events.map((event) => JSON.stringify(event)).join('\n');
  fs.writeFileSync(path.join(directory, 'agent-events.jsonl'), encoded + '\n');
  const successfulAgentSteps = (observation?.steps || []).filter(
    (step) =>
      ['Diagnose recorded failure', 'Propose isolated repair'].includes(step.name) &&
      step.conclusion === 'success',
  ).length;
  const failedAgentSteps = (observation?.steps || []).filter(
    (step) =>
      ['Diagnose recorded failure', 'Propose isolated repair'].includes(step.name) &&
      ['failure', 'cancelled', 'timed_out'].includes(step.conclusion),
  ).length;
  const metrics = summarizeEvents(encoded, null);
  metrics.complete =
    events.filter(
      (event) =>
        event.type === 'turn.completed' &&
        event.usage &&
        Number.isFinite(event.usage.input_tokens) &&
        Number.isFinite(event.usage.output_tokens),
    ).length >= successfulAgentSteps &&
    successfulAgentSteps > 0 &&
    failedAgentSteps === 0;
  if (!metrics.complete && (successfulAgentSteps || failedAgentSteps))
    warnings.push('Complete usage is not established across all attempted agent stages');
  const evidence = {
    schemaVersion: 1,
    observationRunId: context.runId,
    observationRunAttempt: Number(process.env.GITHUB_RUN_ATTEMPT || 1),
    jobs: jobs.map(({ name, conclusion, status, started_at, completed_at, steps }) => ({
      name,
      conclusion,
      status,
      started_at,
      completed_at,
      steps,
    })),
    metrics,
    warnings,
  };
  fs.writeFileSync(
    path.join(directory, 'execution.json'),
    JSON.stringify(evidence, null, 2) + '\n',
  );
  return evidence;
}

module.exports = { validateSourceRun, protocolEvents, collectGithubEvidence };
