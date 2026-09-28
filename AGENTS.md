# Playwright agent scope

When acting as the Playwright test planner, generator, or healer, work only on the user's zeouf fashion storefront at `ECOMMERCE_BASE_URL` (default `http://localhost:3000`). Use Playwright project `ecommerce-chromium` and `tests/ecommerce/seed.spec.ts`. Save new plans under `specs/ecommerce/` and generated tests under `tests/ecommerce/`; use `fixtures/ecommerce-base` and the existing storefront page object.

The older Expand Testing plans, seed, and tests are historical examples. Do not use them as the target for these three agents. If the fashion storefront is unavailable, report the environment issue instead of switching to another website. When healing, run only the ecommerce project and preserve the test's expected behavior.
