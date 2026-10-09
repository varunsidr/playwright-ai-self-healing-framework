# Product Roadmap

This roadmap describes intended work, not features already delivered. The zeouf storefront remains the primary demonstration; its website is maintained and released separately.

## Product Direction

Build a developer-first quality assistant that accepts an application URL, a business requirements document (BRD), and an optional testing guide, then drafts core test cases, generates browser and API automation where feasible, explains failures, and proposes reviewable, verified test repairs. The first experience should fit local development and pull requests. Quality engineers remain responsible for risk selection, exploratory testing, and deciding whether changed product behavior is correct.

Promise faster, more trustworthy quality feedback. Do not claim that the product replaces testers or supports a fixed tester-to-developer staffing ratio. Measure whether a quality specialist can support more developers in pilots without a loss of coverage or quality.

A locator change may warrant a test repair. An application defect, bad test data, or unavailable environment must be reported as such. Preserve written expectations; require a diff, human review, and a verification run before calling a repair successful.

## Intended User Workflow

1. **Connect and understand:** The user supplies a reachable application URL, BRD, and optional `testing-guide.md`. If available, they also provide repository access or a pull-request diff, an API contract, test credentials, and a safe data-reset mechanism. Treat these documents and the live application as evidence; identify contradictions and missing information rather than inventing expected behavior.
2. **Plan core coverage:** Extract stable requirement IDs and acceptance criteria. Produce a risk-ranked coverage matrix that links each requirement to proposed positive, negative, boundary, role, and integration cases where relevant. Flag requirements that need a human decision or cannot be checked through the available UI/API. A case count alone is not a coverage claim.
3. **Generate and verify:** Turn suitable approved cases into readable Playwright tests using the target application's fixture and page objects. Run the generated tests in the intended environment, retain failure evidence, and record each case as verified, failing, blocked, or manual-only. Keep test cases and generated automation linked in both directions so testers can add or edit cases without losing their ownership.
4. **Respond to development changes:** On a code or requirements change, compare the diff with the requirement-to-test map and run affected tests. Diagnose whether a failure reflects an intended behavior change, stale locator, application defect, test-data issue, or environment issue. Propose changes to plans, test cases, and automation in a reviewable branch or pull request, then verify them. Application code alone must not silently redefine the expected result in the BRD.
5. **Report what remains:** Show covered and uncovered requirements, generated and verified tests, changed expectations awaiting approval, manual testing suggestions, blockers, and evidence. State plainly what the agent could not inspect, generate, run, or repair and why. Never present a skipped or unverified case as covered.

The promise is a useful first pass over the core journeys, not complete test coverage or guaranteed autonomous repair. Human approval is required before changing expected behavior or merging generated fixes.

## Delivery Order

### 1. Trustworthy storefront baseline

- Use a dedicated staging deployment and separate Supabase project for state-changing Zeouf tests, with predictable products, controlled inboxes, disposable shopper accounts, and verified cleanup. Keep public production checks read-only and block attempted writes.
- Distinguish mocked form validation, helper-created confirmed users, and real signup plus email-link verification in test plans and reports. Zeouf's `seed-user` helper is login setup, not proof of confirmation-email delivery; its registration UI may try `dev/create-user` before Supabase signup.
- Resolve the known product-detail Size Guide mismatch according to intended storefront behavior. Enable a signed-in cart and checkout journey with account setup and reset that leaves no persistent users or orders.
- Make the `ecommerce-chromium` result visible in CI. A green job must not imply that Zeouf was tested if its project was skipped.
- Reconcile plans, routes, and executable tests, including the perfume route and discovery-plan scenarios. Keep meaningful assertions.

**Done when:** a fresh developer or CI runner can reproduce the storefront smoke and shopping journeys, with clear status and failure artifacts.

### 2. BRD-to-core-tests workflow

- Define a small input contract for application URL, BRD, optional testing guide, environment, API description, credentials, and safe test-data setup. Start with Zeouf as the reference application; the current agents remain scoped to Zeouf until onboarding is implemented.
- Create a stable requirement-to-case-to-automation manifest. Preserve requirement IDs and links when documents or test files change; record source citations, priority, status, and the reason for manual or blocked coverage.
- Use the planner to draft a risk-ranked core suite from requirements and observed behavior. Let a tester review unclear expectations and add cases. Generate automation from approved cases, verify it, and publish a coverage-and-gaps report.
- Measure requirement coverage and verified automation separately. Add a small evaluation set with known requirements and expected core cases to detect omissions, invented assertions, and duplicate low-value tests.

**Done when:** a user can provide Zeouf's BRD and optional testing guide, obtain linked core test cases and runnable tests, and see an honest report of unautomated or unverified requirements.

### 3. Stronger API testing

- Consolidate duplicated request construction in `fixtures/api-fixtures.ts`; keep transport separate from resource-specific clients.
- Assert exact expected status codes and relevant response fields or schemas. Cover valid flows, invalid input, missing or expired authentication, and cross-user access to resource IDs where supported.
- Use an OpenAPI description when the target supplies one; otherwise maintain a small explicit contract for critical endpoints. Keep scenario assertions alongside contract checks.
- Isolate seeded data by environment and user. Make cleanup reliable, avoid clearing unrelated cache entries, and do not silently reuse deleted or expired accounts. Keep tokens out of logs and committed artifacts.
- Keep the public Notes API as a framework example. Add Zeouf API checks only against a controlled environment and its actual contracts.

**Done when:** API failures identify the broken contract precisely, parallel tests remain independent, and API setup can seed browser journeys without stale state.

### 4. Performance testing

- **Browser experience:** measure key pages with Lighthouse CI and set budgets after establishing a repeatable baseline. Record device, network, build, and environment. Track loading and layout; use interaction tests or field data for responsiveness.
- **Service capacity:** use k6 HTTP scenarios for representative browsing, search, login, and controlled checkout traffic. Define workload, latency percentiles, and error-rate thresholds from service goals and a baseline.
- Run a small performance smoke check in an appropriate CI environment. Run sustained load on a schedule or before release against an approved test deployment. Do not load test the public practice site or an uncontrolled production target.
- Show functional, API, browser-performance, and load results together while retaining distinct runners and failure meanings.

**Done when:** a repeatable result identifies which page or endpoint, metric, workload, and build regressed.

### 5. Change-aware test maintenance and verified repair

- Trigger impact analysis from an application-code or BRD/testing-guide diff. Link changed routes, UI behavior, API contracts, and acceptance criteria to affected cases; run the impacted tests and a small safety set.
- Evaluate stale locators, changed UI flows, application defects, bad data, and unavailable environments.
- Propose updates to plans, test cases, page objects, and automation together when the intended behavior changed. Keep the old and new expectation visible for review. Repair locators without weakening the assertion when behavior did not change.
- Record initial failure, diagnosis, proposed diff, reviewer decision, verification command, result, and time spent. Count false repairs, missed impacts, and correct decisions to leave a test unchanged.
- Surface concise failure evidence in CI and pull requests. Keep human review before merging agent-generated changes.
- Analyze recurring failures only after enough comparable runs exist. Do not prescribe retries or longer timeouts as the default fix.

**Done when:** a representative application change produces an accurate impact report and a verified, reviewable test update or a clear explanation of why no safe update was possible; evaluations show that repairs preserve assertions and classify app and environment failures correctly.

### 6. Tester workspace, recording and version history

- Build a local tool around the proven Zeouf runner: open a linked case, record or edit steps, run it, inspect evidence, and save a reviewed revision. Deliver one complete workflow before expanding into a general testing platform.
- Support explicit pause, tester takeover and resume when AI planning/generation gets stuck. Preserve the current case, completed actions, pending assertions and browser state while the session is alive; distinguish a generation handoff from pausing execution for debugging. Record manual intervention and require a fresh verification run before reporting a saved test as passed.
- Provide a visual editor for actions, inputs, assertions and fixture preconditions, with recording and a generated Playwright code preview. Use structured steps as the source for visual editing initially. Keep a code-editing path, but identify code-managed tests rather than promising lossless conversion of arbitrary code back into visual steps.
- Give tests stable IDs and immutable revisions; associate runs with the exact case revision, generated code, configuration, website build, fixture data and dependency/browser versions. Show revision diffs and support restoring an earlier revision without rewriting historical results. Version the wrapper/step format separately from test revisions; v1/v2 filename suffixes alone do not establish compatibility.
- Separate reusable project configuration from machine paths, environment values and secrets. Validate wrapper/config compatibility, preserve the lockfile and reproduce setup in CI; add meaningful runner/editor compatibility tests when these features are implemented.
- Show planned, generated, verified, failed, blocked and manual cases separately. Pause/resume, a manual completion or an AI repair must never suppress a failure or silently change the expected result.

**Delivery sequence:** establish critical storefront acceptance first, then deliver the smallest record/edit/run/takeover/save workflow and use it to expand coverage. Complete coverage is not a prerequisite for starting the workspace; a reliable automation foundation is.

**Done when:** a tester can complete this workflow without writing code, a developer can inspect/edit the generated test, and another machine can reproduce a saved revision with its recorded configuration. These features are future work, not existing capabilities.

### 7. Portability and developer-value pilot

- Onboard one additional application through the input workflow, with its own URL, seed, fixtures, page objects, agent scope, and CI setup. The current planner, generator, and healer remain scoped to Zeouf until another target is explicitly configured.
- Pilot with two or three development teams. Measure time to create a useful test, verified core-requirement coverage, uncovered-case reporting quality, time to diagnose a failure, accepted update/repair rate, false update/repair rate, escaped defects, and quality-specialist effort per release.
- Use observed results to refine the product claim and onboarding flow. Discuss staffing efficiency only if measured without reduced quality.

**Done when:** another team can adopt the workflow with documented effort and pilot data supports a specific value claim.

## Design Rules

- Keep the automation core readable and useful from a local terminal and pull request. Add the planned visual workspace over that runner so testers can record and edit without writing code; preserve a developer code-editing path.
- Prefer observable business assertions over large test counts, fixed inventory values, or silent runtime healing.
- Add shared layers only when they reduce duplication or onboarding work. Use feature-specific fixtures and clients rather than a generic utility framework.
- Combine API setup with browser assertions when it clarifies a business journey; retain separate API contract tests.
- Update [ARCHITECTURE.md](../ARCHITECTURE.md) when an implementation pattern becomes stable. Keep storefront plans linked to executable tests under `tests/ecommerce/`.

## Later Candidates

- A small accessibility smoke suite for important routes; `@axe-core/playwright` is installed but not yet used by tests.
- Deterministic test-data generation and replayable generated values when needed for isolation.
- Expand the local tester workspace into a shared dashboard after recording, editing, revision history and reproducible execution are validated.
- Broader visual, browser, and device coverage based on pilot defects or customer needs.
- Automatic application of agent changes only after repair evaluations and review controls demonstrate safety.

## Decision Filter

Before adding a feature, ask:

1. Which developer or quality-engineering problem does it solve?
2. How will we measure its benefit?
3. Does it preserve clear failure meaning and human review of changed expectations?
4. Can a smaller change achieve the same result?

## 2026 Reference Points

- [DORA's 2025 State of AI-assisted Software Development](https://dora.dev/research/2025/dora-report/) emphasizes the delivery system around AI tools.
- [Gartner's May 2026 agentic testing research abstract](https://www.gartner.com/en/documents/7835481) describes the move toward agent-led testing workspaces.
- [OpenAPI](https://spec.openapis.org/oas/) provides a machine-readable API contract standard.
- [Playwright Test Agents](https://playwright.dev/docs/test-agents) provide planner, generator, and healer building blocks, including optional product requirements context for planning.
- [Google's Web Vitals guidance](https://web.dev/articles/vitals-measurement-getting-started), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md), and [k6](https://grafana.com/docs/k6/latest/testing-guides/load-testing-websites/) inform the performance milestones.
