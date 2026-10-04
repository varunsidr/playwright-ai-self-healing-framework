# Product Roadmap

This roadmap describes intended work, not features already delivered. The zeouf storefront remains the primary demonstration; its website is maintained and released separately.

## Product Direction

Build a developer-first quality assistant that turns feature intent into useful browser and API checks, explains failures, and proposes reviewable, verified test repairs. The first experience should fit local development and pull requests. Quality engineers remain responsible for risk selection, exploratory testing, and deciding whether changed product behavior is correct.

Promise faster, more trustworthy quality feedback. Do not claim that the product replaces testers or supports a fixed tester-to-developer staffing ratio. Measure whether a quality specialist can support more developers in pilots without a loss of coverage or quality.

A locator change may warrant a test repair. An application defect, bad test data, or unavailable environment must be reported as such. Preserve written expectations; require a diff, human review, and a verification run before calling a repair successful.

## Delivery Order

### 1. Trustworthy storefront baseline

- When the standalone zeouf website is available, use a dedicated test deployment or documented local setup with predictable products and disposable, confirmed shopper accounts.
- Resolve the known product-detail Size Guide mismatch according to intended storefront behavior. Enable a signed-in cart and checkout journey with account setup and reset that leaves no persistent users or orders.
- Make the `ecommerce-chromium` result visible in CI. A green job must not imply that Zeouf was tested if its project was skipped.
- Reconcile plans, routes, and executable tests, including the perfume route and discovery-plan scenarios. Keep meaningful assertions.

**Done when:** a fresh developer or CI runner can reproduce the storefront smoke and shopping journeys, with clear status and failure artifacts.

### 2. Stronger API testing

- Consolidate duplicated request construction in `fixtures/api-fixtures.ts`; keep transport separate from resource-specific clients.
- Assert exact expected status codes and relevant response fields or schemas. Cover valid flows, invalid input, missing or expired authentication, and cross-user access to resource IDs where supported.
- Use an OpenAPI description when the target supplies one; otherwise maintain a small explicit contract for critical endpoints. Keep scenario assertions alongside contract checks.
- Isolate seeded data by environment and user. Make cleanup reliable, avoid clearing unrelated cache entries, and do not silently reuse deleted or expired accounts. Keep tokens out of logs and committed artifacts.
- Keep the public Notes API as a framework example. Add Zeouf API checks only against a controlled environment and its actual contracts.

**Done when:** API failures identify the broken contract precisely, parallel tests remain independent, and API setup can seed browser journeys without stale state.

### 3. Performance testing

- **Browser experience:** measure key pages with Lighthouse CI and set budgets after establishing a repeatable baseline. Record device, network, build, and environment. Track loading and layout; use interaction tests or field data for responsiveness.
- **Service capacity:** use k6 HTTP scenarios for representative browsing, search, login, and controlled checkout traffic. Define workload, latency percentiles, and error-rate thresholds from service goals and a baseline.
- Run a small performance smoke check in an appropriate CI environment. Run sustained load on a schedule or before release against an approved test deployment. Do not load test the public practice site or an uncontrolled production target.
- Show functional, API, browser-performance, and load results together while retaining distinct runners and failure meanings.

**Done when:** a repeatable result identifies which page or endpoint, metric, workload, and build regressed.

### 4. Verified agent diagnosis and repair

- Evaluate stale locators, changed UI flows, application defects, bad data, and unavailable environments.
- Record initial failure, diagnosis, proposed diff, reviewer decision, verification command, result, and time spent. Count false repairs and correct decisions to leave a test unchanged.
- Surface concise failure evidence in CI and pull requests. Keep human review before merging agent-generated changes.
- Analyze recurring failures only after enough comparable runs exist. Do not prescribe retries or longer timeouts as the default fix.

**Done when:** evaluation shows repairs preserve assertions and pass verification while app and environment failures are classified correctly.

### 5. Portability and developer-value pilot

- Onboard one additional application with its own URL, seed, fixtures, page objects, agent scope, and CI setup. The current planner, generator, and healer remain scoped to Zeouf until another target is explicitly configured.
- Pilot with two or three development teams. Measure time to create a useful test, time to diagnose a failure, accepted repair rate, false repair rate, escaped defects, and quality-specialist effort per release.
- Use observed results to refine the product claim and onboarding flow. Discuss staffing efficiency only if measured without reduced quality.

**Done when:** another team can adopt the workflow with documented effort and pilot data supports a specific value claim.

## Design Rules

- Keep the core code-first and useful from a local terminal and pull request. Add a UI only when pilots show it removes a real obstacle.
- Prefer observable business assertions over large test counts, fixed inventory values, or silent runtime healing.
- Add shared layers only when they reduce duplication or onboarding work. Use feature-specific fixtures and clients rather than a generic utility framework.
- Combine API setup with browser assertions when it clarifies a business journey; retain separate API contract tests.
- Update [ARCHITECTURE.md](../ARCHITECTURE.md) when an implementation pattern becomes stable. Keep storefront plans linked to executable tests under `tests/ecommerce/`.

## Later Candidates

- A small accessibility smoke suite for important routes; `@axe-core/playwright` is installed but not yet used by tests.
- Deterministic test-data generation and replayable generated values when needed for isolation.
- A lightweight runner or dashboard for users who cannot use the CLI, after the developer workflow is validated.
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
- [Google's Web Vitals guidance](https://web.dev/articles/vitals-measurement-getting-started), [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md), and [k6](https://grafana.com/docs/k6/latest/testing-guides/load-testing-websites/) inform the performance milestones.
