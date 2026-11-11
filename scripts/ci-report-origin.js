'use strict';
function validateOrigin(run, repository, defaultBranch, currentHead) {
  if (
    !run ||
    run.name !== 'Playwright Tests' ||
    run.status !== 'completed' ||
    ![
      'success',
      'failure',
      'cancelled',
      'timed_out',
      'neutral',
      'skipped',
      'action_required',
      'stale',
    ].includes(run.conclusion) ||
    !['push', 'workflow_dispatch'].includes(run.event) ||
    run.head_branch !== defaultBranch ||
    run.head_repository?.full_name !== repository ||
    !/^[a-f0-9]{40}$/.test(run.head_sha) ||
    run.head_sha !== currentHead ||
    !Number.isSafeInteger(run.id) ||
    run.id < 1
  )
    throw new Error(
      'Only a completed same-repository default-branch test run at the current commit may be published',
    );
  return {
    runId: run.id,
    runAttempt: run.run_attempt,
    frameworkRevision: run.head_sha,
    repository,
    branch: run.head_branch,
    testConclusion: run.conclusion,
    workflowUrl: `https://github.com/${repository}/actions/runs/${run.id}`,
    completedAt: run.updated_at || null,
  };
}
module.exports = { validateOrigin };
