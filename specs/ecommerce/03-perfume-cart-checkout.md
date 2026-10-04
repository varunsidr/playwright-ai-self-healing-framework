# zeouf Perfume Cart Checkout

## Generated Playwright Test

- **Script:** [tests/ecommerce/perfume-cart-checkout.spec.ts](../../tests/ecommerce/perfume-cart-checkout.spec.ts)
- **Project:** `ecommerce-chromium`
- **Run from the repository root:**

```powershell
npx.cmd playwright test tests/ecommerce/perfume-cart-checkout.spec.ts --project=ecommerce-chromium
```

Start the zeouf storefront at `ECOMMERCE_BASE_URL` (default `http://localhost:3000`) before running the script. The current local storefront blocks this happy path because a freshly registered shopper cannot sign in without account confirmation or pre-seeded confirmed credentials.

## Application Overview

The zeouf fashion storefront at ECOMMERCE_BASE_URL (default `http://localhost:3000`) lets shoppers browse perfume products from the homepage navigation. Live exploration showed that signed-out shoppers are prompted to register or sign in before cart additions succeed, so this scenario creates a fresh shopper account using realistic test data before adding products. The test uses Playwright project `ecommerce-chromium` and seed `tests/ecommerce/seed.spec.ts`.

## Test Scenarios

### 1. Perfume cart checkout

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. Add multiple perfumes to the cart and continue to checkout

**File:** `tests/ecommerce/perfume-cart-checkout.spec.ts`

**Steps:**
  1. Start from the fresh zeouf homepage using the storefront seed.
    - expect: The zeouf homepage is loaded and the PERFUME navigation link is visible.
  2. Open the account panel, choose Register, and submit a fresh shopper using a unique realistic email address.
    - expect: The account panel closes or no longer blocks catalog interactions.
    - expect: The shopper can add products to the cart without seeing the sign-in-required state.
  3. From the homepage navigation, open the Perfume collection.
    - expect: The URL ends with `/perfume`.
    - expect: The Perfume heading is visible and product cards are shown.
  4. Add two distinct in-stock perfume products from the visible catalog cards.
    - expect: Each selected perfume exposes an add-to-cart button before it is clicked.
    - expect: The products remain in the catalog and no unavailable item is selected.
  5. Open My Cart from the navbar.
    - expect: The cart panel is open.
    - expect: The cart contains both selected perfume names.
    - expect: The cart is not empty and exposes a checkout action.
  6. Continue from the cart to checkout.
    - expect: The checkout page opens at `/checkout`.
    - expect: The Complete your order heading is visible.
    - expect: Both selected perfume names are visible in the order summary.
    - expect: The Simulate payment button is enabled for the registered shopper with a non-empty cart.
