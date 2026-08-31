# Playwright TypeScript Architecture

This diagram explains the current framework in Selenium Java terms for someone used to a POM or hybrid framework.

## High-Level Architecture

```mermaid
flowchart LR
  classDef test fill:#e8f0ff,stroke:#4a6cf7,stroke-width:2px,color:#102a43;
  classDef framework fill:#f4f1ff,stroke:#7c4dff,stroke-width:2px,color:#2d1b69;
  classDef runtime fill:#e8fff5,stroke:#1f9d55,stroke-width:2px,color:#0f3d2e;
  classDef app fill:#fff3e8,stroke:#f08a24,stroke-width:2px,color:#5a2d00;
  classDef evidence fill:#fffbe6,stroke:#d9a400,stroke-width:2px,color:#5c4b00;

  subgraph T["Test Layer"]
    direction TB
    T1["demo-inputs.spec.ts\nMain scenario"]
    T2["seed.spec.ts\nSmoke / starting state"]
  end

  subgraph F["Framework Layer"]
    direction TB
    F1["fixtures/base.ts\nCustom test + expect + inputsPage"]
    F2["fixtures/test-data.ts\nShared test data"]
    F3["pages/inputs-page.ts\nPage Object Model"]
    F4["playwright.config.ts\nBrowser matrix, retries, artifacts"]
  end

  subgraph R["Playwright Runtime"]
    direction TB
    R1["@playwright/test\nRunner + assertions"]
    R2["Browser Context + Page\nIsolated per test"]
    R3["Trace / Screenshot / Video\nFailure evidence"]
  end

  subgraph A["Application Under Test"]
    direction TB
    A1["practice.expandtesting.com/inputs"]
  end

  T1 --> F1
  T2 --> F1
  F1 --> F3
  F1 --> F2
  F4 --> R1
  T1 --> R1
  T2 --> R1
  R1 --> R2
  F3 --> R2
  R2 --> A1
  R2 --> R3
  R3 --> F4

  class T1,T2 test;
  class F1,F2,F3,F4 framework;
  class R1,R2 runtime;
  class R3 evidence;
  class A1 app;
```

## Selenium Java Mapping

| Selenium Java concept | Playwright TypeScript equivalent in this repo |
|---|---|
| `WebDriver` instance | `page` fixture from `@playwright/test` |
| `WebDriverWait` / explicit waits | Playwright auto-waiting built into locators and actions |
| `Page Object` class | `pages/inputs-page.ts` |
| `BaseTest` / custom test setup | `fixtures/base.ts` |
| Test data class / config | `fixtures/test-data.ts` and `playwright.config.ts` |
| TestNG/JUnit runner | Playwright test runner |
| Screenshots / logs on failure | `trace`, `screenshot`, and `video` in config |
| Cross-browser execution | `projects` in `playwright.config.ts` |

## How The Flow Works

```mermaid
sequenceDiagram
  autonumber
  participant Spec as Spec file
  participant Fixture as Custom fixture
  participant POM as InputsPage
  participant Playwright as Playwright runtime
  participant App as Inputs page

  Spec->>Fixture: Request inputsPage fixture
  Fixture->>POM: new InputsPage(page)
  Spec->>POM: goto(), fill(), display(), clear()
  POM->>Playwright: use page locators and actions
  Playwright->>App: navigate / interact / assert
  App-->>Playwright: render updated UI state
  Playwright-->>Spec: verify output and cleared inputs
```

## Why This Is Different From Selenium Hybrid

In a Selenium hybrid framework, you usually see driver setup, wait utilities, page objects, test classes, and a separate data layer. This repo follows the same architectural idea, but Playwright collapses a lot of the boilerplate:

- No manual driver lifecycle in each test.
- No explicit wait utility for most UI actions.
- Locators are first-class and auto-wait by default.
- The fixture system replaces much of the classic base-class wiring.

## What We Adopted From The Production Architecture

The screenshots in the `production architecture/` folder show a heavier enterprise pattern with module boundaries, a flow layer, shared utilities, and module-owned page objects. This repo intentionally adopts only the parts that improve maintainability at its current size:

- A fixture-driven test object instead of inheritance.
- A thin `flows/` layer for scenario orchestration above the page object.
- Page objects that stay focused on locators and actions.
- Centralized test data instead of inline literals in specs.
- Config-driven runner behavior, retries, and failure artifacts.

What we are not copying yet:

- A large `src/` module tree.
- Module-per-product-line duplication.
- Shared base pages across unrelated areas.
- Extra utilities that do not earn their keep in a one-page demo suite.

The rule is simple: add structure only when the suite’s size makes it pay for itself.

## Current Repo Layout

- `tests/` contains the scenario specs.
- `fixtures/` contains the shared test wiring and test data.
- `pages/` contains page objects.
- `playwright.config.ts` controls browser matrix, retries, reporters, and artifacts.
- `playwright-report/` and `test-results/` are runtime outputs.

## Notes For A Selenium User

- Treat `page` like the Selenium browser session, but without the driver plumbing.
- Treat fixtures like a cleaner replacement for base classes and before/after setup.
- Treat locators like resilient element references, but with auto-waiting built in.
- Keep assertions in the spec file and page behavior in the page object, just like a good POM design.
- If the project grows, add more page objects, more fixtures, and more data files instead of putting everything into the spec.
