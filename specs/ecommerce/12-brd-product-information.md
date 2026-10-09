# TC-PDP-06-CORE information accordions

## Application Overview

Zeouf BRD PDP-06 P2, BRD v1.5 website commit 481a090. Public read-only available product, ecommerce-chromium, fresh guest context. No writes or cleanup.

## Test Scenarios

### 1. Product information accordions

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-PDP-06-CORE opens one information panel at a time

**File:** `tests/ecommerce/product-information.spec.ts`

**Automation:** [product-information.spec.ts](../../tests/ecommerce/product-information.spec.ts). Run with `npx playwright test --project=ecommerce-chromium tests/ecommerce/product-information.spec.ts`. Passed on the public deployment on 2026-10-07. Supplied and fallback content variants still need controlled fixtures.

**Steps:**
  1. Install non-read guard, open an available unsized product in Women collection.
    - expect: Product detail loads and Details, Measurements, Composition/Care/Origin, and Shipping/Returns panels are present.
  2. Open Product Details.
    - expect: Details text is shown and other panels remain collapsed.
  3. Open Measurements, then Composition/Care/Origin, then Shipping/Returns.
    - expect: Each selected panel shows nonempty information, and the previously selected panel collapses.
  4. Check write attempts.
    - expect: No non-read HTTP request was attempted.
