# Manual CI observation pilot

The **Zeouf CI observation pilot** workflow diagnoses a real, mapped browser failure, captures a constrained proposal in a disposable checkout, and independently verifies it on a separate runner. It publishes a Markdown summary and downloadable evidence. It has no branch creation, pull request, merge or deployment step, and its GitHub permissions are limited to Contents read and Actions read.

This is a new manual entry point beside the existing repair workflow. It reuses `repair:ecommerce:ci` preparation, grounded diagnosis routing, proposal guards and independent verification; it does not enable the existing workflow's automatic or publication settings.

## Starting a pilot

1. Review and merge this framework change onto the default branch. The workflow must exist there before GitHub offers manual dispatch.
2. Configure the framework repository's existing `OPENAI_API_KEY` Actions secret. The pinned Codex Action receives it through its API proxy. No publisher token, production service credentials or copied local Codex login is needed.
3. Manually start **Playwright Tests** on that default-branch revision with `pin_deployment` checked. Keep confirmed staging disabled. The immutable Zeouf deployment must pass its accessibility probe and produce `website-deployment.json` alongside the browser report and trace/ARIA artifacts.
4. If mapped browser tests fail, start **Zeouf CI observation pilot** on the same default-branch revision and enter that test run's numeric ID.
5. Read the job summary and download `zeouf-observation-report`. Preserve the original failure; a verified candidate is evidence for human review, not a rewrite of the failed run.

The pilot accepts only a completed, failed, first-attempt **Playwright Tests** run from a push or manual dispatch in the same repository, on its default branch, at the selected workflow commit. Pull request/fork runs, other workflows, later workflow reruns and older framework commits are rejected. If the branch advanced, run fresh pinned tests. “First attempt” refers to the GitHub workflow attempt; independent repair verification always uses zero Playwright retries.

Unpinned public-alias reports cannot authorize a repair. Missing deployment metadata, inaccessible immutable deployments, mismatched revisions/digests, runner errors or unmapped failures remain blockers. The earlier immutable deployment access problem is preserved in the historical reports; the pilot does not disable access protection or switch URLs after a failed pinned probe.

## Workflow and evidence

| Job                        | Behavior                                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Observe failure            | Validates run and deployment identity, downloads original artifacts, freezes evidence, runs read-only diagnosis, grounds exact citations, and captures a guarded proposal in isolated source               |
| Verify isolated proposal   | Runs without model or production service secrets; rechecks identity, reproduces the unpatched failure, applies the proposal, runs affected build/checks and unchanged regressions with zero retries        |
| Publish observation report | Runs even after failure or abstention; collects completed job metadata and protocol usage, revalidates report/patch/deployment hashes and reproduced failures, then writes the summary and review template |

Environment and unknown diagnoses do not invoke a repair agent. Framework proposals may change only existing storefront POM test-ID literals. Website proposals remain limited to diagnosed source paths and scoped documentation under the existing gates. Tests, assertions, fixtures, requirements, manifests and configuration stay protected.

Both agent stages use the existing pinned Codex Action with `drop-sudo`, restricted permission profiles, recorded evidence and browser MCP disabled. `--json` emits protocol events into GitHub job logs. The final job reads those completed logs through the GitHub Actions read API; it retains only usage/error/tool metadata, not a second raw transcript. Setup and tool execution are included in measured action-step wall time. Reported input tokens include cached input tokens; figures are not dollar-cost estimates.

Missing logs or failed agent stages leave usage unavailable or explicitly partial rather than reporting zero. Instrumentation gaps remain visible independently of verification. The source job can fail while the reporting job successfully produces a blocked report; the failed source run remains failed.

The final artifact contains original failure artifacts, failure packet and bounded trace/ARIA evidence, exact source quotes, prompts/schemas, diagnosis, repair response, `candidate.patch`, proposal, independent baseline/candidate reports and browser artifacts when available. Its final files are:

- `observation.md`: diagnosis, inline bounded diff, verification, time, tokens and blockers.
- `observation.json`: measured outcome, explicit disabled publication flags and input hashes.
- `execution.json` and `agent-events.jsonl`: GitHub job/step timing and parsed protocol metrics.
- `review-template.json`: unfilled human assessment bound to the exact observation digest.

Three artifacts preserve progress: `zeouf-observation-proposal`, `zeouf-observation-verification` when that job runs, and `zeouf-observation-report`. Retention is thirty days. Missing proposal artifacts still produce a blocked final report when the report job can execute.

## Reviewing and tracking real failures

CI can establish reproduced failures, guarded proposals and verified repairs. Diagnosis accuracy and unsafe-repair ground truth require human review; they remain unscored until supplied. A scope rejection is counted separately and does not automatically prove the proposal was semantically unsafe.

Download each final artifact into its own directory. Copy `review-template.json` to `review.json` and fill:

```json
{
  "schemaVersion": 1,
  "observationSha256": "retain-the-template-digest",
  "reviewer": "Human reviewer",
  "rationale": "Evidence supporting the expected category and proposal safety",
  "expectedCategory": "test",
  "proposalSafety": "safe"
}
```

`expectedCategory` must be `test`, `application`, `environment` or `unknown`. `proposalSafety` must be `safe` or `unsafe` if a repair agent attempted a proposal, and `not-proposed` otherwise. Review the complete group of failed checks; mixed causes require `unknown`. Retain the original observation bytes after review; regenerating the report requires fresh review.

```powershell
# Rebuild a report from retained evidence without calling a model.
npm run observe:ecommerce -- report test-results/my-observation

# Aggregate one or more downloaded observations into a new output directory.
npm run observe:ecommerce -- aggregate test-results/my-pilot-rollup test-results/observation-1 test-results/observation-2
```

Aggregation revalidates the evidence and review digest. It rejects duplicate original source-run attempts instead of inflating the sample with repeated observations. `pilot-metrics.json` reports proposal attempts, captured/rejected proposals, independently verified repair rate, reviewed diagnosis accuracy and reviewed unsafe-proposal rate. Rates without a reviewed denominator are `null`, not zero. Accuracy is measured per run-level diagnosis, not per check; unreviewed observations remain visible in total counts.

## Local validation: 12 November 2026

The workflow passed official `actionlint` **1.7.11** using its Docker image with only YAML on stdin and networking disabled inside the container. Regression tests cover trusted origins, real protocol usage, failed-stage measurements, forged verification claims, changed original reports/patches/baselines, missing evidence, abstention, stale human labels, duplicate samples and the actual workflow routing expressions.

The archived real connection-reset failure was replayed through the report builder under `test-results/ci-observation-local-2026-11-12/`. It produced the expected **blocked** report because the archived run has no immutable deployment binding or trusted GitHub run identity. Original report/POM hashes were unchanged, with zero model calls and no remote workflow dispatch. This local replay is not counted as a live pilot observation.

`npm run check` passed with exit code zero after the implementation changes. The complete log is `repository-check.log` in that local evidence directory; `checks.json` records the validated workflow hash and actionlint image digest.

The [forty-case controlled evaluation](ecommerce-expanded-agent-evaluation.md) remains separate from real CI pilot measurements. No real-failure accuracy or remote CI execution is claimed by these local checks.

Implementation references: [official Codex Action configuration](https://learn.chatgpt.com/docs/github-action), [Codex JSONL usage events](https://learn.chatgpt.com/docs/non-interactive-mode), and [GitHub job metadata and logs API](https://docs.github.com/en/rest/actions/workflow-jobs).
