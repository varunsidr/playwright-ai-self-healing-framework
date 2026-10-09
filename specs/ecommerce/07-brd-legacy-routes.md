# TC-NAV-006-01 legacy category redirects

## Application Overview

Zeouf public read-only navigation check for BRD NAV-06 (P1), using BRD v1.5 and QA guide snapshot at website commit 481a090. Fresh unauthenticated browser; no test data or cleanup. Target https://zeouf-luxury-fashion-ecommerce.vercel.app, project ecommerce-chromium.

## Test Scenarios

### 1. Canonical English category routes

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-NAV-006-01 redirects representative legacy category URLs

**File:** `tests/ecommerce/legacy-category-redirects.spec.ts`

**Automation:** [legacy-category-redirects.spec.ts](../../tests/ecommerce/legacy-category-redirects.spec.ts). Run with `npx playwright test --project=ecommerce-chromium tests/ecommerce/legacy-category-redirects.spec.ts`. Passed on the public deployment on 2026-10-07. This checks three representative mappings; the remaining legacy paths are still unverified.

**Steps:**
  1. Install a context-wide guard that aborts non-read HTTP requests and records any attempted write.
    - expect: No state-changing request is attempted.
  2. Navigate to /kadin/elbise in a fresh browser context.
    - expect: Browser reaches /women/dress and the Dress listing heading is visible.
  3. Navigate to /erkek/takim.
    - expect: Browser reaches /men/suits and the Suit listing heading is visible.
  4. Navigate to /parfum.
    - expect: Browser reaches /perfume and the Perfume listing heading is visible.
  5. Check the recorded write attempts.
    - expect: The list is empty.
