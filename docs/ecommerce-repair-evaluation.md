# Repeatable Zeouf failure and repair rehearsal

Run from the repository root:

```powershell
npm.cmd run demo:ecommerce:repair
```

This command launches five serial Playwright invocations of `tests/ecommerce/repair-evaluation.spec.ts`, always in `ecommerce-chromium`, with fresh browser contexts, one worker and zero retries. It targets the configured `ECOMMERCE_BASE_URL`, defaulting to the public Zeouf deployment. It does not switch applications if Zeouf is unavailable. Only browser-local DOM changes and request interception are used; server writes are blocked. No additional paid service or agent API is invoked.

The [scenario plan](../specs/ecommerce/20-controlled-repair-evaluation.md) preserves the existing TC-CNT-001-01 newsletter preview expectation and no-write assertion. The production newsletter test and page object are unchanged.

## What the stages demonstrate

| Stage                   | Actual browser behavior                         | Required result                               |
| ----------------------- | ----------------------------------------------- | --------------------------------------------- |
| baseline                | Current unmodified newsletter preview           | Passed                                        |
| locator-drift           | Same button and behavior with a renamed test ID | Failed at the old locator                     |
| locator-repair          | Same rename; use the observed replacement ID    | Passed with the same assertions               |
| application-defect      | Generated preview notice text is changed        | Failed notice assertion; report defect        |
| environment-unavailable | Document navigation is intercepted and refused  | Failed navigation; report environment blocker |

Diagnosis uses observed DOM state, navigation interception, write attempts and actual Playwright failure messages. The expected scenario labels are used to assess those diagnoses, not supplied as the diagnosis input. These rules cover only this small predefined set; they do not establish general classification or autonomous AI repair accuracy.

The locator proposal is a reviewable diff against the current page-object method. Its selector change is exercised in a separate evaluation helper, not applied to the production page object. The verification is therefore a repair **rehearsal**, not approval or verification of a merged production change. Human review is pending. The next independent evaluation should feed proposals from the agent workflow into held-out scenarios.

## Evidence and status

Open `test-results/ecommerce-repair-evaluation/latest.md` for the latest summary. Each invocation creates a new timestamped directory beneath that folder, preserving earlier evaluations. `latest.md` and `latest.json` are convenience pointers/snapshots that are replaced on the next run.

Each archived run contains:

- A JSON/Markdown assessment and locator proposal when a locator failure was observed.
- Five separate JSON/HTML Playwright reports and runner logs, or fewer stages when the baseline blocks evaluation.
- Original failure screenshots, video, traces and browser-observation JSON attachments.
- Hashes of the shared test, page objects, fixtures, evaluator, reporter, configuration and case/check inventories, plus Node/Playwright versions, execution metadata and raw report hashes. Full source files are not included in uploaded artifacts.

Normal Playwright failures are retained. There are no `test.fail`, skip, fixme or expectation changes that convert them into passes. The orchestration exits successfully only when the baseline and locator rerun pass, all three faults remain failed with matching diagnoses, every process/result agrees and the source files remain unchanged. `verified-rehearsal` describes the evaluation outcome, not the storefront's health. A baseline failure marks it blocked; missing evidence or a falsely green fault fails evaluation.

GitHub captures `GITHUB_SHA` in the existing reporter metadata. Locally, `ECOMMERCE_CODE_REVISION` can record a known source revision; do not label a dirty working tree as a clean commit. Optional `ECOMMERCE_BUILD_REVISION` is operator-supplied website metadata, not independent deployment verification. Unknown revisions stay null. Source hashes identify the files used; reproducing a run requires a matching repository checkout, dependencies and website build. Hashes alone cannot restore unknown local edits.

The generated proposal must pass `git apply --check` before the locator rerun; no source patch is applied. Allure outputs are isolated within each stage alongside JSON, HTML and browser artifacts. The existing case-monitoring outputs are not overwritten and these injected failures do not count as live BRD coverage. The evaluation spec is excluded from ordinary ecommerce test runs; the orchestration explicitly enables it in child processes only.

## CI and validation

The **Zeouf controlled repair rehearsal** workflow is manual (`workflow_dispatch`). It installs Chromium, runs the repository checks, executes the rehearsal and retains the entire evaluation directory as a `zeouf-repair-evaluation` artifact for 30 days. The job summary shows actual stage outcomes; download the artifact and open `latest.md` to follow its relative links. Intentional fault failures stay in their raw reports; the CI job's result represents whether the rehearsal behaved correctly. An application defect in the ordinary storefront suite still fails that suite independently.

Run `npm run test:repair-evaluation` to validate the evaluator's rejection of masked defects, writes, changed semantics, missing stages, skips, flaky/expected-failure runs, source mismatches and runner errors. These synthetic regression tests are part of `npm run check` and are distinct from browser evidence.

Local browser verification on 2026-10-11 observed the specified pass/fail sequence and three matching scripted diagnoses. GitHub Actions has not yet executed this workflow. Historical CI trend storage, held-out scenarios, agent-generated repair assessment and an isolated staging shopping journey remain future work.
