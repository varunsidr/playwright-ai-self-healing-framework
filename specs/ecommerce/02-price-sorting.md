# zeouf Catalog Price Sorting

## Generated Playwright Test

- **Script:** [tests/ecommerce/price-sorting.spec.ts](../../tests/ecommerce/price-sorting.spec.ts)
- **Project:** `ecommerce-chromium`
- **Run from the repository root:**

```powershell
npx.cmd playwright test tests/ecommerce/price-sorting.spec.ts --project=ecommerce-chromium
```

Start the zeouf storefront at `ECOMMERCE_BASE_URL` (default `http://localhost:3000`) before running the script. Open the linked `.spec.ts` file to review or edit the executable code.

## Application Overview

The zeouf fashion storefront at ECOMMERCE_BASE_URL (currently http://localhost:3000) exposes a Dress catalog at /kadin/elbise. Planning used Playwright project ecommerce-chromium and seed tests/ecommerce/seed.spec.ts. Live root-thread browser inspection found nine product cards and a Price: Low to High select option. Each card exposes its displayed price through data-testid=product-card-price. A fresh, signed-out browser state is sufficient; the scenario has no account, cart, or payment side effects. The observed sorted prices were ₹12,300, ₹19,800, ₹21,900, ₹21,900, ₹24,500, ₹24,500, ₹26,800, ₹28,700, ₹31,800. The test must compare numeric prices in displayed card order rather than hard-code that inventory.

## Test Scenarios

### 1. Dress catalog display order

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. Price: Low to High orders all visible Dress product prices

**File:** `tests/ecommerce/price-sorting.spec.ts`

**Steps:**
  1. Start in a fresh browser context with no prior session assumptions. Navigate to /kadin/elbise on ECOMMERCE_BASE_URL using project ecommerce-chromium.
    - expect: The Dress heading is visible, the product-listing-loading state has ended, and product cards are visible.
    - expect: At least two cards expose a displayed price through data-testid=product-card-price; fail clearly if the catalog is empty or price data is absent.
  2. Read the visible product cards in DOM order and record each card's data-testid=product-card-price text. Parse the displayed rupee amount into a finite number by removing the currency symbol and grouping commas.
    - expect: All recorded card prices parse to valid finite numbers.
    - expect: There are at least two distinct prices so the ordering check can detect a meaningful change.
  3. Select the Price: Low to High option (value price-low) in data-testid=product-listing-sort-select. Wait for the product listing to finish updating, then read all visible data-testid=product-card-price elements in their current card order.
    - expect: The select has value price-low.
    - expect: The post-sort price count matches the visible product-card count; no card has an absent or unparsable price.
  4. Compare every adjacent pair of the displayed post-sort numeric prices in DOM order.
    - expect: Each price is less than or equal to the following price, allowing equal-priced products.
    - expect: Fail if any later card costs less than the preceding card, even when the select still shows price-low.
  5. Compare the post-sort multiset of numeric prices with the recorded pre-sort multiset.
    - expect: Sorting has not silently removed, duplicated, or substituted products by price; the same price values remain represented.
    - expect: A catalog data update during the scenario should be reported as an unstable test condition rather than accepted as sorting success.
