# TC-CUR-02-CORE currency formatting and fallback

Source: Zeouf BRD v1.5 CUR-02, website commit `481a090`. Target: public Zeouf with controlled browser fixtures, `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`.

Use a fresh guest browser context, block non-read requests, seed one fictional 1,000 INR item in localStorage, and intercept only the read-only region response.

1. Return USD at rate 0.025 and verify the drawer subtotal is `$25` with no fractional digits.
2. Return a zero or invalid USD rate; each must fall back to `₹1,000`.
3. Return HTTP 503 for the region request; the drawer must still show `₹1,000`.
4. Assert no non-read request was attempted.

Automation: `tests/ecommerce/currency-fixture.spec.ts`. This tests client-side currency fallback with a mocked region response. It does not verify the live exchange-rate provider or every product/cart price surface.
