# Playwright AI Self-Healing Framework

A code-first Playwright TypeScript framework demonstrated across UI and API testing.
The zeouf fashion storefront is the primary demonstration for its agent-assisted planning, test generation, and repair workflow. Expand Testing, TodoMVC, and API examples show broader scenarios the storefront does not cover.

[![Playwright Tests](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/workflows/playwright.yml)
[GitHub repo](https://github.com/varunsidr/playwright-ai-self-healing-framework)

## Quick Setup Notes

- The suite runs on Chromium, Firefox, and WebKit.
- `playwright-report/` holds the HTML report output.
- `test-results/` holds traces, screenshots, videos, and other failure artifacts.
- New specs should import `test` and `expect` from their project fixture: `fixtures/ecommerce-base.ts` for Zeouf, `fixtures/api-fixtures.ts` for API tests, or `fixtures/base.ts` for practice-site examples.
- The zeouf storefront is the primary demo for the planner, generator, and healer agents, using its dedicated project, seed, plans, and tests.
- Expand Testing and TodoMVC UI scenarios, plus API tests, demonstrate additional framework coverage beyond the storefront; these are separate examples, not targets for the storefront agents.
- API scenarios cover health checks, authentication, notes CRUD and validation, and API state-cache behavior.
- The fashion storefront agents use `tests/ecommerce/seed.spec.ts` as their starting page; `tests/seed.spec.ts` is for the older Expand Testing examples.
- “Self-healing” currently means agent-assisted diagnosis and repair of test code; tests do not rewrite locators or recover autonomously at runtime.

---

## Tech Stack

| Layer       | Choice                               | Why                                                         |
| ----------- | ------------------------------------ | ----------------------------------------------------------- |
| Language    | TypeScript                           | Strong typing and readable test code                        |
| Automation  | Playwright                           | Fast, stable browser automation with built-in artifacts     |
| Test Runner | Playwright Test                      | Parallel execution, retries, projects, and native reporting |
| Build       | npm                                  | Simple dependency and script management                     |
| Reporting   | Playwright HTML report               | Built-in visual report for failures and traces              |
| CI          | GitHub Actions                       | Runs the suite on push and pull request events              |
| Structure   | Page Object Model + flows + fixtures | Keeps test intent separate from UI details                  |

---

## Project Structure

```text
pw-mcp-demo/
├── ARCHITECTURE.md
├── README.md
├── .codex/                 # Codex storefront agent profiles and MCP config
├── .github/agents/         # Copilot storefront agent profiles
├── docs/                   # Static analysis and Playwright/API design notes
├── fixtures/               # UI/API fixtures and shared test data
├── flows/                  # Scenario-level UI orchestration
├── pages/                  # Storefront, practice-site, and TodoMVC page objects
├── roadmap/                # Planned enhancements
├── scripts/                # Static analysis rules
├── specs/ecommerce/        # Zeouf agent plans
├── tests/
│   ├── api/                # API health, auth, notes CRUD/contracts, cache
│   ├── ecommerce/          # Primary Zeouf agent demo and storefront tests
│   ├── demo-inputs.spec.ts
│   ├── home.spec.ts
│   ├── register.spec.ts
│   ├── seed.spec.ts
│   └── todo.spec.ts
├── utils/                  # Runtime config, notes client, API state cache
├── playwright.config.ts
└── package.json
```

Tests describe behavior and page objects own locators and page-level actions. The practice-site examples also use flows for multi-step scenarios.

---

## How To Run

From the repository root:

```powershell
npm install
npx playwright install
npm test
```

Run headed mode:

```powershell
npm run test:headed
```

Open the latest HTML report:

```powershell
npm run report
```

Start a codegen session for the inputs page:

```powershell
npm run record
```

Run the custom static analysis rules:

```powershell
npm run analyze
```

Run the complete local quality gate used by CI:

```powershell
npm run check
```

Run tests by purpose:

```powershell
npm run test:smoke
npm run test:happy
npm run test:negative
npm run test:regression
```

Run only one test layer:

```powershell
npm run test:api
npm run test:ui
```

### Run the separate ecommerce storefront suite

The ecommerce app and this test framework stay in separate repositories. Ecommerce tests target the [deployed Zeouf storefront](https://zeouf-luxury-fashion-ecommerce.vercel.app/) by default. From this framework's `pw-mcp-demo` directory, run the ecommerce-only browser project:

```powershell
cd "<path-to-this-framework>\pw-mcp-demo"
npm run test:ecommerce
```

The default `npm test` includes every project, including ecommerce. `npm run test:smoke` runs only the app-independent API and Chromium smoke checks; use `npm run test:ecommerce:smoke` for storefront smoke coverage.

Set `ECOMMERCE_BASE_URL` to target another instance. For local development, start the ecommerce app separately and set `$env:ECOMMERCE_BASE_URL = 'http://localhost:3000'` in PowerShell before running read-only tests. Ecommerce tests use their own fixture and Playwright project; the existing Expand Testing and API projects retain their own targets and fixtures.

Write-capable Zeouf tests stay skipped until `ECOMMERCE_STAGING_CONFIRMED=true` and `ECOMMERCE_BASE_URL` names a separate HTTPS deployment, not the public storefront. The flag is an operator assertion that the deployment uses its **own Supabase project**, disposable data, and verified cleanup; the framework cannot infer database isolation from a URL. The perfume journey also requires an already confirmed disposable user supplied through `ECOMMERCE_TEST_USER_EMAIL` and `ECOMMERCE_TEST_USER_PASSWORD`. It does not register an account or prove email delivery. In GitHub Actions, set the URL and confirmation as repository variables and credentials as secrets. CI runs read-only smoke, browser fixtures and navigation checks until confirmation is set; its full-suite preflight fails if the URL or credentials are absent.

Run only the ecommerce categories:

```powershell
npm run test:ecommerce:smoke
npm run test:ecommerce:happy
npm run test:ecommerce:regression
npm run test:ecommerce:fixtures
npm run test:ecommerce:navigation
```

For Zeouf API and performance commands, see [Zeouf API and performance checks](docs/ecommerce-api-performance.md).

The [Zeouf case catalog](specs/ecommerce/requirements/CASE_CATALOG.md) maps the current BRD and QA-guide snapshot to first-pass test cases; [automation status](specs/ecommerce/requirements/AUTOMATION_STATUS.md) distinguishes linked partial checks from full acceptance. After reviewing an updated BRD or case overlay, run `npm run cases:zeouf:catalog` to regenerate the catalog. The planner, generator, and healer profiles in both `.github/agents/` and `.codex/agents/` use this snapshot and public read-only boundary. They do not automatically update tests when application code changes.

`npm run test:ecommerce:fixtures` runs controlled product-card, catalog, search, cart-storage and currency frontend checks using fictional GET responses or browser-local data. These tests block server writes and do not prove live authentication, email, inventory or transaction correctness. See the [fixture plan](specs/ecommerce/18-brd-controlled-catalog-search-cart.md) and [card/catalog/navigation plan](specs/ecommerce/19-brd-cards-catalog-navigation.md). `npm run test:ecommerce:navigation` checks keyboard dialogs, desktop/mobile menus, selected viewport boundaries and homepage destinations. The [current findings](docs/zeouf-automation-findings.md) record count-contract drift and desktop focus loss; these assertions remain failing pending a website fix or reviewed requirements update. The [roadmap](roadmap/FUTURE_ENHANCEMENTS.md) records future tester takeover, visual recording/editing, revision history and a local tool workflow; these are not implemented capabilities.

If PowerShell blocks the `npm` or `npx` scripts, use `npm.cmd` or `npx.cmd` instead.

---

## Reporting And Outputs

`npm run demo:ecommerce:repair` runs a [controlled Zeouf failure and locator-repair rehearsal](docs/ecommerce-repair-evaluation.md). It preserves raw locator, application and environment failures, verifies the same assertion after a constrained locator change, and archives a reviewable proposal and source/report hashes. The injected-fault spec is excluded from normal suites. The manual **Zeouf controlled repair rehearsal** CI workflow retains the evidence. This is a scripted evaluation foundation; autonomous repair and independent accuracy measurement remain future work.

Zeouf now has a [case execution monitoring pilot](docs/ecommerce-ci-monitoring.md): ten stable check IDs map to nine catalog cases. `npm run monitor:ecommerce -- <report.json> [more-reports.json]` creates JSON/Markdown evidence under `test-results/` and appends it to the CI job summary. Passing checks retain their limited scope; full acceptance stays unassessed. Missing checks, skips, flaky results and failures stay visible. Playwright emits JSON locally and in CI. This is a batch report foundation; historical trends and a visual monitoring workspace remain future work.

- The local HTML report is generated into `playwright-report/`; CI retains separate batch reports in its subfolders.
- Allure results are written to `allure-results/`. Run `npm run allure:generate` to build `allure-report/`, then `npm run allure:open` to view it. Use `npm run test:allure` for a fresh test run and report in one command.
- Failure artifacts are written to `test-results/`.
- Traces, screenshots, and videos are retained on failure so regressions are easier to diagnose.
- The GitHub Actions workflow uploads the Playwright report, Allure report and results, and the test-results folder as artifacts.
- CI adds separate stability summaries for the practice-site/API run and the Zeouf runs. Zeouf runs read-only smoke, controlled fixtures and navigation checks by default and the full suite on confirmed staging. Each summary includes retries, flaky tests, repeated failed attempts, and heuristic failure categories.

### Publish HTML report to GitHub Pages

- Optionally publish the `playwright-report/` folder to GitHub Pages for easy viewing. The repository includes a ready-to-run workflow `.github/workflows/deploy-report.yml` that:
  - runs the test suite,
  - generates the HTML report, and
  - publishes `playwright-report/` to the `gh-pages` branch.

- To trigger the deploy workflow manually from the Actions tab, use the `Run workflow` (workflow_dispatch) button. The published report will be available at `https://<owner>.github.io/<repo>/` after Pages is enabled for the `gh-pages` branch.

If you prefer to just download the report from CI, the main workflow already uploads `playwright-report` as an artifact you can download from the workflow run details.

---

## Design Decisions

### 1) Layered Test Flow

Page objects own locators and low-level interactions, while flows handle the scenario sequence. That keeps the spec readable and stops interaction logic from leaking everywhere.

### 2) Custom Fixtures

`fixtures/base.ts` provides the shared `test` and `expect` exports, plus ready-to-use page and flow fixtures. That keeps setup consistent without a heavy inheritance model.

### 3) Central Test Data

Shared inputs live in `fixtures/test-data.ts` so the same values can be reused across specs without copy-paste drift.

### 4) Agent-Assisted Test Repair

The healer agent investigates failing storefront tests and can propose or apply a code repair, then verify it. Locator design and page objects keep tests understandable and repairable. This is agent-assisted repair; tests do not rewrite locators or recover autonomously during runtime.

### 5) Agent-Friendly Entry Points

The seed spec and architecture document give automation agents a stable starting point for regeneration, repair, and future expansion.

### 6) Use The Playwright Agents With Codex

The `.github/agents/` profiles are for GitHub Copilot. Codex uses the Playwright-generated profiles in `.codex/agents/` and the `playwright-test` MCP server configured in `.codex/config.toml`. Open this repository as the workspace, trust the project configuration, then restart the Codex extension or start a new session so it loads the MCP server and agent profiles. In the Codex extension, check **MCP servers** for `playwright-test`; `codex mcp list` is the CLI equivalent.

The agents are scoped to the zeouf fashion storefront at `ECOMMERCE_BASE_URL` (default `https://zeouf-luxury-fashion-ecommerce.vercel.app`). Ask Codex to use a profile by name, for example: `Use playwright_test_planner with tests/ecommerce/seed.spec.ts and the ecommerce-chromium project to explore my fashion storefront and save three independent plans under specs/ecommerce/.` The planner requires its Playwright MCP tools to be available in the session. If they are absent, check the MCP server status before asking it to explore the browser. Expand Testing, TodoMVC, and API examples remain separate demonstrations of broader framework scenarios and are outside the storefront agents' scope.

In some Codex sessions, a child agent's browser MCP action may request an interaction that only the main thread can handle. If that happens, perform the browser inspection in the main thread with the same storefront seed and project, then give the observed evidence to the agent. State which browser steps the agent could not perform itself; do not describe a plan as independently explored when it used supplied observations.

Switching providers is manual. VS Code does not automatically change from Copilot to Codex when a subscription or allowance expires. Each provider must be signed in and have access to the model you select.

---

## Why This Framework Shape Works

- It stays small enough to understand quickly.
- It still separates intent, orchestration, and UI detail.
- It keeps future page coverage easy to add without flattening everything into one spec file.
- It supports AI-assisted maintenance without turning the project into a black box.

---

## Proof Of Work

- GitHub Actions workflow: [.github/workflows/playwright.yml](.github/workflows/playwright.yml)
- Architecture reference: [ARCHITECTURE.md](ARCHITECTURE.md)
- Static analysis rules: [docs/static-analysis.md](docs/static-analysis.md)
- Roadmap: [roadmap/FUTURE_ENHANCEMENTS.md](roadmap/FUTURE_ENHANCEMENTS.md)

---

## Current Coverage Snapshot

- **Homepage:** verifies the homepage loads and opens the inputs demo.
- **Inputs demo:** fills and displays all configured values, clears the form, and checks output for partially completed fields.
- **Registration UI:** submits registration data through the homepage link and checks that a failure flash message is shown.
- **TodoMVC UI:** adds two todos, completes one, deletes another, and verifies the remaining list.
- **Seed smoke test:** opens the inputs page and checks its heading as a small generator/healer starting point.
- **Ecommerce storefront:** covers the homepage, all seven top-level collections, all 15 women's and men's subcategory routes, product detail quantity, numeric price sorting, search empty state, mobile navigation, and terms page.
- **Ecommerce guest/account states:** covers account registration UI, sign-in gates for cart actions, empty cart and favorites, checkout requirements, signed-out order history, and invalid admin login.
- **API health and authentication:** checks health endpoints, rejects invalid login, and exercises registration followed by login.
- **Notes API:** exercises create, list, read, update, and delete, plus unauthenticated and invalid create/update payload responses.
- **API state cache:** verifies that shared state is reused within a cache scope.
- UI tests run in Chromium, Firefox, and WebKit. API tests run in the dedicated API project.
- Ecommerce tests run in the dedicated `ecommerce-chromium` project. Authenticated order placement and admin data changes need a dedicated test account/database and are not part of this read-only baseline.
- **Size-guide fixture gap:** the public catalog currently exposes no sized product in the loaded women, men, or shoes collections. The public product-detail test checks quantity and review form state; PDP-05 size-guide acceptance remains unverified until a controlled sized fixture is available.

---

## Roadmap

- Make the zeouf demo reproducible in CI with a dedicated test URL and predictable data.
- Strengthen shopper-facing assertions and add a controlled signed-in journey when test accounts and reset are available.
- Evaluate agent-assisted repairs against known test, app, and environment failures before claiming repair accuracy.
- Apply the workflow to a second app to measure portability and onboarding effort.

See [roadmap/FUTURE_ENHANCEMENTS.md](roadmap/FUTURE_ENHANCEMENTS.md) for these milestones and later ideas.

---

## CI

The repository includes a GitHub Actions workflow in [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) that runs on push and pull request events.

Current CI behavior:

- Installs dependencies with `npm ci`.
- Installs Playwright browsers with `npx playwright install --with-deps`.
- Runs the Expand Testing UI suite in Chromium, Firefox, and WebKit, plus the API project.
- Runs read-only ecommerce API and browser smoke checks against the deployed Zeouf site by default. When the repository variable `ECOMMERCE_BASE_URL` points to a dedicated test deployment, CI runs the full ecommerce suite instead. Add it under GitHub repository **Settings → Secrets and variables → Actions → Variables**.
- Uploads the HTML report and test artifacts after every run.

If you want to extend this repository later, the safest path is to keep the same layering and add new abstractions only when a real repeated problem appears.

---

## Contributing & Push Checklist

Follow this quick checklist before pushing changes to the repository to keep CI green and make reviews easy.

- **Create a branch:** `git checkout -b feat/<short-descriptor>`
- **Install & build locally:**

```powershell
npm ci
npx playwright install
```

- **Run the full suite:** `npm test` (use `npm run test:headed` to run in headed mode)
- **Open the HTML report locally (optional):** `npm run report` then open the generated report in `playwright-report/`
- **Verify artifacts:** confirm `test-results/` contains any new traces/screenshots/videos you expect on failures
- **Stage and commit:**

```powershell
git add -A
git commit -m "<type>: short description of change"
```

- **Push branch and open PR:**

```powershell
git push --set-upstream origin feat/<short-descriptor>
# optionally: gh pr create --fill
```

- **CI requirements:** ensure the GitHub Actions run shows a green check (tests passing) before merging.

### PR Checklist

- All tests pass locally and in CI.
- Updated or added documentation for new behavior.
- Descriptive commit and PR title.
- Small, focused changes per PR whenever possible.

If you'd like, I can create a `CONTRIBUTING.md` with these rules and a simple PR template.
