# Zeouf BRD CART-04 malformed browser cart recovery

- **Requirement:** `CART-04` (P0), `NFR-03` (P1)
- **Case:** `TC-CART-004-04`
- **Source:** Zeouf BRD v1.5 and QA guide snapshot at website commit `481a090`
- **Role/environment:** Fresh visitor context on the public storefront; browser storage only; all non-read HTTP requests blocked
- **Automation:** [cart-malformed-storage.spec.ts](../../tests/ecommerce/cart-malformed-storage.spec.ts)
- **Execution:** Passed on deployed Zeouf in `ecommerce-chromium` on 2026-10-06; no non-read request attempted

## Steps and expected results

1. Before the first navigation, seed `els-cart` with malformed JSON in the isolated browser context.
2. Open the Zeouf homepage and then My Cart.
3. Expect the bag to be empty, a visible notice that saved items could not be restored, and no page crash or non-read request.

This file verifies malformed JSON recovery. The 2026-10-10 controlled-storage batch in `cart-storage-fixture.spec.ts` adds nonarray recovery, mixed valid/invalid rows, normalized duplicate variants, reload persistence and read/write faults. See [the fixture plan](18-brd-controlled-catalog-search-cart.md) for scoped evidence. Account separation still requires isolated staging and an owner decision for G-10.

```powershell
npx.cmd playwright test tests/ecommerce/cart-malformed-storage.spec.ts --project=ecommerce-chromium
```
