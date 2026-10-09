# Zeouf BRD CART-01 guest add denied

## Generated automation and execution

- **Case:** `TC-CART-001-01` (`CART-01`, P0)
- **Script:** [cart-guest-denial.spec.ts](../../tests/ecommerce/cart-guest-denial.spec.ts)
- **Result:** Passed on deployed Zeouf in `ecommerce-chromium` on 2026-10-06. The test blocked non-read HTTP requests and observed none.

```powershell
npx.cmd playwright test tests/ecommerce/cart-guest-denial.spec.ts --project=ecommerce-chromium
```

This verifies the guest-denial branch only. The signed-in add and no automatic replay after login are planned as `TC-CART-001-02` for isolated staging.

## Application Overview

Source: Zeouf BRD v1.5 requirement CART-01 (P0, implemented), known gap G-10 only for account/cart separation, and QA guide snapshot from website commit 481a090. Public read-only case TC-CART-001-01. Target deployed Zeouf, Playwright ecommerce-chromium, seed tests/ecommerce/seed.spec.ts. Planner observed a current unsized in-stock women's product card with an Add to bag control; guest click opened the account registration panel, and the cart remained empty after dismissing the prompt. No login, account, order, or mutation is part of this case.

## Test Scenarios

### 1. CART-01 guest cart gate

**Seed:** `tests/ecommerce/seed.spec.ts`

#### 1.1. TC-CART-001-01 guest add prompts for account and leaves cart empty

**File:** `tests/ecommerce/cart-guest-denial.spec.ts`

**Steps:**

1. Start with a fresh visitor browser context on the Zeouf homepage and install a guard that aborts and records every non-read HTTP request. - expect: No authenticated customer state or saved cart line is present.
2. Open the Women collection and wait for the first product card with an Add to bag control. - expect: A current product is visible without depending on a fixed inventory ID or name.
3. Press that product's Add to bag control as a guest. - expect: The My account panel opens on the registration view. - expect: No product is added to the cart.
4. Close the account panel and open My Cart. - expect: The Shopping bag panel says Your cart is empty. - expect: No non-read HTTP request was attempted.
