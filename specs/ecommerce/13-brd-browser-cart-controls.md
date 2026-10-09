# TC-CART-03-CORE browser cart controls

Source: Zeouf BRD v1.5 CART-03, website commit `481a090`. Target: public Zeouf, `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`.

Use a fresh guest browser context, block all non-read requests, force only the read-only currency response to INR, and seed two fictional variants in browser localStorage. No account, product or order is created.

1. Open the home page and bag. Verify both variant lines show an image, name, size, color, quantity, line total and a 3,000 INR subtotal.
2. Increase the S variant, then decrease it back to one. Verify its line total and subtotal change each time while M remains separate.
3. Decrease S below one and remove M explicitly. Verify only the selected variant disappears, then the empty state appears.
4. Assert no non-read request was attempted.

Automation: `tests/ecommerce/cart-browser-controls.spec.ts`. Passed on the public deployment on 2026-10-07. This is browser-local behavior; it does not verify server cart ownership or stock.
