# TC-SEA-01-CORE header search handling

## Application Overview

Zeouf BRD SEA-01 P1, BRD v1.5 website commit 481a090. Public read-only deployed site, ecommerce-chromium, fresh guest browser, no test data or cleanup.

## Test Scenarios

### 1. Header search

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-SEA-01-CORE focuses search, ignores blank and encodes nonblank query

**File:** `tests/ecommerce/search-input.spec.ts`

**Automation:** [search-input.spec.ts](../../tests/ecommerce/search-input.spec.ts). Run with `npx playwright test --project=ecommerce-chromium tests/ecommerce/search-input.spec.ts`. Passed on the public deployment on 2026-10-07.

**Steps:**
  1. Install context-wide non-read guard, open home and activate Search.
    - expect: Search input is focused and empty.
  2. Press Enter with blank input.
    - expect: URL remains the home route.
  3. Enter two leading/trailing spaces around silk & café and press Enter.
    - expect: Browser navigates to /search?q=silk%20%26%20caf%C3%A9, with trim and encoding preserved; search input is hidden.
  4. Check write attempt list.
    - expect: No non-read HTTP request was attempted.
