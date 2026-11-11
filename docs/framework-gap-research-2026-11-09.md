# Framework gap research — 9 November 2026

Follow-up: [10 November implementation and verification](framework-improvements-2026-11-10.md) records which findings have since been fixed, the offline-only benchmark, local Supabase integration, tester workspace and remaining gaps. The findings below preserve the original research state.

## Assessment and scope

The framework is a working Zeouf regression foundation. Its largest gaps are integrated service verification, consistent CI evidence, and independently measured repair quality. Expanding testcase counts alone will not close these gaps.

This review inspected the current working tree, including the uncommitted local contract additions, CI workflows, repair implementation/evaluation, project status and roadmap. It compared them with primary documentation from Playwright, Supabase, GitHub, Node.js, W3C and Grafana. It also checked the public website repository: its latest source remained `df94db96826c3226abc77422d2234c7d3db92ea1`; its workflow directory contained `ci-local.yml`, `requirements.yml` and `storefront.yml`. The proposed framework repair-PR verification template was not installed there at inspection time.

One local diagnostic reproduced a contract-harness defect. No production request, load test, deployment or runtime-code modification was performed for this research. Suggested priorities and delivery order below are engineering judgments, not an industry certification or a measured product-completion score.

The current 135/140 case linkage (96.4%) remains useful inventory information. It does not establish real-session acceptance, complete branch coverage, mutation resistance or general AI repair reliability. Existing safeguards—stable IDs, source/report hashes, preserved failures, write guards, reviewed expectations and independent patch verification—should be retained.

## Ranked findings

| Priority | Gap                                                             | Evidence in this repository                                                                                                                                   | Next deliverable                                                                                           |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| P0       | Integrated backend journeys remain unverified                   | `docs/ecommerce-project-status.md`; fake sessions/services in `fixtures/ecommerce-isolated.ts`; single-connection PGlite; injected clients in local contracts | Reproducible local application + Supabase integration runner, then hosted staging acceptance.              |
| P1       | A real outage cannot be represented by the new contract harness | `scripts/ecommerce-contracts/source.js:73` converts `null` to `false`                                                                                         | Preserve the limiter's three outcomes and add unavailable/limited/allowed regression cases.                |
| P1       | Published report is a separate test run                         | `.github/workflows/deploy-report.yml:28–29` reruns the default suite with `continue-on-error: true`                                                           | Publish artifacts from the authoritative test run, with its conclusion, commit, environment and run ID.    |
| P1       | Startup readiness and flaky-result policy are incomplete        | Recent two cart failures; readiness waits across several specs; CI retries enabled without `failOnFlakyTests`                                                 | Explicit startup contract, fast-interaction tests, required-suite flake policy and comparable run history. |
| P1       | Healing quality has no independent generalization evidence      | Newsletter-only scripted rehearsal in `docs/ecommerce-repair-evaluation.md`; guarded agent workflow exists separately                                         | Held-out failure/repair evaluation using proposals from the actual workflow.                               |
| P1       | Zeouf browser and quality dimensions are narrow                 | `ecommerce-chromium` only; Firefox/WebKit projects exclude ecommerce; no screenshot assertions found in ecommerce specs; serious prior contrast findings      | Small Zeouf browser/device matrix, actionable accessibility baseline and selective visual checks.          |
| P2       | Website-change integration is not installed end to end          | A repair-PR template exists; the current website workflow directory lacks it; no general change-to-case impact selector was found                             | Install reviewed cross-repository verification and evaluate impacted-test selection with a safety suite.   |
| P2       | Runtime consistency and maintenance need attention              | Node 20 in lint/performance jobs, Node 22 native, Node 24 repair, floating `lts/*` elsewhere; large mixed-domain POM                                          | Supported runtime policy and domain-focused page objects/fixtures.                                         |
| P2       | Performance measurement is not release acceptance               | Manual baseline workflow; k6 smoke has one VU/three iterations; latency threshold is optional                                                                 | Approved budgets and workload, then controlled performance gates and trends.                               |
| P2       | Product workflow and portability are unfinished                 | Zeouf-specific scope, repository identities/source pins and manual documents; visual workspace remains a roadmap item                                         | Minimal case → run → evidence → reviewed revision workflow, then a second-app onboarding pilot.            |

P0 means the largest confidence gap for release acceptance. P1 means a high-value near-term correction or capability. P2 means the following engineering/product increment; these are proposed priorities rather than existing project labels.

## 1. Add a real local integration tier

The browser fixtures and new 58-check handler/SQL suite verify useful behavior, but fictional bearer validation, RPCs and signed URLs do not test the application through actual Auth/Data API/Storage services. PGlite role checks execute real PostgreSQL policies but do not reproduce independent authenticated HTTP sessions or concurrent PostgreSQL connections. Critical gaps remain in signup/recovery, cross-account access, persisted checkout, cancellation, stock races, storage and notification delivery.

Only the main hosted website is available. A second public deployment is not required to start closing this gap: Supabase documents a self-contained local stack with Postgres, Auth and Storage, and migration/seed reset workflows. Adapting the application's current SQL/configuration and writing the runner is still real implementation work. Hosted environment parity, proxy behavior and real delivery need later verification. [Supabase local development](https://supabase.com/docs/guides/local-development), [migrations and seeded resets](https://supabase.com/docs/guides/local-development/database-migrations).

**Acceptance milestone:** a fresh checkout starts the application and isolated services, applies the reviewed migrations, creates two disposable customers, exercises a persisted order, proves ownership and rollback, runs independent-connection last-unit/duplicate-attempt races, and resets deterministically. Route real-service checks through a distinct integration configuration; the existing production-safe and fake-service guards remain meaningful. Security acceptance can be organized against relevant authentication, authorization and data-protection requirements from [OWASP ASVS](https://asvs.owasp.org/), without claiming certification from a passing fixture suite.

## 2. Correct a reproduced contract-harness defect

Current code uses:

```js
isRateLimited: async () => options.limited ?? false;
```

The real checkout handler distinguishes `null` (limiter unavailable, 503), `true` (limited, 429) and `false` (continue). Supplying `{ limited: null }` to the harness yields `false`, so it cannot simulate the unavailable branch correctly.

The local diagnostic loaded the actual pinned checkout handler, supplied `{ limited: null }`, and constructed an unauthenticated request in memory. Expected: 503 before authentication. Observed: **401, `Sign in to place an order.`** No backend client or network request was used. This is a confirmed harness defect, not evidence that the deployed limiter fails open. Existing 58 passing checks do not validate this omitted outage simulation.

**Acceptance milestone:** default to `false` only when the option is undefined; exercise all three outcomes for checkout and reviews, asserting that unavailable/limited responses precede auth/storage/purchase calls. This research records the issue; runtime code was not changed.

## 3. Make the report describe the authoritative run

The report-publication workflow launches another `npx playwright test --reporter=html`, tolerates its test failure, then publishes. Its green conclusion can therefore describe successful report deployment while the separate test run failed. Its default-suite scope also differs from the main workflow's separated public, isolated and native paths. This is not proof that the main test workflow masks failures; it creates two different evidence streams.

**Acceptance milestone:** retain the main test job's original artifacts and publish those exact files, tied to workflow run ID, framework SHA, website revision/deployment identity, fixture environment and conclusion. Publication status and test status should remain distinct and visible. GitHub supports retaining test outputs and downloading/sharing the resulting artifacts; the repository already uses that mechanism in repair verification. [GitHub workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data).

Source fingerprints and optional immutable deployment capture already exist. Do not replace them with a claimed deployment revision based only on a user-supplied environment value. Default public checks still use a mutable alias unless pinning is requested/configured.

## 4. Move from repeated readiness repairs to an explicit contract

The recent isolated run preserved two failures when account/cart initialization raced with opening the bag. Added badge-count/persistence-notice waits passed focused repetitions and a clean 176-check rerun. These establish the seeded-cart scenarios after restoration, while early real-user interaction remains a separate product behavior to test.

Playwright explicitly documents that visible, enabled controls can become actionable before hydration/listeners are complete and recommends application controls remain disabled until functional. This guidance supports reviewing readiness; it does not independently prove hydration was the cause of every observed cart failure. [Playwright navigation and hydration](https://playwright.dev/docs/navigations#hydration).

**Acceptance milestone:** define observable account/cart readiness centrally, retain meaningful assertions, and separately test early clicks under controlled initialization delay. Record first-attempt failures and environment/build identity over comparable runs. Current summaries already expose retries/flakes; the missing capability is a durable trend and explicit release policy. Native/isolated runners already demand zero retries. Other CI suites inherit two retries; Playwright can fail CI on flaky tests via [`failOnFlakyTests`](https://playwright.dev/docs/api/class-testconfig#test-config-fail-on-flaky-tests). Choose the policy by suite rather than claiming every retried failure is an application bug.

## 5. Demonstrate repair value beyond agent definitions

The framework has a guarded agent proposal/verification/publishing workflow. Its deterministic evaluation, however, covers a small predefined newsletter locator/application/environment scenario set. That rehearsal does not measure the agent's accuracy on unseen locator changes, behavior changes, permissions, bad data or environment failures. Whether the current operational pilot is configured and can access its protected immutable deployment was not verified here.

Playwright itself now provides planner, generator and healer agents. Therefore, merely bundling those roles is insufficient evidence of additional product value. The opportunity is requirements-grounded diagnosis, conservative repair, reproducible evidence and a reviewer workflow. That product assessment is an inference from the current implementation and the capabilities documented in [Playwright Test Agents](https://playwright.dev/docs/test-agents).

**Acceptance milestone:** feed real workflow proposals into a held-out pilot corpus. Include stale locators, intended behavior changes, broken features, authentication/data faults and unavailable environments. Preserve an `unknown`/abstain outcome. Measure diagnosis precision/recall, false repairs, assertion preservation, independently verified repairs, elapsed time and usage cost. Expand the corpus before making general reliability claims; a minimum pilot size is not a statistical guarantee.

## 6. Expand meaningful quality dimensions

The generic Firefox/WebKit projects exclude ecommerce; their presence does not give Zeouf cross-browser coverage. Start with a few critical Zeouf journeys in Chromium, Firefox and WebKit, plus selected mobile configurations. Browser projects are a supported mechanism, but adding them must also update this framework's Chromium-specific fixture guards, diagnostics, manifests and monitoring validation. [Playwright projects](https://playwright.dev/docs/test-projects).

No `toHaveScreenshot` assertions were found in the framework's ecommerce specs. Use a small reviewed visual baseline for stable high-risk surfaces rather than screenshotting every test. Existing native photo checks are useful but address a different scope. [Playwright screenshot assertions](https://playwright.dev/docs/test-assertions).

The earlier 15-sample audit reported serious contrast findings. Convert reproducible findings into owned defects and a controlled regression baseline; avoid silently disabling rules to obtain a green scan. Add keyboard and human assistive-technology evaluation. Automated accessibility tools cannot establish accessibility conformance alone. [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing), [W3C evaluation guidance](https://www.w3.org/WAI/test-evaluate/).

## 7. Connect website changes and make maintenance predictable

The proposed cross-repository repair-PR workflow exists at `templates/ecommerce/website-repair-pr.yml`; it is not installed in the inspected current website workflows. Install and verify that integration before claiming website PRs automatically run the unchanged external regressions. This does not mean the website lacks native CI—it already has its own checks. Source/version pins are currently duplicated across CI, the native runner and contract harness. They match the current website HEAD today; future updates need a reviewed single source of truth or a consistency check.

Add diff-to-case impact analysis with a small always-run safety suite. Evaluate missed impacts before using selection to remove tests from a release gate. Existing full-suite execution should remain available.

Node versions vary between jobs. Lint and performance still select Node 20, which the official release table now marks EOL; other jobs use supported fixed versions or floating `lts/*`. Use one documented supported baseline, with a deliberate compatibility matrix when needed. This is maintenance debt even while jobs pass. [Node.js release status](https://nodejs.org/en/about/previous-releases).

The mixed storefront page object is roughly a thousand lines and combines catalog, bag, auth, checkout and admin behavior. Splitting by domain would improve ownership and reduce unrelated repair edits. This is a maintainability judgment, not a demonstrated runtime bug. Documentation also drifts: README still contains an older 144-public-check statement alongside the current 128-public/176-isolated inventory. Generate current summaries from the manifests and keep historical results explicitly dated.

## 8. Turn measurements and product plans into usable workflows

Performance tooling already exists. The browser baseline is manually dispatched; latency budgets are optional, and the k6 smoke is a one-user, three-iteration probe. It does not establish capacity. Agree device/network/data/build conditions and budgets first, then make relevant regressions fail a controlled gate and retain comparable trends. k6 thresholds provide metric-based pass/fail criteria; its documentation examples are not budgets to copy into this project. [Grafana k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/).

The tester workspace, recording/editing, takeover/resume, immutable editable revisions and generic onboarding remain future work in `roadmap/FUTURE_ENHANCEMENTS.md`. Build one narrow case → run → inspect → reviewed-change workflow around the existing runner, then onboard another application through explicit configuration. It can proceed alongside integration work; 140/140 case linkage is not a prerequisite. Generic portability is a product-development task, not a missing Playwright option.

## Recommended delivery order

1. **Immediate corrections:** fix and test null-limiter injection; align supported Node runtimes; make published reports consume the authoritative run. These need no hosted staging.
2. **Confidence increment:** implement a reproducible local integrated backend, critical real-session journeys, independent-connection races and an observable startup contract. Keep hosted acceptance separately pending.
3. **Release quality increment:** add selected Zeouf browser/device coverage, a11y defect/regression handling, explicit flaky-result policy and agreed performance budgets. Preserve comparable run history.
4. **Agent/product increment:** benchmark actual agent proposals on held-out cases, install website-change verification, and deliver the minimal tester review workflow. Evaluate a second-app onboarding pilot before claiming a general framework product.

The best next investment is a trustworthy integrated execution and evidence pipeline. Additional tests should follow a named risk or missing behavior, rather than a target testcase count.
