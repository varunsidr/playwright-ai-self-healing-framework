# Zeouf tester guide

Read a spec first to understand the expected behavior, then follow its fixture import and `storefront` methods. The fixture controls setup and service responses; the page object controls UI interactions. The test keeps the scenario's expected results visible.

## What is already reusable?

| Responsibility                          | Existing location                                                                   | Examples to reuse                                                                                   |
| --------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Common setup and evidence               | [ecommerce-base.ts](../fixtures/ecommerce-base.ts)                                  | `test`, `expect`, `storefront`, automatic write guard, case annotations, navigation diagnostics     |
| UI locators and actions                 | [ecommerce-storefront-page.ts](../pages/ecommerce-storefront-page.ts)               | `openWomenCollection()`, `searchFor()`, `openCart()`, `fillFictionalShippingAddress()`              |
| Catalog data and controlled reads       | [ecommerce-catalog.ts](../fixtures/ecommerce-catalog.ts)                            | `catalogProducts()`, `catalog.products`, response modes and `catalog.release()`                     |
| Browser cart and currency setup         | [ecommerce-browser-cart.ts](../fixtures/ecommerce-browser-cart.ts)                  | `seedBrowserCart()`, `seedRawBrowserCart()`, `failBrowserCartStorage()`, `useInrStorefrontRegion()` |
| Isolated customer scenarios             | [ecommerce-isolated.ts](../fixtures/ecommerce-isolated.ts)                          | `shop`, `savedBrowserCart()`, `deferBrowserResponse()`, customer identities                         |
| Isolated admin scenarios                | [ecommerce-isolated-admin.ts](../fixtures/ecommerce-isolated-admin.ts)              | `admin`, `adminProducts()`, `stockBoundaryProducts()`, `adminWrites()`                              |
| Staging configuration check             | [ecommerce-staging.ts](../utils/ecommerce-staging.ts)                               | `isConfirmedEcommerceStaging()`; checks configuration, not actual backend isolation                 |
| Navigation investigation                | [ecommerce-navigation-diagnostics.ts](../utils/ecommerce-navigation-diagnostics.ts) | `captureEcommerceNavigation()`; observes requests without changing timing                           |
| Node process and local server utilities | [runtime.js](../scripts/ecommerce-repair/runtime.js)                                | `command()`, `run()`, `makeWorkspace()`, `cleanEnvironment()`, install/build/start helpers          |
| Shared report interpretation            | [build-ecommerce-monitoring.js](../scripts/build-ecommerce-monitoring.js)           | `collectChecks()`, `checkOutcome()`; used by isolated and native runners                            |

TypeScript browser helpers live in `fixtures/`, `pages/`, and `utils/`. The Node command-line runners also share CommonJS helpers under `scripts/`; a helper does not need to live in a folder named `utils` to be reusable.

## Choosing a fixture

- Public browser scenarios import `test` and `expect` from `fixtures/ecommerce-base`.
- Controlled catalog scenarios import `test` from `fixtures/ecommerce-catalog` and `expect` from `fixtures/ecommerce-base`.
- Local customer scenarios import `test` from `fixtures/ecommerce-isolated`; local admin scenarios import it from `fixtures/ecommerce-isolated-admin`. These extend the common base and require the isolated runner.

For the local fixtures, explicitly request `shop` or `admin` in the test callback or a `beforeEach`. Those fixtures install their routes and session before navigation; importing their `test` alone does not request them. `signedIn` and `adminSession` are fixture options for choosing a scenario's initial state.

The current `ecommerce-chromium` inventory has 154 public-safe checks and 135 isolated checks, mapped to 88 of 108 cases. Native website tests have a separate registry. Twenty cases remain without browser mappings; 17 cases still require staging or product decisions for full acceptance, including unfinished portions of mapped cases. See [plan 26](../specs/ecommerce/26-remaining-browser-and-service-boundaries.md) for the latest results and pagination-fix verification.

The [service-boundary spec](../tests/ecommerce/isolated/service-boundaries.spec.ts) requests `shop` to enforce the loopback configuration, then uses `request` to reach real local production handlers. APIRequestContext bypasses browser route mocks and the browser write guard. These checks therefore belong only in the credential-free isolated runner: invalid unsubscribe inputs and missing limiter/service configuration establish their specific denial branches, not real deletion, distributed rate limiting or database acceptance.

Playwright fixture code before `await use(value)` sets up the test. Code after it, usually in `finally`, runs teardown, attaches evidence, and checks unexpected calls. An `{ auto: true }` fixture runs without the spec requesting it by name. Registered route handlers run when the browser makes the matching request.

## Follow one existing scenario

Open [checkout.spec.ts](../tests/ecommerce/isolated/checkout.spec.ts) and its forged-price case:

1. Playwright sets up the requested `shop` fixture before the test body, installing the fake session and controlled service responses.
2. In the test body, `seedBrowserCart()` installs fictional browser data before navigation.
3. `storefront.openRoute()` and `fillFictionalShippingAddress()` drive the actual UI.
4. The spec checks the displayed result and the checkout request captured in `shop.calls`.
5. Fixture teardown attaches `isolated-browser-contracts` and fails on unhandled writes.

This proves the browser's request and response handling. A fulfilled fake checkout response cannot prove server price recomputation, stock changes, or a persisted order.

## What the native runner does

[run-ecommerce-native.js](../scripts/run-ecommerce-native.js) runs the website repository's own tests. These use that checkout's configs, separately from this framework's `ecommerce-chromium` suite.

1. Require the clean pinned Zeouf revision and a new evidence directory.
2. Clone into a short temporary path, reject environment files, hash tracked inputs, and install dependencies with a filtered environment.
3. Check documentation, sync it, then check again. Run documentation and in-memory SQL tests; parse their Node TAP totals.
4. Install native Chromium. Discover and run UI, catalog, and public read-only suites sequentially, each with one worker and zero retries.
5. Match each browser run to discovery, verify unchanged tracked source, map evidence to case groups, and write `result.json` with stage logs and reports.

The runner reuses `runtime.command()` for synchronous commands and `runtime.run()` for logged processes. Its `execute()` wrapper records every stage consistently. `tapStats()` and `browserStats()` reject incomplete evidence. Failures inside the execution block still write `result.json`; argument and initial validation failures print an error before evidence creation.

## Running and investigating

These commands use fresh evidence paths; replace the sample paths with your own. Neither native nor isolated execution replaces staging integration tests.

```powershell
# Review the framework without running the storefront browser suite.
npm run check

# Run the actual local frontend with controlled services.
npm run test:ecommerce:isolated -- 'C:/checkouts/zeouf' 'test-results/tester-isolated-01'

# Run the pinned website repository's native suites.
npm run test:ecommerce:native -- 'C:/checkouts/zeouf-pinned' 'test-results/tester-native-01'

# Public allowlist: preserve earlier reports in a new directory for each run.
$env:PW_OUTPUT_DIR = 'test-results/tester-public-01/artifacts'
$env:PW_JSON_REPORT_PATH = 'test-results/tester-public-01/results.json'
$env:PW_JUNIT_REPORT_PATH = 'test-results/tester-public-01/junit.xml'
$env:PW_HTML_REPORT_DIR = 'test-results/tester-public-01/html'
$env:PW_ALLURE_RESULTS_DIR = 'test-results/tester-public-01/allure'
npm run test:ecommerce:read-only -- --workers=1 --retries=0
```

For runner failures, start with `result.json` and the named stage log, then inspect the raw report and browser artifacts. For public navigation failures, inspect the `navigation-diagnostics` attachment. The [monitoring guide](ecommerce-ci-monitoring.md) explains aggregate coverage and evidence scope.

## Adding or maintaining a test

- Search for an existing page method, fixture factory, or utility before copying setup or selectors. Keep new UI selectors in the storefront page object.
- Use comments to explain why a boundary value, fixture dependency, routing order, or workaround matters. Self-explanatory fills and clicks need no narration.
- Keep requirement-specific assertions in the scenario or a clearly named page assertion. Avoid hiding expected outcomes inside a generic utility.
- Share a multi-step flow when multiple scenarios need the same sequence. The existing `flows/practice-site-flows.ts` serves historical practice-site examples; Zeouf currently uses page methods directly.
- When adding or renaming a case, follow the [requirement mapping instructions](../specs/ecommerce/requirements/README.md) and run `npm run check`.
- Use browser-clock advances for timer behavior, and emulated `hasTouch`/`isMobile` contexts for touch actions. Record those limits; emulation is not physical-device or actual hidden-tab evidence. Keep the existing assertions during a developer-fix recheck and preserve its earlier failing report.

## Remaining maintainability work

The reviewed paths already share their main setup and operations, but this is not a claim that every duplicate has been removed. Dialog focusability filtering is repeated in `focusDialogEdge()` and `expectDialogEdgeFocused()`. The storefront page object and isolated service fixture also cover many features in single files. Extract shared focus logic or feature modules when those areas next change, preserving browser execution context, route ordering, and existing assertions.
