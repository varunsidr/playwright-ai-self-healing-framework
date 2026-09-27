# Product quantity minimum

- **Area:** ecommerce product detail
- **Purpose:** verify that decreasing the quantity cannot take it below one.
- **Seed:** `tests/ecommerce/seed.spec.ts`
- **Preconditions:** the ecommerce site is running at `ECOMMERCE_BASE_URL` and the women collection has at least one product.
- **Test suite:** `Ecommerce product details`
- **Test name:** `keeps quantity at one when decreased @negative`
- **Test file:** `tests/ecommerce/quantity-minimum.spec.ts`
- **Steps:**
  1. Open the first product from the women collection using the seed test.
  2. Verify the quantity starts at `1`.
  3. Click the quantity decrease button once.
  4. Verify the quantity remains `1`.
  5. Click the quantity increase button once, then decrease once.
  6. Verify the quantity returns to `1`.
- **Expected:** the quantity never drops below one. The generated spec uses `fixtures/ecommerce-base`, the existing ecommerce page object, and the `@ecommerce`, `@regression`, and `@negative` tags.
- **Automated spec:** `../tests/ecommerce/quantity-minimum.spec.ts` (to be generated).
