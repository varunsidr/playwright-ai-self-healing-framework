# Repository Architecture

This file is the durable, root-level architecture reference for the current Playwright TypeScript framework. Use it as the first stop when you return to this codebase in a new chat session.

## Purpose

This repo is a compact Playwright test framework for the Expand Testing inputs page. It is intentionally small, but it now follows a layered structure that is close to a modern Selenium Java hybrid framework without copying unnecessary boilerplate.

The design goal is industry-standard alignment, not framework bloat.

## Mental Model For A Selenium Java User

Think of the current stack like this:

- `page` is the Playwright equivalent of the browser/session object you would drive with `WebDriver`.
- `fixtures/base.ts` is the replacement for a classic base test class or shared setup parent.
- `pages/inputs-page.ts` is the Page Object Model layer.
- `flows/inputs-flow.ts` is the scenario orchestration layer that sits above the page object.
- `fixtures/test-data.ts` is the shared data layer.
- `playwright.config.ts` is the runner/config layer that defines browser projects, retries, reporting, artifacts, and base URL.

Playwright removes most of the Selenium-style driver plumbing, explicit wait helpers, and inheritance-heavy setup.

## Current File Map

### Test Layer

- [tests/home.spec.ts](tests/home.spec.ts) is the homepage entry scenario that opens the inputs demo.
- [tests/demo-inputs.spec.ts](tests/demo-inputs.spec.ts) is the canonical real scenario.
- [tests/seed.spec.ts](tests/seed.spec.ts) is a minimal navigation seed used for tooling and quick smoke coverage.

### Framework Layer

- [fixtures/base.ts](fixtures/base.ts) defines the custom `test` and `expect` exports.
- [fixtures/test-data.ts](fixtures/test-data.ts) stores shared test data objects.
- [pages/home-page.ts](pages/home-page.ts) contains the page object for the homepage.
- [pages/inputs-page.ts](pages/inputs-page.ts) contains the page object for the inputs page.
- [flows/home-flow.ts](flows/home-flow.ts) contains scenario-level orchestration for the homepage.
- [flows/inputs-flow.ts](flows/inputs-flow.ts) contains scenario-level orchestration above the page object.

### Runtime / Config Layer

- [playwright.config.ts](playwright.config.ts) controls test discovery, parallelism, retries, reporters, output artifacts, base URL, and browser projects.
- [playwright-report/](playwright-report/) contains HTML report output.
- [test-results/](test-results/) contains runtime artifacts such as traces, screenshots, videos, and JUnit output.

## Current Execution Flow

The practical flow in this repo is:

1. The spec imports `test` and `expect` from `fixtures/base.ts`.
2. The fixture creates `homePage`, `homeFlow`, `inputsPage`, and `inputsFlow`.
3. The flow object uses the page object for scenario orchestration.
4. The page object owns locators and low-level page actions.
5. Assertions happen in the spec and in page-object helper assertions.
6. Playwright records artifacts on failure using the config settings.

That means this repo uses a clean separation of responsibilities:

- Spec = scenario intent
- Flow = business-step orchestration
- Page object = UI interaction details
- Fixture = dependency injection and setup
- Config = runtime behavior

## Important Conventions

- New specs should import `test` and `expect` from [fixtures/base.ts](fixtures/base.ts), not directly from `@playwright/test`.
- Page locators belong in page objects, not in specs.
- Multi-step scenario orchestration belongs in flows, not in specs.
- Shared test values belong in `fixtures/test-data.ts`.
- Specs should stay readable and focus on behavior, not implementation details.
- Keep the framework lean; add structure only when it pays for itself.

## Playwright Configuration Snapshot

Current config posture in [playwright.config.ts](playwright.config.ts):

- `testDir` is scoped to `./tests`.
- `testMatch` includes `*.spec.ts` and `*.test.ts` files.
- `fullyParallel` is enabled.
- `forbidOnly` is enabled on CI.
- Retries are enabled on CI only.
- CI workers are limited to 1.
- Reporters include HTML locally and HTML plus JUnit on CI.
- Failure evidence is retained via trace, screenshot, and video.
- `baseURL` points to `https://practice.expandtesting.com`.
- `expect.timeout` is set explicitly to 5000 ms.
- Browser projects run Chromium, Firefox, and WebKit.

## What The Production Architecture Screenshots Influenced

The screenshots in the `production architecture/` folder were treated as a reference, not a blueprint. The useful ideas that were adopted are:

- A flow layer above the page object.
- Clear separation between scenario orchestration and low-level UI interaction.
- A stronger mental distinction between test layer, framework layer, runtime layer, and the AUT.
- More explicit mapping between test data, page objects, and runner config.

The things not copied blindly are:

- A large `src/` tree.
- Heavy module-per-feature duplication.
- Extra shared base abstractions that do not yet earn their maintenance cost.
- Enterprise-style layering that would make a tiny suite harder to navigate.

## How To Study This Repo Quickly In A New Chat

If you need to re-learn the codebase fast, read files in this order:

1. [ARCHITECTURE.md](ARCHITECTURE.md)
2. [playwright.config.ts](playwright.config.ts)
3. [fixtures/base.ts](fixtures/base.ts)
4. [flows/inputs-flow.ts](flows/inputs-flow.ts)
5. [pages/inputs-page.ts](pages/inputs-page.ts)
6. [fixtures/test-data.ts](fixtures/test-data.ts)
7. [tests/demo-inputs.spec.ts](tests/demo-inputs.spec.ts)
8. [tests/seed.spec.ts](tests/seed.spec.ts)

That sequence gives you the architecture first, then the config, then the framework layers, then the actual scenarios.

## Known Boundaries

- This is still a small demo-sized framework, not a large enterprise test platform.
- The current flow layer is intentionally thin.
- Self-healing is not a runtime engine here; it is currently more of a support concept around locator discipline and agent-assisted repair.
- The repo is optimized for clarity and maintainability before scale.

## Update Rule

If you change the framework shape, update this file first or alongside the change. This file should stay current enough that a future chat can use it as the shortest path back into the codebase.

## Related Roadmap

See [roadmap/FUTURE_ENHANCEMENTS.md](roadmap/FUTURE_ENHANCEMENTS.md) for planned improvements, likely next steps, and the rule for deciding whether a new abstraction is worth adding.
