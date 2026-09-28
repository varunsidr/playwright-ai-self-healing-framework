# Repository Architecture

This file is the durable, root-level architecture reference for the current Playwright TypeScript framework. Use it as the first stop when you return to this codebase in a new chat session.

## Purpose

This repository demonstrates a reusable Playwright test framework across multiple applications. The zeouf fashion storefront is the primary demonstration for the agent-assisted planning, test generation, and repair workflow. The Expand Testing site and other examples demonstrate additional UI and API scenarios that the storefront does not provide. The framework remains intentionally small, using a layered structure without unnecessary boilerplate.

The design goal is industry-standard alignment, not framework bloat.

## Mental Model For A Selenium Java User

Think of the current stack like this:

- `page` is the Playwright equivalent of the browser/session object you would drive with `WebDriver`.
- `fixtures/ecommerce-base.ts` provides the zeouf storefront fixture; `fixtures/base.ts` provides the practice-site fixtures.
- `pages/ecommerce-storefront-page.ts` is the Page Object Model layer for the primary demo.
- `pages/practice-site-pages.ts` and `flows/practice-site-flows.ts` demonstrate the same separation for the practice site.
- `fixtures/test-data.ts` is the shared data layer.
- `playwright.config.ts` is the runner/config layer that defines browser projects, retries, reporting, artifacts, and base URL.

Playwright removes most of the Selenium-style driver plumbing, explicit wait helpers, and inheritance-heavy setup.

## Current File Map

### Test Layer

- [tests/ecommerce/](tests/ecommerce/) is the primary product-demo suite for the zeouf fashion storefront and the scope of the planner, generator, and healer agents.
- [specs/ecommerce/](specs/ecommerce/) contains storefront plans used by those agents.
- [tests/ecommerce/seed.spec.ts](tests/ecommerce/seed.spec.ts) is the stable browser entry point for storefront agents.
- [tests/](tests/) also contains broader examples for the Expand Testing practice site, TodoMVC, and API scenarios. These demonstrate framework coverage beyond the storefront and are not inputs to the storefront agents.

- [tests/home.spec.ts](tests/home.spec.ts) is the homepage entry scenario that opens the inputs demo.
- [tests/demo-inputs.spec.ts](tests/demo-inputs.spec.ts) demonstrates input and reset scenarios outside the storefront.
- [tests/seed.spec.ts](tests/seed.spec.ts) is a minimal navigation seed used for tooling and quick smoke coverage.
- [tests/api/](tests/api/) contains API-only contract and CRUD scenarios.
- [tests/todo.spec.ts](tests/todo.spec.ts) exercises the separate TodoMVC page object.

### Framework Layer

- [fixtures/base.ts](fixtures/base.ts) defines the custom `test` and `expect` exports.
- [fixtures/test-data.ts](fixtures/test-data.ts) stores shared test data objects.
- [pages/practice-site-pages.ts](pages/practice-site-pages.ts) contains the small practice-site page objects.
- [pages/todo-page.ts](pages/todo-page.ts) encapsulates the external TodoMVC page.
- [flows/practice-site-flows.ts](flows/practice-site-flows.ts) contains scenario-level practice-site orchestration.
- [fixtures/api-fixtures.ts](fixtures/api-fixtures.ts) provides lazy API clients, configuration, and seed helpers.
- [fixtures/ecommerce-base.ts](fixtures/ecommerce-base.ts) provides isolated storefront fixtures without changing the existing practice-site fixture.
- [pages/ecommerce-storefront-page.ts](pages/ecommerce-storefront-page.ts) owns storefront locators and actions.

### Runtime / Config Layer

- [playwright.config.ts](playwright.config.ts) controls test discovery, parallelism, retries, reporters, output artifacts, base URL, and browser projects.
- [playwright-report/](playwright-report/) contains HTML report output.
- [test-results/](test-results/) contains runtime artifacts such as traces, screenshots, videos, and JUnit output.

## Current Execution Flow

The primary zeouf workflow is:

1. A storefront spec imports `test` and `expect` from `fixtures/ecommerce-base.ts`.
2. The fixture provides an `EcommerceStorefrontPage` for the isolated Playwright page.
3. The page object owns storefront locators and actions; the spec expresses behavior and assertions.
4. Playwright records failure evidence according to the shared configuration.
5. The planner uses `tests/ecommerce/seed.spec.ts` to explore Zeouf and writes plans under `specs/ecommerce/`. The generator creates tests under `tests/ecommerce/`. The healer diagnoses failures in the `ecommerce-chromium` project and verifies code repairs.

The separate practice-site example also uses a flow object above its page objects for multi-step scenarios.

That means this repo uses a clean separation of responsibilities:

- Spec = scenario intent
- Flow = business-step orchestration
- Page object = UI interaction details
- Fixture = dependency injection and setup
- Config = runtime behavior

## Important Conventions

- New specs should import `test` and `expect` from the fixture for their project: [fixtures/ecommerce-base.ts](fixtures/ecommerce-base.ts) for Zeouf, [fixtures/api-fixtures.ts](fixtures/api-fixtures.ts) for API tests, or [fixtures/base.ts](fixtures/base.ts) for practice-site examples.
- Page locators belong in page objects, not in specs.
- Use a flow when multi-step scenario orchestration is reused; the storefront currently uses its page object directly.
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
- Reporters include HTML and Allure locally, plus JUnit and JSON on CI.
- Failure evidence is retained via trace, screenshot, and video.
- `baseURL` points to `https://practice.expandtesting.com`.
- `expect.timeout` is set explicitly to 5000 ms.
- Browser projects run Chromium, Firefox, and WebKit.
- The API project runs only `tests/api/**`; browser projects exclude that directory.
- The `ecommerce-chromium` project runs only `tests/ecommerce/**` against `ECOMMERCE_BASE_URL` (default `http://localhost:3000`).
- Ecommerce specs are organized by feature and tagged `@smoke`, `@happy`, `@negative`, and `@regression` for purpose-based runs.
- Ecommerce scenarios use a dedicated fixture and cover public pages and guest restrictions without creating accounts, orders, or admin data.
- `BASE_URL`, `API_BASE_URL`, and `HTTP_BASE_URL` can override local defaults.

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
3. [fixtures/ecommerce-base.ts](fixtures/ecommerce-base.ts)
4. [pages/ecommerce-storefront-page.ts](pages/ecommerce-storefront-page.ts)
5. [tests/ecommerce/seed.spec.ts](tests/ecommerce/seed.spec.ts)
6. [tests/ecommerce/catalog.spec.ts](tests/ecommerce/catalog.spec.ts)
7. [specs/ecommerce/01-storefront-discovery.md](specs/ecommerce/01-storefront-discovery.md)

Read the practice-site fixtures, flows, and specs afterward to see additional scenario patterns.

## Known Boundaries

- This is still a small demo-sized framework, not a large enterprise test platform.
- The current flow layer is intentionally thin.
- Healing is agent-assisted: the healer investigates a failing storefront test and can propose or apply a code repair, then verify it. Tests do not autonomously rewrite locators or recover during runtime.
- The repo is optimized for clarity and maintainability before scale.

## Update Rule

If you change the framework shape, update this file first or alongside the change. This file should stay current enough that a future chat can use it as the shortest path back into the codebase.

## Related Roadmap

See [roadmap/FUTURE_ENHANCEMENTS.md](roadmap/FUTURE_ENHANCEMENTS.md) for planned improvements, likely next steps, and the rule for deciding whether a new abstraction is worth adding.
