# Controlled catalog, search and cart-storage acceptance

Source: Zeouf BRD v1.5 / QA guide snapshot at website commit `481a090`. Target: `ECOMMERCE_BASE_URL` (default public Zeouf), project `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`. Use `fixtures/ecommerce-base`, the existing storefront page object and fresh browser contexts.

## Environment and evidence

Intercept observed products/product_size_stock GET contracts with fictional records and currency GET with INR. Cart tests seed only browser-local storage and inject faults only for `els-cart`. Block and assert absence of non-read requests. No account, product, stock row, review or order is created. These are deployed frontend fixture checks; they do not prove Supabase query/RLS correctness, live inventory or mail delivery. No new production write permissions are implied.

## Catalog (`catalog-fixture.spec.ts`)

- `TC-CAT-007-01`: with 0/1/24/25/48/49 matching records, verify initial at-most-24 cards, count text, each further 24-card batch and absence of Load more after the final batch. Empty success shows no demo/retry feedback.
- `TC-CAT-003-02`: combine Brand A/B with unsized stock, verify matching counts and zero matches, and clear all filters to restore the collection.
- `TC-CAT-005-02`: two sized products have inverse S/M availability at zero/one/four. In stock only and selected size identify the correct card. Missing-size-row policy remains G-09.
- `TC-CAT-06-CORE`: low/high prices break equal-price ties by name; Recommended preserves incoming order. Verify exact card names and count. New Arrivals ordering remains unverified.
- `TC-CAT-08-CORE`: product or stock 503/pending requests show distinct demo fallback or stock warning, respectively. Pending requests show loading first; application timeout feedback must appear within a 12-second assertion window around its documented eight-second deadline. Product fallback excludes fictional live cards; stock failure retains them. Restore successful responses, retry, and verify notices disappear and fixture cards return. Separately navigate away during a pending product request and observe cancellation.

## Search (`search-fixture.spec.ts`)

- `TC-SEA-002-01`: with both-match, name-only, category-only and unrelated products, search mixed-case `dReSs`. Verify both ilike query parameters, exactly three distinct products and one card for each matching ID. Fixture matching does not prove live database case-insensitive semantics.
- `TC-SEA-03-CORE`: a successful empty response shows no results and zero cards. Error/retry and blank-query G-15 remain outside this slice.

## Cart (`cart-storage-fixture.spec.ts`)

- `TC-CART-004-02`: retain a valid saved item and discard null row, empty ID, blank name, negative/nonnumeric/null price, zero/fractional/unsafe quantity, invalid option and unsupported image protocol. Expect recovery feedback, correct totals, persisted quantity edit and correct reload state without page errors.
- `TC-CART-004-02`: normalize missing/empty/null color and merge recovered equal tuples; retain the distinct size variant and verify saved quantities/subtotal.
- `TC-CART-004-04`: null/object/string top-level storage values recover to empty with notice. The existing malformed JSON regression remains in `cart-malformed-storage.spec.ts`.
- `TC-CART-004-03`: a cart read SecurityError shows a persistence notice and usable empty drawer. A write QuotaExceededError preserves recovered in-memory quantity edits, subtotal and removal. Account separation remains G-10.

## Run and remaining work

Run `npm run test:ecommerce:fixtures` for these cases plus the existing currency fixture tests. CI runs this command alongside the public smoke job when isolated staging is not configured; full confirmed-staging runs already include the fixture specs. Failed cases retain the project's usual artifacts.

Initial verification on 2026-10-10: all 35 newly added tests passed against the public deployment using controlled fixtures. Record subsequent full-suite results separately in `requirements/AUTOMATION_STATUS.md`. Isolated staging, controlled inboxes and website-repository access are still required for the remaining integration/infrastructure cases; no skipped or unexecuted case becomes acceptance evidence.
