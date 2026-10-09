# TC-CNT-001-01 newsletter preview only

## Application Overview

Zeouf BRD CNT-01 P1, BRD v1.5 website commit 481a090. Public read-only home footer; fictional email; no persistent test data or cleanup. Project ecommerce-chromium.

## Test Scenarios

### 1. Newsletter preview

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-CNT-001-01 valid email shows preview without network write

**File:** `tests/ecommerce/newsletter-preview.spec.ts`

**Automation:** [newsletter-preview.spec.ts](../../tests/ecommerce/newsletter-preview.spec.ts). Run with `npx playwright test --project=ecommerce-chromium tests/ecommerce/newsletter-preview.spec.ts`. Passed on the public deployment on 2026-10-07. Invalid email validation remains unverified.

**Steps:**
  1. Install context-wide non-read request guard and open the home footer.
    - expect: The newsletter email input and Subscribe button are visible.
  2. Enter preview-only@example.test and click Subscribe.
    - expect: A visible notice says Newsletter preview only. Your email was not saved or sent.
  3. Inspect recorded non-read attempts.
    - expect: No non-read HTTP request was attempted.
