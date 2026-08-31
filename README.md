# Playwright AI Self-Healing Framework

A compact Playwright TypeScript framework for the Expand Testing inputs page.
It is shaped like a small production test framework: page objects own locators, flows own scenario orchestration, fixtures own setup, and the documentation keeps the architecture easy to recover later.

[![Playwright Tests](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/workflows/playwright.yml)
[GitHub repo](https://github.com/varunsidr/playwright-ai-self-healing-framework)

## Quick Setup Notes

- The suite runs on Chromium, Firefox, and WebKit.
- `playwright-report/` holds the HTML report output.
- `test-results/` holds traces, screenshots, videos, and other failure artifacts.
- New specs should import `test` and `expect` from [fixtures/base.ts](fixtures/base.ts), not directly from `@playwright/test`.
- The `tests/seed.spec.ts` file is a lightweight starting point for generator and healer workflows.
- AI-assisted repair here means disciplined locator design, reusable flows, and agent-friendly structure, not hidden magic.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Language | TypeScript | Strong typing and readable test code |
| Automation | Playwright | Fast, stable browser automation with built-in artifacts |
| Test Runner | Playwright Test | Parallel execution, retries, projects, and native reporting |
| Build | npm | Simple dependency and script management |
| Reporting | Playwright HTML report | Built-in visual report for failures and traces |
| CI | GitHub Actions | Runs the suite on push and pull request events |
| Structure | Page Object Model + flows + fixtures | Keeps test intent separate from UI details |

---

## Project Structure

```text
pw-mcp-demo/
├── ARCHITECTURE.md
├── README.md
├── fixtures/
│   ├── base.ts
│   └── test-data.ts
├── flows/
│   └── inputs-flow.ts
├── pages/
│   └── inputs-page.ts
├── tests/
│   ├── demo-inputs.spec.ts
│   └── seed.spec.ts
├── roadmap/
│   └── FUTURE_ENHANCEMENTS.md
└── playwright.config.ts
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

If `npx` gives PowerShell execution-policy trouble on your machine, use `npx.cmd` instead.

---

## Reporting And Outputs

- The HTML report is generated into `playwright-report/`.
- Failure artifacts are written to `test-results/`.
- Traces, screenshots, and videos are retained on failure so regressions are easier to diagnose.
- The GitHub Actions workflow uploads both the report and the test-results folder as artifacts.

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
- Roadmap: [roadmap/FUTURE_ENHANCEMENTS.md](roadmap/FUTURE_ENHANCEMENTS.md)

---

## Current Coverage Snapshot

- Inputs page happy-path test with fill, display, and clear validation.
- Minimal seed navigation test for tooling and repair workflows.
- Browser coverage across Chromium, Firefox, and WebKit.

---

## Roadmap

- Expand the `flows/` layer only when scenario orchestration becomes repetitive.
- Add more page objects as the app grows beyond the inputs page.
- Add negative and boundary-value coverage once the first happy-path baseline is stable.
- Keep self-healing practical: favor clear locators and repairable abstractions over opaque automation.

---

## CI

The repository includes a GitHub Actions workflow in [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml) that runs on push and pull request events.

Current CI behavior:

- Installs dependencies with `npm ci`.
- Installs Playwright browsers with `npx playwright install --with-deps`.
- Runs the full Playwright suite.
- Uploads the HTML report and test artifacts after every run.

If you want to extend this repository later, the safest path is to keep the same layering and add new abstractions only when a real repeated problem appears.