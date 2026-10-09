# TC-NAV-07-CORE route fallbacks and admin shell

## Application Overview

BRD NAV-07 P1 first-pass case using Zeouf BRD v1.5 website commit 481a090. Public read-only deployed URL, ecommerce-chromium, fresh guest context, no data or cleanup.

## Test Scenarios

### 1. Unknown routes and admin shell

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-NAV-07-CORE unknown routes show not-found and admin omits storefront chrome

**File:** `tests/ecommerce/not-found-admin-shell.spec.ts`

**Automation:** [not-found-admin-shell.spec.ts](../../tests/ecommerce/not-found-admin-shell.spec.ts). Run with `npx playwright test --project=ecommerce-chromium tests/ecommerce/not-found-admin-shell.spec.ts`. Passed on the public deployment on 2026-10-07. Route refresh remains unverified.

**Steps:**
  1. Install public write guard and navigate to /women/not-a-real-product-2026.
    - expect: The not-found page shows 404 and This page could not be found.
  2. Navigate to /women/no-such-category-2026.
    - expect: The same not-found page is shown.
  3. Navigate to /admin without submitting credentials.
    - expect: Admin sign-in heading appears and storefront navigation, search and cart controls are absent.
  4. Check write attempts.
    - expect: No non-read HTTP request was attempted.
