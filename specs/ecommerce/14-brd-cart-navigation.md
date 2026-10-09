# TC-CART-06-CORE cart navigation

Source: Zeouf BRD v1.5 CART-06, website commit `481a090`. Target: public Zeouf, `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`.

1. In a fresh empty guest context, open the bag. Verify Start Shopping appears, Proceed to Checkout is absent, and Start Shopping closes the drawer.
2. In another fresh guest context, seed one fictional localStorage cart line. Verify Proceed to Checkout appears, Start Shopping is absent, and clicking checkout closes the drawer and opens `/checkout` with the signed-out prompt.
3. Assert no non-read request was attempted. Do not submit checkout or assert an upper quantity cap because the current drawer has none.

Automation: `tests/ecommerce/cart-browser-controls.spec.ts`. Both branches passed on the public deployment on 2026-10-07.
