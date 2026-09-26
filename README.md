# Playwright AI Self-Healing Framework

A compact Playwright TypeScript framework for UI and API testing.
It is shaped like a small production test framework: page objects own locators, flows own scenario orchestration, fixtures own setup, and the documentation keeps the architecture easy to recover later.

[![Playwright Tests](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/workflows/playwright.yml)
[GitHub repo](https://github.com/varunsidr/playwright-ai-self-healing-framework)

## Quick Setup Notes

- The suite runs on Chromium, Firefox, and WebKit.
- `playwright-report/` holds the HTML report output.
- `test-results/` holds traces, screenshots, videos, and other failure artifacts.
- New specs should import `test` and `expect` from [fixtures/base.ts](fixtures/base.ts), not directly from `@playwright/test`.
- UI scenarios cover the Expand Testing homepage, inputs demo, registration page, and TodoMVC.
- Ecommerce feature tests live in a separate project and target the standalone zeouf storefront.
- API scenarios cover health checks, authentication, notes CRUD and validation, and API state-cache behavior.
- The `tests/seed.spec.ts` file is a lightweight starting point for generator and healer workflows.
- “Self-healing” here means disciplined locator design and agent-assisted repair; tests do not rewrite locators at runtime.

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
├── docs/                   # Static analysis and Playwright/API design notes
├── fixtures/               # UI/API fixtures and shared test data
├── flows/                  # Scenario-level UI orchestration
├── pages/                  # Page objects for practice site and TodoMVC
├── roadmap/                # Planned enhancements
├── scripts/                # Static analysis rules
├── specs/                  # Architecture references and starter guidance
├── tests/
│   ├── api/                # API health, auth, notes CRUD/contracts, cache
│   ├── demo-inputs.spec.ts
│   ├── home.spec.ts
│   ├── register.spec.ts
│   ├── seed.spec.ts
│   └── todo.spec.ts
├── utils/                  # Runtime config, notes client, API state cache
├── playwright.config.ts
└── package.json
```

The rule this structure enforces is simple: tests describe behavior, flows describe the scenario steps, and page objects own locators and page-level actions.

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

The ecommerce app and this test framework stay in separate repositories. In one terminal, change to the ecommerce repository and start its dev server:

```powershell
cd "<path-to-your-ecommerce-repository>"
npm run dev
```

If the app is configured locally, it is available at `http://localhost:3000`. In a second terminal, change to this framework's `pw-mcp-demo` directory and run the ecommerce-only browser project:

```powershell
cd "<path-to-this-framework>\pw-mcp-demo"
npm run test:ecommerce
```

The default `npm test` includes every project, including ecommerce, so keep the app running for that command. `npm run test:smoke` runs only the app-independent API and Chromium smoke checks; use `npm run test:ecommerce:smoke` for storefront smoke coverage.

Set `ECOMMERCE_BASE_URL` to target another local or deployed instance. Ecommerce tests use their own fixture and Playwright project; the existing Expand Testing and API projects retain their own targets and fixtures.

Run only the ecommerce categories:

```powershell
npm run test:ecommerce:smoke
npm run test:ecommerce:happy
npm run test:ecommerce:regression
```

If `npx` gives PowerShell execution-policy trouble on your machine, use `npx.cmd` instead.

---

## Reporting And Outputs

- The HTML report is generated into `playwright-report/`.
- Failure artifacts are written to `test-results/`.
- Traces, screenshots, and videos are retained on failure so regressions are easier to diagnose.
- The GitHub Actions workflow uploads both the report and the test-results folder as artifacts.
- CI adds a stability summary to the workflow run, including retries, flaky tests, repeated failed attempts, and heuristic failure categories.

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

### 4) Self-Healing By Design

The framework emphasizes resilient locators, small helpers, and a clear structure that is easy to repair. The goal is to make locator recovery simple enough that agent-assisted fixes stay predictable.

### 5) Agent-Friendly Entry Points

The seed spec and architecture document give automation agents a stable starting point for regeneration, repair, and future expansion.

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
- **Ecommerce storefront:** covers the homepage, all seven top-level collections, all 15 women's and men's subcategory routes, product detail quantity and size guide, price sorting, search empty state, mobile navigation, and terms page.
- **Ecommerce guest/account states:** covers account registration UI, sign-in gates for cart actions, empty cart and favorites, checkout requirements, signed-out order history, and invalid admin login.
- **API health and authentication:** checks health endpoints, rejects invalid login, and exercises registration followed by login.
- **Notes API:** exercises create, list, read, update, and delete, plus unauthenticated and invalid create/update payload responses.
- **API state cache:** verifies that shared state is reused within a cache scope.
- UI tests run in Chromium, Firefox, and WebKit. API tests run in the dedicated API project.
- Ecommerce tests run in the dedicated `ecommerce-chromium` project. Authenticated order placement and admin data changes need a dedicated test account/database and are not part of this read-only baseline.

---

## Roadmap

- Expand the `flows/` layer only when scenario orchestration becomes repetitive.
- Add more page objects as the app grows beyond the inputs page.
- Expand negative and boundary-value UI coverage; current validation coverage is primarily in the notes API contract tests.
- Keep self-healing practical: favor clear locators and repairable abstractions over opaque automation.

---

## CI

The repository includes a GitHub Actions workflow in [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) that runs on push and pull request events.

Current CI behavior:

- Installs dependencies with `npm ci`.
- Installs Playwright browsers with `npx playwright install --with-deps`.
- Runs the Expand Testing UI suite in Chromium, Firefox, and WebKit, plus the API project.
- Runs ecommerce tests only when the repository variable `ECOMMERCE_BASE_URL` points to a dedicated test deployment. Add it under GitHub repository **Settings → Secrets and variables → Actions → Variables**; CI does not assume the separate app is running on localhost.
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
