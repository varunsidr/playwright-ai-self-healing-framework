# Zeouf requirement-to-case catalog

Source: Zeouf BRD v2.0 and QA guide at website commit df94db96826c3226abc77422d2234c7d3db92ea1.

This is a **first-pass planning inventory**, not an execution report: 137 requirements map to 140 case records. 67 cases come from the QA guide; 73 are curated additions; 0 are requirement-backed placeholders. Scenarios still need tester review and may need more boundary cases, fixtures and detailed steps. Existing automation is not counted as verified coverage until linked and reviewed.

| Case ID         | Requirements                                                           | Priority   | Environment           | Design          | Automation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------- | ---------------------------------------------------------------------- | ---------- | --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-NAV-006-01   | NAV-06                                                                 | P1         | public-read-only      | guide-specified | `tests/ecommerce/legacy-category-redirects.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial: seven legacy main-category and fifteen legacy subcategory URLs assert their exact English redirect destination and heading, plus original three representative checks; unknown or retired legacy paths unverified)                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-CAT-005-01   | CAT-03, CAT-05                                                         | P1         | isolated-staging      | guide-specified | `tests/ecommerce/catalog-fixture.spec.ts` (partial: controlled S=0/M=4 and S=1/M=0 read fixtures exercise selected-size stock filtering; actual inventory rows unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| TC-CAT-001-01   | CAT-01                                                                 | P1         | isolated-staging      | guide-specified | `tests/ecommerce/category-membership-fixture.spec.ts` (TC-CAT-01-CORE /men/trousers includes only matching categories. Reviewed coverage: partial: controlled reads of 14 English categories with mixed casing; seven main and nine subcategory routes assert exact membership, counts, and Women/Men separation; database query semantics and imported Turkish labels unverified TC-CAT-01-CORE /men/jacket includes only matching categories. Reviewed coverage: partial: controlled reads of 14 English categories with mixed casing; seven main and nine subcategory routes assert exact membership, counts, and Women/Men separation; database query semantics and imported Turkish labels unverified) |
| TC-CAT-007-01   | CAT-07                                                                 | P1         | isolated-fixture      | guide-specified | `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: controlled 0/1/24/25/48/49 batching, visible-of-matching counts, final button absence, filter-change reset to the first 24 of 30 matching products, subsequent reveal to 30 and no-match/clear-all recovery. Fictional GET responses; full live catalog acceptance remains unassessed.)                                                                                                                                                                                                                                                                                                           |
| TC-SEA-002-01   | SEA-02, SEA-03                                                         | P1, P2     | isolated-fixture      | guide-specified | `tests/ecommerce/search-fixture.spec.ts` (controlled mixed-case name/category request union, both-match ID deduplication and unrelated-product exclusion; actual database query behavior unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| TC-AUTH-002-01  | AUTH-02, AUTH-07                                                       | P0, P1     | isolated-staging      | guide-specified | `tests/ecommerce/auth-confirmation-mismatch.spec.ts` (partial: mismatch branch only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| TC-AST-001-01   | AST-01, AST-02, AST-03, AST-04, AST-05, AST-07                         | P1, P0     | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-002-01   | AST-02                                                                 | P0         | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-002-02   | AST-02, AST-03                                                         | P0         | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-003-01   | AST-03, AST-05                                                         | P0         | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-006-01   | AST-03, AST-06, CNT-03, NFR-07                                         | P0, P2, P1 | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-008-01   | AST-07, AST-08                                                         | P0, P1     | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-009-01   | AST-09                                                                 | P1         | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-010-01   | AST-01, AST-05, AST-10                                                 | P1, P0     | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-002-03   | AST-02, AST-07                                                         | P0         | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CART-002-01  | CART-02, CART-05                                                       | P1         | isolated-staging      | guide-specified | `tests/ecommerce/guest-boundaries.spec.ts`, `tests/ecommerce/isolated/cart-variants.spec.ts` (partial: fictional browser-cart restoration merges duplicate size/color tuples and keeps other variants distinct with correct subtotal; authenticated add behavior unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                |
| TC-CART-004-01  | CART-04, AUTH-06, AST-04                                               | P0         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/account-switch.spec.ts` (Account-scoped browser ownership with fictional A/B sessions: sign-out empties/closes the bag, B sees only its bag, token refresh preserves it, A restores after switch/reload and legacy ownerless data is discarded. Real auth/database acceptance remains separate; historical G-10 evidence is archived.)                                                                                                                                                                                                                                                                                                                                            |
| TC-CART-004-02  | CART-02, CART-04, CART-05                                              | P1, P0     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/cart-storage-fixture.spec.ts` (browser-local mixed valid/invalid rows across eleven boundaries, edits persisted after reload, missing/empty/null color normalization and recovered tuple merging; actual provider identity transitions remain unverified; fictional account-scoped ownership is separately covered by TC-CART-004-01)                                                                                                                                                                                                                                                                                                                                             |
| TC-CART-004-03  | CART-04, NFR-03                                                        | P0, P1     | isolated-fixture      | guide-specified | `tests/ecommerce/isolated/cart-storage-fixture.spec.ts` (controlled cart-key SecurityError read and QuotaExceededError write; visible persistence notice, bag dismissal, in-memory quantity/subtotal and removal; cross-account state unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| TC-NAV-001-01   | NAV-01, NAV-02                                                         | P1         | public-read-only      | guide-specified | `tests/ecommerce/home-hero.spec.ts`, `tests/ecommerce/home-destinations.spec.ts`, `tests/ecommerce/catalog.spec.ts`, `tests/ecommerce/seed.spec.ts` (Partial: manual selection, pause/resume, reduced-motion still imagery and timer invariance, browser-clock auto-rotation and offscreen suspension/resumption; six editorial destinations, both collection panels, blouse edit and seven homepage category hrefs. Real hidden-tab playback remains unverified.)                                                                                                                                                                                                                                          |
| TC-NAV-005-01   | NAV-03, NAV-04, NAV-05                                                 | P1         | public-read-only      | guide-specified | `tests/ecommerce/navigation-accessibility.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial: account/cart/search/mobile keyboard focus cycles, scroll lock, Escape and trigger restoration; mobile women/men clothing navigation and seven hrefs; desktop Women/Men keyboard disclosure, Escape focus return, inert closure and hover reopening; backdrop and additional paths unverified)                                                                                                                                                                                                                                                                                                               |
| TC-PDP-001-01   | PDP-01, PDP-08                                                         | P1         | isolated-fixture      | guide-specified | `tests/ecommerce/product-card-fixture.spec.ts` (Partial: controlled unsized/sized/unavailable card actions at 375/1440px, hover/focus reveal, size href, image-failure information, guest denial and emulated coarse-pointer touch quick-add. Detail galleries, physical-device behavior and live stock remain unverified.)                                                                                                                                                                                                                                                                                                                                                                                 |
| TC-PDP-001-02   | PDP-01, NFR-03                                                         | P1         | public-read-only      | guide-specified | `tests/ecommerce/product-detail.spec.ts` (opens a product and checks quantity and review form. Reviewed coverage: partial: initial quantity one, increase to two, decrease to one on unsized product only requires sign in before adding a product to the cart. Reviewed coverage: guest-denial branch; no signed-in add/replay)                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CHK-003-01   | CHK-03                                                                 | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-005-01   | CHK-05, CHK-06                                                         | P0         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/checkout.spec.ts` (Partial: forged browser price is omitted from checkout item payload, which sends only id/quantity/size/color; backend price recomputation and stored totals unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| TC-CHK-007-01   | CHK-07                                                                 | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-007-02   | CHK-06, CHK-07                                                         | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-009-01   | CHK-09                                                                 | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-009-02   | CHK-09                                                                 | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-009-03   | CHK-09                                                                 | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-009-04   | CHK-03, CHK-09                                                         | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CHK-010-01   | CHK-08, CHK-09, CHK-10, CHK-04                                         | P1, P0     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/checkout-recovery.spec.ts` (Mocked network loss followed by reload and explicit retry: identical payload/key, digest-only storage, cart/attempt cleanup and honest demo feedback. No backend replay or transaction acceptance.)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| TC-CHK-010-02   | CHK-10                                                                 | P0         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/checkout-attempts.spec.ts`, `tests/ecommerce/isolated/checkout-recovery.spec.ts` (Partial: controlled pending payment blocks repeated client submits; retry keys persist across unchanged/reloaded attempts and rotate on changed details, including storage-denied fallback; missing order ID preserves bag for retry. Existing success/error feedback remains covered. Backend idempotency and persistence unverified. Fictional client attempt fingerprint changes, with A/B owner isolation; no server persistence acceptance. Malformed client attempt storage recovers on submission; mocked successful service response, not real API validation.)                         |
| TC-PDP-003-01   | PDP-03, PDP-04, PDP-06, RST-01                                         | P0, P1, P2 | isolated-staging      | guide-specified | `tests/ecommerce/isolated/product-options.spec.ts` (Reviewed df94db9 contract migration: TC-PDP-003-01 sold-out S offers restock without purchase and available M enters browser bag. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance.)                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-PDP-009-01   | PDP-09                                                                 | P2         | public-read-only      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-NFR-005-01   | NFR-05                                                                 | P1         | public-read-only      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-ORD-001-01   | ORD-01, NFR-01                                                         | P0         | isolated-staging      | guide-specified | `tests/ecommerce/account-cart-checkout.spec.ts`, `tests/ecommerce/isolated/order-history.spec.ts` (Partial: signed-out prompt plus controlled signed-in loading/empty/error recovery, current-user/date-order request filters, supplied row sequence, five statuses, accordion and deleted-product fallback. Real query ordering, ownership and database RLS unverified; native variants/address/payment rendering has separate evidence; real persisted presentation remains unverified.)                                                                                                                                                                                                                  |
| TC-REV-004-01   | REV-04                                                                 | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-REV-004-02   | REV-01, REV-04, NFR-01                                                 | P1, P0     | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-REV-003-01   | REV-03                                                                 | P1         | isolated-fixture      | guide-specified | `tests/ecommerce/isolated/reviews-restock.spec.ts` (Controlled upload/HTTP/network errors retain form/preview; pending 201 with/without image clears form with approval feedback without adding public reviews; approved-only query asserted; real writes unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| TC-REV-006-01   | REV-05, REV-06, REV-07, ADM-02                                         | P1, P0     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Reviewed df94db9 contract migration: TC-REV-006-01 admin review filters show pending and approved feedback with moderation controls. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance. Partial: controlled approved/pending rows from all-status admin read, no sidebar moderation buttons and visible error on failure; real signed-cookie authorization and RLS unverified. Check: TC-REV-006-01 failed admin review read reports the service error.)                                                                                                                           |
| TC-REV-002-01   | REV-02                                                                 | P1         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: frontend oversize exclusion, three-preview cap, removal and multipart filenames are verified with intercepted upload; actual signature validation, fourth-file rejection, private storage and signed URLs unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-REV-002-02   | REV-02, NFR-08                                                         | P1         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: controlled 429 upload response retains review fields/preview, sends no review POST and claims no public submission; actual daily/distributed limiter unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| TC-RST-002-01   | RST-01, RST-02                                                         | P1         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-RST-004-01   | RST-04, RST-06                                                         | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-RST-005-01   | RST-05                                                                 | P1         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/service-boundaries.spec.ts` (Partial: real isolated production GET/POST unsubscribe rejects missing/empty/short/long/nonhex/whitespace tokens with HTTP 400 and valid-shape tokens without service credentials with HTTP 503. No real deletion/replay/RLS acceptance.)                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-ADM-002-01   | ADM-02, AOR-01, STK-01                                                 | P0         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Partial: actual isolated order GET and stock PATCH return 401 without a signed cookie despite legacy browser flag/cookie; placeholder runtime only, valid-admin and migrated staging permissions unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ADM-001-01   | ADM-01, NFR-02                                                         | P0         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Partial: both credentials required; controlled 401/429/500 give distinct feedback, clear password and never set admin flag; real hash/cookie/secret-rotation acceptance unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| TC-ADM-002-02   | ADM-02, REV-05                                                         | P0, P1     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/production-denials.spec.ts` (Partial: actual local DELETE rejects fictional customer bearer and retired dev key without signed admin cookie; valid-admin deletion and real database preservation unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ADM-003-01   | ADM-03                                                                 | P0         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Partial: mocked logout failure retains flag/route, explicit successful retry clears flag and returns to login; real signed-cookie revocation and server logout contract unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| TC-PRD-002-01   | PRD-02, ADM-02                                                         | P1, P0     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: controlled HTTP/network save denial retains editor and values; explicit mock success refreshes UI; real permission policy and database persistence unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| TC-ADM-005-01   | ADM-04, ADM-05, STK-03                                                 | P1         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/dashboard-recovery.spec.ts` (Fictional dashboard aggregates, refresh error/unavailable values, explicit retry, pending queue and Add product form. No cookie authorization or real database acceptance.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| TC-PRD-003-01   | PRD-03, NFR-08                                                         | P0, P1     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: blank/whitespace product names disable Save and Cancel preserves supplied catalog without writes; server numeric validation and stored-product invariants unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| TC-PRD-004-01   | PRD-04, NFR-01, NFR-08                                                 | P1, P0     | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-PRD-005-01   | PRD-05, STK-04                                                         | P1, P0     | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-PRD-006-01   | PRD-06                                                                 | P1         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-STK-002-01   | STK-02, ADM-04                                                         | P0, P1     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/stock-recovery.spec.ts` (Partial: controlled M=4 to 2 response refreshes size and aggregate 9 to 7; HTTP/network failure preserves aggregate until retry; invalid stock sends no request. Real atomic persistence and email delivery unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| TC-STK-004-01   | STK-01, STK-02, STK-04, NFR-01                                         | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-STK-004-02   | STK-04, CHK-07                                                         | P0         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AOR-003-01   | AOR-03, ORD-02                                                         | P1         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: admin UI controlled status success and failed update retaining pending detail/list; actual persisted status and customer-history synchronization unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-ANL-001-01   | ANL-01, ANL-04, ANL-05                                                 | P1, P2     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/analytics-reviewed.spec.ts`, `tests/ecommerce/isolated/analytics-loading.spec.ts` (Partial: controlled pending order summaries remain unavailable and explicit failed-read retry recovers after response release; reviewed active totals/average/top-five boundaries remain separately covered. Real persisted reconciliation unverified.)                                                                                                                                                                                                                                                                                                                                        |
| TC-OPS-002-01   | OPS-02, OPS-03, OPS-04, NFR-02                                         | P0, P1     | isolated-staging      | guide-specified | `tests/ecommerce/isolated/production-denials.spec.ts` (Partial: actual fresh local production reset/seed helpers return 404 and dev create-user returns 403 before backend access; deployed environment/configuration and database no-mutation snapshots unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| TC-OPS-004-01   | OPS-04, AUTH-07                                                        | P1         | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-NFR-008-01   | NFR-08                                                                 | P1         | isolated-staging      | guide-specified | `tests/ecommerce/isolated/service-boundaries.spec.ts` (Partial: real isolated production admin-login/checkout/review/upload/restock handlers fail closed with exact HTTP 503 feedback when shared limiter configuration is absent. No multi-instance counters, deployed proxy trust, RPC-failure or fifth/sixth-attempt acceptance.)                                                                                                                                                                                                                                                                                                                                                                        |
| TC-OPS-009-01   | OPS-09, NFR-01                                                         | P1, P0     | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-OPS-010-01   | OPS-10, CHK-05, CHK-06, CHK-07, CHK-08, CHK-09, STK-02, STK-04, NFR-01 | P1, P0     | website-repository-ci | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CNT-001-01   | CNT-01                                                                 | P1         | public-read-only      | guide-specified | `tests/ecommerce/newsletter-preview.spec.ts`, `tests/ecommerce/isolated/reset-newsletter.spec.ts` (Partial: blank/malformed newsletter email fails native validation without success or writes; valid preview behavior remains separately covered. No actual subscription or delivery claim.)                                                                                                                                                                                                                                                                                                                                                                                                               |
| TC-CAT-003-02   | CAT-03, CAT-05, CAT-07                                                 | P1         | isolated-fixture      | curated         | `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts` (controlled brand/unsized-stock combination, visible-of-matching count including zero matches and Clear all; missing brand/size metadata selector omission; other combinations untested)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| TC-CAT-005-02   | CAT-03, CAT-05                                                         | P1         | isolated-fixture      | curated         | `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: controlled S/M size-stock zero/one/four boundaries, positive aggregate fallback when size rows are missing, and selected-size constraints when rows exist. Live inventory remains unverified.)                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AUTH-002-02  | AUTH-02                                                                | P0         | public-read-only      | curated         | `tests/ecommerce/auth-confirmation-blank.spec.ts` (blank confirmation branch)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TC-CUR-003-01   | CUR-03                                                                 | P0         | isolated-staging      | curated         | `tests/ecommerce/isolated/currency-surfaces.spec.ts` (Partial: controlled USD detail, browser bag and supplied order history use shared formatter while admin supplied totals remain INR; actual checkout/order storage and persisted reconciliation unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| TC-AUTH-003-01  | AUTH-03                                                                | P0         | isolated-staging      | curated         | `tests/ecommerce/isolated/auth-favorites.spec.ts` (Partial: controlled login denial retains form/panel; mock success closes panel and fake session survives reload; real credential/session acceptance unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-FAV-002-01   | FAV-02                                                                 | P0         | isolated-staging      | curated         | `tests/ecommerce/isolated/account-switch.spec.ts` (Partial: fictional account switch clears favorite UI, filters reads by the second user and sends their identity on insert; real sessions and database RLS remain unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CART-001-01  | CART-01                                                                | P0         | public-read-only      | curated         | `tests/ecommerce/cart-guest-denial.spec.ts`, `tests/ecommerce/product-detail.spec.ts` (guest-denial branch; no signed-in add/replay)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| TC-CART-001-02  | CART-01                                                                | P0         | isolated-staging      | curated         | `tests/ecommerce/isolated/guest-cart-resume.spec.ts` (Partial: interrupted guest add stays empty through fake sign-in; explicit add creates one browser line; real login, ownership and integration unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CART-004-04  | CART-04, NFR-03                                                        | P0, P1     | public-read-only      | curated         | `tests/ecommerce/isolated/cart-malformed-storage.spec.ts`, `tests/ecommerce/isolated/cart-storage-fixture.spec.ts` (partial: malformed JSON and three non-array storage values recover to an empty bag with a notice; ownership unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| TC-CHK-001-01   | CHK-01                                                                 | P0         | isolated-staging      | curated         | `tests/ecommerce/guest-boundaries.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (partial: signed-out empty and nonempty checkout disable payment and preserve browser cart; expired-token API denial and signed-in empty checkout require staging)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| TC-AOR-004-01   | AOR-04                                                                 | P0         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Reviewed df94db9 contract migration: TC-AOR-004-01 forward status controls reflect responses and delivered orders are terminal. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance.)                                                                                                                                                                                                                                                                                                                                                                                                |
| TC-NAV-07-CORE  | NAV-07                                                                 | P1         | public-read-only      | curated         | `tests/ecommerce/not-found-admin-shell.spec.ts` (partial: unknown product and subcategory 404 plus admin chrome absence; route refresh untested)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CAT-01-CORE  | CAT-01                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/category-membership-fixture.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial: controlled reads of 14 English categories with mixed casing; seven main and nine subcategory routes assert exact membership, counts, and Women/Men separation; database query semantics and imported Turkish labels unverified)                                                                                                                                                                                                                                                                                                                                                                          |
| TC-CAT-02-CORE  | CAT-02                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: Women and Men English New Arrivals/Best Sellers/Collection routes select New/BEST/Featured/Populer/null tag populations with controlled GET responses. Real database membership and legacy highlight variants remain unverified; no sales ranking is inferred.)                                                                                                                                                                                                                                                                                                                       |
| TC-CAT-04-CORE  | CAT-04                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: keyboard inclusive bounds/crossing clamps, visible-of-matching counts, exact Under-tier boundary and delayed USD detection clearing both populated INR bounds. Controlled GET responses only; live region/rate integration remains unverified.)                                                                                                                                                                                                                                                                                                                                       |
| TC-CAT-06-CORE  | CAT-06                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/price-sorting.spec.ts` (partial: controlled low/high price ordering with name ties, Recommended incoming order, and New Arrivals new-tag/date/name precedence; live Dress price-low multiset; missing dates/tags beyond the selected fixtures unverified)                                                                                                                                                                                                                                                                                                                                |
| TC-CAT-08-CORE  | CAT-08                                                                 | P1         | isolated-fixture      | curated         | `tests/ecommerce/catalog-fixture.spec.ts` (controlled product/stock 503 and pending-request timeout, loading/demo/stock-warning distinction, successful retry, empty success and navigation cancellation; fixture results do not prove backend readiness)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| TC-SEA-01-CORE  | SEA-01                                                                 | P1         | public-read-only      | curated         | `tests/ecommerce/search-input.spec.ts` (focus, blank submit, trim/encode ampersand and Unicode, and closed search panel)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-SEA-03-CORE  | SEA-03                                                                 | P2         | isolated-fixture      | curated         | `tests/ecommerce/catalog.spec.ts`, `tests/ecommerce/search-fixture.spec.ts` (partial: no-results state for a missing query only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-PDP-02-CORE  | PDP-02                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/product-options.spec.ts` (Partial: seeded demo-product single photograph without thumbnails/colors; named color, photo correspondence and real cart colors unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| TC-PDP-04-CORE  | PDP-04                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/product-detail.spec.ts`, `tests/ecommerce/isolated/product-options.spec.ts` (partial: initial quantity one, increase to two, decrease to one on unsized product only Additional isolated scope: Controlled M=4/L=5 stock, minimum one, disabled increase at stock and clamp on size change; real inventory enforcement unverified.)                                                                                                                                                                                                                                                                                                                                                        |
| TC-PDP-05-CORE  | PDP-05                                                                 | P2         | isolated-fixture      | curated         | `tests/ecommerce/isolated/product-options.spec.ts` (Static XS/S/M/L clothing chest/waist table and close action on the real isolated frontend; not shoe or XL/XXL guidance.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| TC-PDP-06-CORE  | PDP-06                                                                 | P2         | public-read-only      | curated         | `tests/ecommerce/product-information.spec.ts` (partial: four panels open one at a time with nonempty text on one available product; supplied/fallback variants untested)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-PDP-07-CORE  | PDP-07                                                                 | P2         | isolated-staging      | curated         | `tests/ecommerce/isolated/product-options.spec.ts` (Partial: zero/one/twelve related fixtures, zero/one/eight cards and links, prefix/excluded-ID/limit query; live database filtering unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-CUR-01-CORE  | CUR-01                                                                 | P1         | isolated-fixture      | curated         | `tests/ecommerce/isolated/region.spec.ts` (Partial: India/America/time-zone/language browser fallback and real isolated non-US header precedence/no-store; US server exchange-provider branch unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| TC-CUR-02-CORE  | CUR-02                                                                 | P1         | isolated-fixture      | curated         | `tests/ecommerce/isolated/currency-fixture.spec.ts` (partial: one fictional browser-cart price with controlled positive, zero, invalid and failed region responses; other price surfaces and live exchange provider untested)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TC-AUTH-01-CORE | AUTH-01                                                                | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/auth-favorites.spec.ts` (Partial: required name/email/password block requests; controlled signup full_name metadata and confirmation guidance; actual signup/email policy/delivery unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| TC-AUTH-04-CORE | AUTH-04                                                                | P1         | public-read-only      | curated         | `tests/ecommerce/auth-password-visibility.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (password visibility and Sign In/Register tab behavior without form submission)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-AUTH-05-CORE | AUTH-05                                                                | P1         | isolated-staging      | curated         | `tests/ecommerce/guest-boundaries.spec.ts`, `tests/ecommerce/isolated/reset-newsletter.spec.ts`, `tests/ecommerce/isolated/password-recovery.spec.ts` (Partial: controlled password-reset success sends fictional email and origin return URL; denial preserves email and allows retry. Existing blank-email guard remains covered. Real provider delivery and reset completion unverified.)                                                                                                                                                                                                                                                                                                                |
| TC-AUTH-07-CORE | AUTH-07                                                                | P1         | isolated-fixture      | curated         | `tests/ecommerce/isolated/auth-favorites.spec.ts` (Reviewed df94db9 contract migration: TC-AUTH-07-CORE registration uses only signup on success. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance. Reviewed df94db9 contract migration: TC-AUTH-07-CORE registration uses only signup after explicit retry. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance.)                                                                                                                                                                                                             |
| TC-FAV-01-CORE  | FAV-01                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/auth-favorites.spec.ts` (Partial: detail heart follows locally fulfilled insert/delete and preserves state on failure; real uniqueness, card toggles, persistence and ownership unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| TC-FAV-03-CORE  | FAV-03                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/product-card-fixture.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (partial: guest favorite prompts sign-in, stays unselected and shows empty favorites; authenticated card loading and stored favorite details require staging)                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TC-CART-03-CORE | CART-03                                                                | P1         | public-read-only      | curated         | `tests/ecommerce/isolated/cart-browser-controls.spec.ts` (browser-local two-variant drawer rendering, quantity updates, line/subtotal calculations, below-one and explicit removal; fictional data only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-CART-06-CORE | CART-06                                                                | P1         | public-read-only      | curated         | `tests/ecommerce/isolated/cart-browser-controls.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (empty and nonempty drawer actions and checkout navigation; upper quantity limit remains unimplemented and unasserted)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CHK-02-CORE  | CHK-02                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/checkout.spec.ts` (Partial: five blank shipping inputs prevent requests through native validation; whitespace, server limits and real checkout unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| TC-CHK-04-CORE  | CHK-04                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/checkout.spec.ts` (Partial: both simulation labels, no card-number field, selected-method payload and mocked confirmation; saved order, charges and stock unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CHK-08-CORE  | CHK-08                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/checkout.spec.ts`, `tests/ecommerce/isolated/checkout-attempts.spec.ts` (Partial: controlled pending payment blocks repeated client submits; retry keys persist across unchanged/reloaded attempts and rotate on changed details, including storage-denied fallback; missing order ID preserves bag for retry. Existing success/error feedback remains covered. Backend idempotency and persistence unverified.)                                                                                                                                                                                                                                                                  |
| TC-ORD-03-CORE  | ORD-03                                                                 | P1         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-REV-07-CORE  | REV-07                                                                 | P1         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-RST-01-CORE  | RST-01                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: invalid email blocks requests; controlled HTTP/network errors retain email for retry; outgoing product/options checked; API validation and storage unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| TC-RST-03-CORE  | RST-03                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: mocked configured/unconfigured mail responses select distinct feedback and clear email; real mail and subscription persistence unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-PRD-01-CORE  | PRD-01                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: admin mixed-case name/exact category filtering, no-match and incoming response order; actual API newest ordering and persisted catalog unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| TC-PRD-04-CORE  | PRD-04                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: pasted-image preview, main-image removal and promoted image_url/images payload; actual upload bucket and saved images unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TC-PRD-05-CORE  | PRD-05                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: new S/M form serializes selected sizes and zero overall stock; database stock-row initialization, editing and aggregate synchronization unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| TC-PRD-06-CORE  | PRD-06                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: cancel sends no request; mocked delete failure preserves row and explicit successful retry removes it; real cascade and historical order snapshots unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| TC-STK-03-CORE  | STK-03                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: four sized 0/1/4/5 rows show Out/Low/Low/Available and dashboard count/units agree; unsized low-stock semantics and live inventory unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| TC-AOR-02-CORE  | AOR-02                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: controlled orders support mixed-case customer/order search with exact status, no-match versus empty response; real order ownership/data unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| TC-USR-01-CORE  | USR-01                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: controlled profile IDs/names, null placeholders and supplied order; actual 200-row API cap, updated_at ordering and authorization unverified; View action untested.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| TC-USR-02-CORE  | USR-02                                                                 | P2         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-ANL-02-CORE  | ANL-02                                                                 | P2         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: zero/six controlled orders produce exact five-status counts and rounded percentages, including rounding beyond a total of 100; live data unverified.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-ANL-03-CORE  | ANL-03                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-orders-insights.spec.ts`, `tests/ecommerce/isolated/analytics-loading.spec.ts` (Partial: controlled pending product response keeps stock units unavailable until loaded; sized/unsized inventory boundaries remain separately covered. Real inventory reconciliation unverified.)                                                                                                                                                                                                                                                                                                                                                                                           |
| TC-ANL-05-CORE  | ANL-05                                                                 | P2         | isolated-staging      | curated         | `tests/ecommerce/isolated/analytics-reviewed.spec.ts`, `tests/ecommerce/isolated/analytics-loading.spec.ts` (Partial: controlled pending review response keeps rating/count unavailable until loaded; reviewed approved-only population boundaries remain separately covered. Real authorized data reconciliation unverified.)                                                                                                                                                                                                                                                                                                                                                                              |
| TC-SET-01-CORE  | SET-01                                                                 | P2         | isolated-staging      | curated         | `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: identity, catalog/category counts, static database label and absence of save buttons with controlled reads; no live connection-health claim.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| TC-CNT-02-CORE  | CNT-02                                                                 | P1         | public-read-only      | curated         | `tests/ecommerce/footer-content.spec.ts`, `tests/ecommerce/legal.spec.ts` (footer hrefs and GitHub attributes; privacy/terms navigation and return-home links; category targets checked as hrefs only)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| TC-CNT-03-CORE  | CNT-03                                                                 | P1         | public-read-only      | curated         | `tests/ecommerce/footer-content.spec.ts` (Current home/guest-checkout/privacy/terms demo copy slices; historical fulfillment promises corrected in reviewed source. Attribution/license inconsistency remains G-22; assistant/provider/data disclosures still require full review.)                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-CNT-04-CORE  | CNT-04                                                                 | P2         | manual-review         | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-OPS-01-CORE  | OPS-01                                                                 | P2         | public-read-only      | curated         | `tests/ecommerce/api/public-api.spec.ts`, `tests/ecommerce/guest-boundaries.spec.ts` (full public health JSON shape and parseable timestamp; no database readiness inference)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| TC-OPS-05-CORE  | OPS-05                                                                 | P2         | isolated-fixture      | curated         | `tests/ecommerce/guest-boundaries.spec.ts` (partial: GET schema contract checks plain SQL when available or explicit 404 when absent on the current build; controlled local file removal and clipboard failure still need local runtime fixtures)                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| TC-OPS-06-CORE  | OPS-06                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-OPS-07-CORE  | OPS-07                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-OPS-08-CORE  | OPS-08                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-NFR-04-CORE  | NFR-04                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/navigation-accessibility.spec.ts` (partial: homepage and open empty bag without horizontal overflow at 375/768/1440px in Chromium; essential empty-bag action within viewport; catalog/detail/admin and Firefox/WebKit unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| TC-NFR-05-CORE  | NFR-05                                                                 | P1         | isolated-staging      | curated         | `tests/ecommerce/navigation-accessibility.spec.ts` (partial: existing dialog focus containment, Escape and focus restoration plus desktop disclosure keyboard behavior; screen readers, automated WCAG audit, remaining pages and full WCAG 2.2 acceptance unverified)                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| TC-NFR-06-CORE  | NFR-06                                                                 | P2         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-NFR-07-CORE  | NFR-07                                                                 | P1         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AOR-04-CORE  | AOR-04                                                                 | P0         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-RST-06-CORE  | RST-06                                                                 | P0         | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-PDP-10-CORE  | PDP-10                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-OPS-11-CORE  | OPS-11                                                                 | P2         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-11-CORE  | AST-11                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-12-CORE  | AST-12                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-13-CORE  | AST-13                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TC-AST-14-CORE  | AST-14                                                                 | P1         | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## Case scenarios

### TC-NAV-006-01

- Requirements: NAV-06
- Environment: public-read-only
- Mode: Baseline
- Scenario: Given a clean browser, when opening /kadin/elbise, then navigation reaches /women/dress and shows Dress listing; repeat for mapped legacy paths.
- Automation: `tests/ecommerce/legacy-category-redirects.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial: seven legacy main-category and fifteen legacy subcategory URLs assert their exact English redirect destination and heading, plus original three representative checks; unknown or retired legacy paths unverified)

### TC-CAT-005-01

- Requirements: CAT-03, CAT-05
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given P-SIZED and selected S with In stock only, when filters apply, then this product is excluded; selected M includes it.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts` (partial: controlled S=0/M=4 and S=1/M=0 read fixtures exercise selected-size stock filtering; actual inventory rows unverified)

### TC-CAT-001-01

- Requirements: CAT-01
- Environment: isolated-staging
- Mode: Regression scenario; execution evidence recorded separately
- Scenario: Given the unchanged external mixed-category fixtures, visit /men/trousers and /men/jacket: retain matching men's products and exclude Women's Trousers and Women's Jacket respectively. Ordinary subcategory filtering requires main-collection membership before normalized exact/substring matching. Check existing aliases, normalization, tag routes and live/fallback catalog paths without changing their rules.
- Automation: `tests/ecommerce/category-membership-fixture.spec.ts` (TC-CAT-01-CORE /men/trousers includes only matching categories. Reviewed coverage: partial: controlled reads of 14 English categories with mixed casing; seven main and nine subcategory routes assert exact membership, counts, and Women/Men separation; database query semantics and imported Turkish labels unverified TC-CAT-01-CORE /men/jacket includes only matching categories. Reviewed coverage: partial: controlled reads of 14 English categories with mixed casing; seven main and nine subcategory routes assert exact membership, counts, and Women/Men separation; database query semantics and imported Turkish labels unverified)

### TC-CAT-007-01

- Requirements: CAT-07
- Environment: isolated-fixture
- Mode: Automated isolated Chromium fixtures; execution evidence recorded separately
- Scenario: Given 49 matching products, when listing opens and Load More is clicked twice, then cards and Showing {visible} of 49 products both follow 24/48/49 and the final button is absent. Applying Matching Brand then shows 24 cards, Showing 24 of 30 products and Load More; one click shows 30/30 and hides the button. Removing the brand or Clear all restores 24/49 with Load More. Size M, stock-only, minimum INR 500 (49 matches) and maximum INR 1500 (30 matches) each reset fully revealed results to 24; clearing resets again.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: controlled 0/1/24/25/48/49 batching, visible-of-matching counts, final button absence, filter-change reset to the first 24 of 30 matching products, subsequent reveal to 30 and no-match/clear-all recovery. Fictional GET responses; full live catalog acceptance remains unassessed.)

### TC-SEA-002-01

- Requirements: SEA-02, SEA-03
- Environment: isolated-fixture
- Mode: Baseline; isolated browser coverage, live integration separate
- Scenario: Product matches both name/category: show it once. A failed branch must show Retry search rather than partial results/no matches. Retry after recovery, eight-second hung-operation deadline, rapid query replacement and blank/whitespace after results must never show stale cards.
- Automation: `tests/ecommerce/search-fixture.spec.ts` (controlled mixed-case name/category request union, both-match ID deduplication and unrelated-product exclusion; actual database query behavior unverified)

### TC-AUTH-002-01

- Requirements: AUTH-02, AUTH-07
- Environment: isolated-staging
- Mode: Isolated fallback and configured-client regressions; resolved G-01, no live account created
- Scenario: Given password A and confirmation B, mismatch shows an alert and signup does not run. Blank confirmation is required. Browser signup never calls the dev helper; matching values with unconfigured Supabase show configuration feedback. Configured intercepted signup sends name metadata without confirmation, returns to Sign In and explains verification.
- Automation: `tests/ecommerce/auth-confirmation-mismatch.spec.ts` (partial: mismatch branch only)

### TC-AST-001-01

- Requirements: AST-01, AST-02, AST-03, AST-04, AST-05, AST-07
- Environment: website-repository-ci
- Mode: Scoped local coverage; full live acceptance remains separate
- Scenario: With fictional model/widget/session fixtures, verify keyboard/privacy/cards/retry, no cart mutation before Confirm, successful Confirm exactly once, failed validation unchanged bag, logout/switch cleanup, late-response rejection and same-account token-refresh retention.
- Automation: Unlinked

### TC-AST-002-01

- Requirements: AST-02
- Environment: website-repository-ci
- Mode: Scoped automated SDK/API checks; extra model/history/body boundaries remain separate scenarios
- Scenario: Given injected API deps and intercepted real SDK fetch, validate Groq endpoint/auth, function-output round-trip, omitted unsupported store, low reasoning, missing/blank key without OpenAI fallback, safe provider 429 with one request/no automatic retry, limiter responses and generic provider failure. Validate malformed/empty roles/text and 1,000-character bound. Add model override/default, 12/13/50/51 raw-history and 24,000-character body boundaries; only last 12 are validated/processed.
- Automation: Unlinked

### TC-AST-002-02

- Requirements: AST-02, AST-03
- Environment: website-repository-ci
- Mode: Opt-in live provider smoke; not full model or production-site acceptance
- Scenario: Given AST-GROQ-SMOKE, run the application chat loop with default model and ask for a tote under INR 2000. Require a searchProducts call, returned tool output, final nonfallback reply and fixture card. Record model, requests and fixture scope; do not upgrade the provider plan or mutate the catalog/cart. Repeat generated policy/variant questions in separately scoped staging.
- Automation: Unlinked

### TC-AST-003-01

- Requirements: AST-03, AST-05
- Environment: website-repository-ci
- Mode: Isolated tool/API regressions; G-26 live/concurrent portions remain
- Scenario: With AST-STALE, verify requested size stock and configured option membership; missing/duplicate/obsolete rows cannot offer inventory. Confirm bypasses cache, rejects changed price/options or insufficient stock including existing bag quantities, and safely rejects missing identity/failed stock reads.
- Automation: Unlinked

### TC-AST-006-01

- Requirements: AST-03, AST-06, CNT-03, NFR-07
- Environment: website-repository-ci
- Mode: Fake-model factual renderer; actual model topic/tool selection still requires staging
- Scenario: Given policy/catalog tool output followed by malicious model text promising free returns, tomorrow delivery, INR 1 or a fake prompt disclosure, render checked-in summaries and catalog card prices only. With no tool evidence use the safe fallback. Description instructions never become response instructions or rendered descriptions.
- Automation: Unlinked

### TC-AST-008-01

- Requirements: AST-07, AST-08
- Environment: website-repository-ci
- Mode: Injected context/API coverage plus bounded browser history; real intent resolution unverified
- Scenario: Given AST-CONTEXT, ask to add the second card after the first is removed and the second repriced. Verify original ordinal positions, fresh request facts despite older process-cache data, authoritative action price, unknown-ID dropping and malformed retained reference 400. Check account/reset cleanup; separately evaluate real model ordinal resolution and history-window loss.
- Automation: Unlinked

### TC-AST-009-01

- Requirements: AST-09
- Environment: website-repository-ci
- Mode: Tool/API and mocked USD browser coverage; live exchange/rounding-boundary acceptance separate
- Scenario: Given AST-CURRENCY, a USD 20 default budget includes INR 1500/1800, excludes INR 4200; explicit INR 1600 includes only INR 1500. No dollar rate requests INR instead of guessing. Verify invalid rate/currency 400, $25 suggestion, $18 card and USD cart totals while proposal/confirmation prices remain INR. Add decimal boundary cases before display rounding.
- Automation: Unlinked

### TC-AST-010-01

- Requirements: AST-01, AST-05, AST-10
- Environment: website-repository-ci
- Mode: Injected direct-tool/API and intercepted mobile-browser scenarios; live services unverified
- Scenario: Given AST-CONTROLS, Compare selected preserves two/three unique IDs and rejects one/duplicate/four server IDs. Find similar and Retry preserve the action. Required size/color and integer 1-10 quantity gate Review bag addition; S is disabled, M/Red/2 proposes without mutating. Confirm succeeds exactly once, then View bag opens the existing drawer. Card controls use no model or key, but auth/stock checks remain. Check 3/4 UI selections and stale-card failures separately.
- Automation: Unlinked

### TC-AST-002-03

- Requirements: AST-02, AST-07
- Environment: website-repository-ci
- Mode: Local cancellation/helper/handler coverage; not proof of deployed provider cancellation
- Scenario: With an injected hanging provider, one short test deadline aborts its SDK signal and prevents late tool execution. Abort chat and confirmation Requests during provider/auth/fresh stock waits; require 504, scoped signals and no action. Server configuration is 35 seconds chat/10 confirmation; browser fallback stays 45/15. Stage real ingress disconnect propagation and whole-operation elapsed limits.
- Automation: Unlinked

### TC-CART-002-01

- Requirements: CART-02, CART-05
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given U-A and P-COLOR, when adding M/red twice and L/red once, then two lines exist with quantities 2/1 and correct subtotal.
- Automation: `tests/ecommerce/guest-boundaries.spec.ts`, `tests/ecommerce/isolated/cart-variants.spec.ts` (partial: fictional browser-cart restoration merges duplicate size/color tuples and keeps other variants distinct with correct subtotal; authenticated add behavior unverified)

### TC-CART-004-01

- Requirements: CART-04, AUTH-06, AST-04
- Environment: isolated-staging
- Mode: Baseline; historical G-10 retained; real auth acceptance separate
- Scenario: U-A quantity two and U-B quantity seven use separate browser keys. Sign-out empties/closes the bag; B sees only seven, same-account refresh retains it, A restores two and reload preserves changes. An old unowned els-cart key is removed with feedback rather than assigned to either user.
- Automation: `tests/ecommerce/isolated/account-switch.spec.ts` (Account-scoped browser ownership with fictional A/B sessions: sign-out empties/closes the bag, B sees only its bag, token refresh preserves it, A restores after switch/reload and legacy ownerless data is discarded. Real auth/database acceptance remains separate; historical G-10 evidence is archived.)

### TC-CART-004-02

- Requirements: CART-02, CART-04, CART-05
- Environment: isolated-staging
- Mode: Baseline recovery with configured SDK fixture auth
- Scenario: Given an account-scoped saved line and mixed invalid rows, loading/editing/reload preserves valid lines and totals without crashes. Missing/null colors merge and invalid JSON recovers with notice after account resolution.
- Automation: `tests/ecommerce/isolated/cart-storage-fixture.spec.ts` (browser-local mixed valid/invalid rows across eleven boundaries, edits persisted after reload, missing/empty/null color normalization and recovered tuple merging; actual provider identity transitions remain unverified; fictional account-scoped ownership is separately covered by TC-CART-004-01)

### TC-CART-004-03

- Requirements: CART-04, NFR-03
- Environment: isolated-fixture
- Mode: Baseline; browser fixture coverage
- Scenario: Block cart reads/writes without blocking fictional auth storage. Bag controls stay usable with a persistence notice; A/B/A switching restores separate in-memory bags while the page remains open. Fully unavailable browser storage shows an empty usable guest bag and notice.
- Automation: `tests/ecommerce/isolated/cart-storage-fixture.spec.ts` (controlled cart-key SecurityError read and QuotaExceededError write; visible persistence notice, bag dismissal, in-memory quantity/subtotal and removal; cross-account state unverified)

### TC-NAV-001-01

- Requirements: NAV-01, NAV-02
- Environment: public-read-only
- Mode: Baseline
- Scenario: Given desktop/mobile or reduced motion, when switching/pausing hero or scrolling away, then matching links/posters appear, only one active clip exists and hidden/offscreen/reduced-motion playback stops; each editorial destination resolves.
- Automation: `tests/ecommerce/home-hero.spec.ts`, `tests/ecommerce/home-destinations.spec.ts`, `tests/ecommerce/catalog.spec.ts`, `tests/ecommerce/seed.spec.ts` (Partial: manual selection, pause/resume, reduced-motion still imagery and timer invariance, browser-clock auto-rotation and offscreen suspension/resumption; six editorial destinations, both collection panels, blouse edit and seven homepage category hrefs. Real hidden-tab playback remains unverified.)

### TC-NAV-005-01

- Requirements: NAV-03, NAV-04, NAV-05
- Environment: public-read-only
- Mode: Baseline
- Scenario: Given keyboard/mobile navigation, when opening clothing menus or an account/cart/search drawer, then subcategory links work, Tab stays in the active dialog, Escape closes it and focus returns to the corresponding trigger, including Escape from a desktop menu link or disclosure; closed menus/drawers are inert.
- Automation: `tests/ecommerce/navigation-accessibility.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial: account/cart/search/mobile keyboard focus cycles, scroll lock, Escape and trigger restoration; mobile women/men clothing navigation and seven hrefs; desktop Women/Men keyboard disclosure, Escape focus return, inert closure and hover reopening; backdrop and additional paths unverified)

### TC-PDP-001-01

- Requirements: PDP-01, PDP-08
- Environment: isolated-fixture
- Mode: Baseline
- Scenario: Given in-stock/out-of-stock/sized/unsized products, when loading, aborting an image, hovering, focusing or touching a card, then information remains readable, failure feedback appears and only valid actions are offered.
- Automation: `tests/ecommerce/product-card-fixture.spec.ts` (Partial: controlled unsized/sized/unavailable card actions at 375/1440px, hover/focus reveal, size href, image-failure information, guest denial and emulated coarse-pointer touch quick-add. Detail galleries, physical-device behavior and live stock remain unverified.)

### TC-PDP-001-02

- Requirements: PDP-01, NFR-03
- Environment: public-read-only
- Mode: External framework regression; intermittent deployed stall cause remains unestablished
- Scenario: Select an in-stock unsized product from Women, capture its displayed name and link destination before clicking, then wait for that exact URL and assert its exact level-one heading and detail controls. A visible collection heading cannot establish readiness. Preserve quantity increase/decrease, disabled guest review-submit and guest-cart sign-in assertions. Capture failed/pending document/RSC requests, response status/timing, browser exceptions and console errors; do not substitute sleeps, forced clicks or retries.
- Automation: `tests/ecommerce/product-detail.spec.ts` (opens a product and checks quantity and review form. Reviewed coverage: partial: initial quantity one, increase to two, decrease to one on unsized product only requires sign in before adding a product to the cart. Reviewed coverage: guest-denial branch; no signed-in add/replay)

### TC-CHK-003-01

- Requirements: CHK-03
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given a valid session/address and two identical entries of quantities 10/11, when POSTing checkout, then 400 occurs and no order/stock write exists.
- Automation: Unlinked

### TC-CHK-005-01

- Requirements: CHK-05, CHK-06
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given P-UNSIZED database price 1,000 and a forged client price 1, when buying two, then saved unit price is 1,000, total 2,000 and stock 3.
- Automation: `tests/ecommerce/isolated/checkout.spec.ts` (Partial: forged browser price is omitted from checkout item payload, which sends only id/quantity/size/color; backend price recomputation and stored totals unverified.)

### TC-CHK-007-01

- Requirements: CHK-07
- Environment: isolated-staging
- Mode: Baseline; verify transaction
- Scenario: Given P-LAST stock one and two independently authenticated customers, when both buy simultaneously, then exactly one succeeds and one conflicts; stock is zero and only one complete order exists.
- Automation: Unlinked

### TC-CHK-007-02

- Requirements: CHK-06, CHK-07
- Environment: isolated-staging
- Mode: Baseline; local SQL rollback regression, staging API evidence separate
- Scenario: Given first line has stock and a later line fails inside the transaction, when checkout executes, then no order/lines/attempt remain and all inventory is unchanged. No separate API precheck exists.
- Automation: Unlinked

### TC-CHK-009-01

- Requirements: CHK-09
- Environment: isolated-staging
- Mode: Baseline contract; local SQL exceptions tested, live API/migration unverified G-08
- Scenario: Given purchase safeguards and a valid attempt key, missing/invented size or required color, a size on an unsized item, or color on a no-color/demo-photo item returns invalid-option 400 with no writes.
- Automation: Unlinked

### TC-CHK-009-02

- Requirements: CHK-09
- Environment: isolated-staging
- Mode: Baseline; local SQL regression, simultaneous live replay unverified G-14
- Scenario: Given a successful checkout, repeating the same authenticated customer/key/normalized payload returns its original order/total even after the last unit is gone, without changing counts or stock.
- Automation: Unlinked

### TC-CHK-009-03

- Requirements: CHK-09
- Environment: isolated-staging
- Mode: Baseline contract; local SQL regression, live API evidence separate
- Scenario: Given an existing key, changing normalized items, address or payment returns 409 with no writes; another customer with the same key cannot read/replay that order and instead uses their own stock/order scope.
- Automation: Unlinked

### TC-CHK-009-04

- Requirements: CHK-03, CHK-09
- Environment: isolated-staging
- Mode: Baseline; staging API validation needed
- Scenario: Given an authenticated customer, omitted/malformed Idempotency-Key, malformed UUID, nonstring or trimmed size/color lengths above 30/40 returns 400 before purchase writes; duplicate entries merge and sorted equivalent payload replays the original order.
- Automation: Unlinked

### TC-CHK-010-01

- Requirements: CHK-08, CHK-09, CHK-10, CHK-04
- Environment: isolated-staging
- Mode: Baseline; mocked browser regression, not live transaction proof
- Scenario: Given CHECKOUT-LOST for each demo method, first failure shows retry feedback, releases submit and keeps cart. Reload and re-enter identical details, then submit: same UUID key, demo confirmation, cleared cart and removed attempt storage, no delivery/email/support claim. Stored attempt contains only digest/key.
- Automation: `tests/ecommerce/isolated/checkout-recovery.spec.ts` (Mocked network loss followed by reload and explicit retry: identical payload/key, digest-only storage, cart/attempt cleanup and honest demo feedback. No backend replay or transaction acceptance.)

### TC-CHK-010-02

- Requirements: CHK-10
- Environment: isolated-staging
- Mode: Baseline contract; additional browser scenarios not executed
- Scenario: Given a retained attempt, changed customer/items/address/method generates a new key; blocked storage retains key only in memory. Closing the tab loses the reload guarantee. Malformed stored data and rapid clicks must be assessed separately.
- Automation: `tests/ecommerce/isolated/checkout-attempts.spec.ts`, `tests/ecommerce/isolated/checkout-recovery.spec.ts` (Partial: controlled pending payment blocks repeated client submits; retry keys persist across unchanged/reloaded attempts and rotate on changed details, including storage-denied fallback; missing order ID preserves bag for retry. Existing success/error feedback remains covered. Backend idempotency and persistence unverified. Fictional client attempt fingerprint changes, with A/B owner isolation; no server persistence acceptance. Malformed client attempt storage recovers on submission; mocked successful service response, not real API validation.)

### TC-PDP-003-01

- Requirements: PDP-03, PDP-04, PDP-06, RST-01
- Environment: isolated-staging
- Mode: Baseline; scoped local/intercepted UI fixtures; real UUID/API checks separate
- Scenario: P-BLOUSE-OPTIONS permits selecting sold-out S for an exact-size alert, disables add/quantity increase, and posts size S. Selecting available M hides the alert and permits quantities up to four. All-zero sizes remain selectable, whole-item Notify me is visible before selection, and purchase remains disabled. Missing rows count as unavailable.
- Automation: `tests/ecommerce/isolated/product-options.spec.ts` (Reviewed df94db9 contract migration: TC-PDP-003-01 sold-out S offers restock without purchase and available M enters browser bag. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance.)

### TC-PDP-009-01

- Requirements: PDP-09
- Environment: public-read-only
- Mode: Baseline; seven-family title/description/OG-title regression, remaining metadata cases unexecuted
- Scenario: Given one local product in each category family, detail title is name · category with zeouf suffix, description identifies product/demo and Open Graph title matches. Add collection/missing-product/image cases separately.
- Automation: Unlinked

### TC-NFR-005-01

- Requirements: NFR-05
- Environment: public-read-only
- Mode: Scoped regression; not WCAG acceptance
- Scenario: Given home, listing, detail, search, favorites, checkout, orders, privacy and terms, each renders exactly one main and no main nested within main. Newsletter field has label/description.
- Automation: Unlinked

### TC-ORD-001-01

- Requirements: ORD-01, NFR-01
- Environment: isolated-staging
- Mode: Baseline with RLS evidence
- Scenario: Given orders for U-A and U-B, when U-A reads history and attempts a direct U-B order read, then only U-A's records are accessible.
- Automation: `tests/ecommerce/account-cart-checkout.spec.ts`, `tests/ecommerce/isolated/order-history.spec.ts` (Partial: signed-out prompt plus controlled signed-in loading/empty/error recovery, current-user/date-order request filters, supplied row sequence, five statuses, accordion and deleted-product fallback. Real query ordering, ownership and database RLS unverified; native variants/address/payment rendering has separate evidence; real persisted presentation remains unverified.)

### TC-REV-004-01

- Requirements: REV-04
- Environment: isolated-staging
- Mode: Target pending live RLS/migration proof; G-04
- Scenario: Given approved and pending reviews from U-A/U-B, when a visitor or U-B loads detail and public GET with approved=false, only approved feedback contributes; U-A may read own pending row directly.
- Automation: Unlinked

### TC-REV-004-02

- Requirements: REV-01, REV-04, NFR-01
- Environment: isolated-staging
- Mode: Target live policy and API test; G-04
- Scenario: Given a customer token and public Supabase key, direct INSERT with approved=true, UPDATE approval/reply and DELETE all fail; POST /api/reviews creates only pending and validates owned image URLs.
- Automation: Unlinked

### TC-REV-003-01

- Requirements: REV-03
- Environment: isolated-fixture
- Mode: Target configured integration
- Scenario: Given a comment and optional images, failed upload/API/network requests leave the form intact and show an error; successful 201 pending clears it and shows approval feedback without adding to public count/list.
- Automation: `tests/ecommerce/isolated/reviews-restock.spec.ts` (Controlled upload/HTTP/network errors retain form/preview; pending 201 with/without image clears form with approval feedback without adding public reviews; approved-only query asserted; real writes unverified.)

### TC-REV-006-01

- Requirements: REV-05, REV-06, REV-07, ADM-02
- Environment: isolated-staging
- Mode: Injected/local browser coverage; live schema/auth/storage remains separate G-05
- Scenario: Direct route and sidebar use the same pending/approved/all queue. Verify cookie-only APIs, origin/rate limits, 200-row cap, approve/unpublish/delete confirmation, saved/removed reply reload, failed draft retention and successful legacy form 303 return.
- Automation: `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Reviewed df94db9 contract migration: TC-REV-006-01 admin review filters show pending and approved feedback with moderation controls. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance. Partial: controlled approved/pending rows from all-status admin read, no sidebar moderation buttons and visible error on failure; real signed-cookie authorization and RLS unverified. Check: TC-REV-006-01 failed admin review read reports the service error.)

### TC-REV-002-01

- Requirements: REV-02
- Environment: isolated-staging
- Mode: Target applied storage integration
- Scenario: Given U-A and existing product after the hardening migration, one to three real JPEG/PNG/WebP files within 1 byte–2 MiB return private object paths; an unauthenticated storage URL is denied and the moderator page shows ten-minute signed URLs. Empty/fourth/oversize/mismatched signature, invalid token/product and absent bucket fail.
- Automation: `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: frontend oversize exclusion, three-preview cap, removal and multipart filenames are verified with intercepted upload; actual signature validation, fourth-file rejection, private storage and signed URLs unverified.)

### TC-REV-002-02

- Requirements: REV-02, NFR-08
- Environment: isolated-staging
- Mode: Target shared limiter and retention check
- Scenario: Given U-A, the first ten valid upload requests in one day may pass and the eleventh returns 429 across separate app instances; failed review creation must not silently show a public review. Inspect orphan objects separately.
- Automation: `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: controlled 429 upload response retains review fields/preview, sends no review POST and claims no public submission; actual daily/distributed limiter unverified.)

### TC-RST-002-01

- Requirements: RST-01, RST-02
- Environment: isolated-staging
- Mode: Single-connection SQL and validation baseline; real concurrent acceptance separate
- Scenario: Same pending normalized email/options yields already_subscribed with one row, including simultaneous requests. Percent/underscore in email is literal. Reject available products/sizes and retired/invalid sizes/colors; missing configured size is unavailable.
- Automation: Unlinked

### TC-RST-004-01

- Requirements: RST-04, RST-06
- Environment: isolated-staging
- Mode: Isolated SQL/fake-provider baseline; live multi-session/provider acceptance separate
- Scenario: With S/M/whole-item requests and zero stock, restore M: claim only M and whole-item. Repeated positive saves or retired rows do not queue new alerts. Depletion before claim/preparation prevents sending. Drain over 100 mixed requests in batches of ten; claim expiry recovers a crash and stale-token completion fails. Cancellation restoring the last unit queues once.
- Automation: Unlinked

### TC-RST-005-01

- Requirements: RST-05
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given a valid alert token, when using its unsubscribe URL twice, then record is absent and both valid-shape requests return confirmation; malformed token returns 400.
- Automation: `tests/ecommerce/isolated/service-boundaries.spec.ts` (Partial: real isolated production GET/POST unsubscribe rejects missing/empty/short/long/nonhex/whitespace tokens with HTTP 400 and valid-shape tokens without service credentials with HTTP 503. No real deletion/replay/RLS acceptance.)

### TC-ADM-002-01

- Requirements: ADM-02, AOR-01, STK-01
- Environment: isolated-staging
- Mode: Baseline APIs; P0
- Scenario: Given admin_auth=1 without signed cookie, when calling admin order/stock APIs, then both deny authorization and no writes occur.
- Automation: `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Partial: actual isolated order GET and stock PATCH return 401 without a signed cookie despite legacy browser flag/cookie; placeholder runtime only, valid-admin and migrated staging permissions unverified.)

### TC-ADM-001-01

- Requirements: ADM-01, NFR-02
- Environment: isolated-staging
- Mode: Scoped local guard/cookie regressions; production provisioning and two-admin staging acceptance separate
- Scenario: Given named admins and distinct password hashes, only matching username/password pairs receive a one-hour cookie (Secure in production). DEV_CREATE_USER_KEY cannot replace named credentials in any environment. Missing/short ADMIN_SESSION_SECRET cannot sign cookies or verify tokens formerly signed with the helper key; rotating the independent secret invalidates existing cookies. Test absent hashes and missing/short secrets.
- Automation: `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Partial: both credentials required; controlled 401/429/500 give distinct feedback, clear password and never set admin flag; real hash/cookie/secret-rotation acceptance unverified.)

### TC-ADM-002-02

- Requirements: ADM-02, REV-05
- Environment: isolated-staging
- Mode: Target protected mutation
- Scenario: Given customer token or old x-dev-key without signed admin cookie, DELETE /api/admin/reviews/{id} returns 401 and review remains; a valid cookie can delete.
- Automation: `tests/ecommerce/isolated/production-denials.spec.ts` (Partial: actual local DELETE rejects fictional customer bearer and retired dev key without signed admin cookie; valid-admin deletion and real database preservation unverified.)

### TC-ADM-003-01

- Requirements: ADM-03
- Environment: isolated-staging
- Mode: Baseline; resolved G-13
- Scenario: Given a signed admin cookie, when sidebar logout succeeds, then cookie and local flag are absent, route is /admin and a private API returns 401. Failed logout retains state and allows retry. GET logout redirects 303 on the request origin; POST returns no-store JSON.
- Automation: `tests/ecommerce/isolated/admin-access-feedback.spec.ts` (Partial: mocked logout failure retains flag/route, explicit successful retry clears flag and returns to login; real signed-cookie revocation and server logout contract unverified.)

### TC-PRD-002-01

- Requirements: PRD-02, ADM-02
- Environment: isolated-staging
- Mode: Local intercepted form/API and SQL evidence; live persistence pending
- Scenario: Given a signed admin cookie and applied catalog migration, create/edit through the protected API and verify persistence on reload. A failed save keeps the form values, displays feedback and permits retry. Direct browser table writes remain denied.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: controlled HTTP/network save denial retains editor and values; explicit mock success refreshes UI; real permission policy and database persistence unverified.)

### TC-ADM-005-01

- Requirements: ADM-04, ADM-05, STK-03
- Environment: isolated-staging
- Mode: Scoped browser regression; live loading separate
- Scenario: Given A-CATALOG, dashboard shows one low-stock product, active demo value 1000 and a pending-order action that opens Orders filtered to pending. Refresh reloads data; failure shows an error, unavailable summary values and Retry. Add product opens its form.
- Automation: `tests/ecommerce/isolated/dashboard-recovery.spec.ts` (Fictional dashboard aggregates, refresh error/unavailable values, explicit retry, pending queue and Add product form. No cookie authorization or real database acceptance.)

### TC-PRD-003-01

- Requirements: PRD-03, NFR-08
- Environment: isolated-staging
- Mode: Injected validation/guard tests; production shared-limit boundary separate
- Scenario: Reject blank/long names, unsupported categories/sizes, duplicate sizes, negative or overprecision price, fractional/overflow stock, oversized descriptions and invalid/excess image URLs. Deny anonymous/cross-origin mutations before store access; test limit 60/admin/min and unavailable limiter.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: blank/whitespace product names disable Save and Cancel preserves supplied catalog without writes; server numeric validation and stored-product invariants unverified.)

### TC-PRD-004-01

- Requirements: PRD-04, NFR-01, NFR-08
- Environment: isolated-staging
- Mode: Injected upload and mocked-storage SQL guards; live storage/actual image rendering pending
- Scenario: With a signed same-origin cookie upload one JPEG/PNG/WebP up to 2 MiB; reject mismatched signatures/MIME, empty/oversized files and declared request length above 3 MiB. Check UUID public product-images path, no direct browser writes and limit 10/admin/min. Deletion does not remove orphan images.
- Automation: Unlinked

### TC-PRD-005-01

- Requirements: PRD-05, STK-04
- Environment: isolated-staging
- Mode: Single-connection SQL regression; live concurrency pending
- Scenario: Create sizes with zero stock; edit retains selected quantities, removes obsolete rows and initializes new rows at zero. Failure rolls back product and sizes together. Metadata edits after checkout preserve current stock; removing all sizes starts overall stock at zero. Test independent checkout/edit sessions separately.
- Automation: Unlinked

### TC-PRD-006-01

- Requirements: PRD-06
- Environment: isolated-staging
- Mode: SQL history preservation; live HTTP deletion/storage separate
- Scenario: Confirm deletion through cookie API; unknown product is 404 and failures remain visible. Deleted product leaves historical order quantity/price intact with null product reference; uploaded images remain public.
- Automation: Unlinked

### TC-STK-002-01

- Requirements: STK-02, ADM-04
- Environment: isolated-staging
- Mode: Baseline; local RPC aggregate tested, staging API/dashboard separate
- Scenario: Given P-SIZED S=0/M=4/L=5 after purchase safeguards, when saving M=2 through stock API, then M is 2 and aggregate 7 atomically; refresh dashboard. Obsolete rows must not inflate aggregate.
- Automation: `tests/ecommerce/isolated/stock-recovery.spec.ts` (Partial: controlled M=4 to 2 response refreshes size and aggregate 9 to 7; HTTP/network failure preserves aggregate until retry; invalid stock sends no request. Real atomic persistence and email delivery unverified.)

### TC-STK-004-01

- Requirements: STK-01, STK-02, STK-04, NFR-01
- Environment: isolated-staging
- Mode: Baseline; local API covers cookie/stock bounds/missing config, SQL covers option/product errors; live HTTP mapping separate
- Scenario: Given no signed cookie, PATCH denies 401. With cookie, negative/fraction/overflow stock and malformed UUID/type deny 400, absent service config gives 503; unknown product gives 404 and unsupported/omitted sized option gives 400 without stock changes.
- Automation: Unlinked

### TC-STK-004-02

- Requirements: STK-04, CHK-07
- Environment: isolated-staging
- Mode: Target execution; single-connection PGlite cannot establish concurrency
- Scenario: Given independent staging sessions, run last-unit purchases, simultaneous identical-key retries, crossed multi-product orders, and stock edit versus checkout; assert no oversell, duplicate order, deadlock or inconsistent configured aggregate.
- Automation: Unlinked

### TC-AOR-003-01

- Requirements: AOR-03, ORD-02
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given a pending U-A order, when admin sets processing, then persisted status and U-A history after reload show Processing.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: admin UI controlled status success and failed update retaining pending detail/list; actual persisted status and customer-history synchronization unverified.)

### TC-ANL-001-01

- Requirements: ANL-01, ANL-04, ANL-05
- Environment: isolated-staging
- Mode: Scoped fixture browser regression; live reconciliation separate
- Scenario: Given active and cancelled orders and approved/pending reviews, active demo order value, average and top-unit analytics exclude cancelled orders; ratings include only approved reviews. Metrics identify demo orders rather than actual charges. Failed/loading summaries show unavailable values.
- Automation: `tests/ecommerce/isolated/analytics-reviewed.spec.ts`, `tests/ecommerce/isolated/analytics-loading.spec.ts` (Partial: controlled pending order summaries remain unavailable and explicit failed-read retry recovers after response release; reviewed active totals/average/top-five boundaries remain separately covered. Real persisted reconciliation unverified.)

### TC-OPS-002-01

- Requirements: OPS-02, OPS-03, OPS-04, NFR-02
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given production mode, when calling test reset/seed-user and dev create-user, then first two return 404 and dev helper returns 403; no mutation occurs.
- Automation: `tests/ecommerce/isolated/production-denials.spec.ts` (Partial: actual fresh local production reset/seed helpers return 404 and dev create-user returns 403 before backend access; deployed environment/configuration and database no-mutation snapshots unverified.)

### TC-OPS-004-01

- Requirements: OPS-04, AUTH-07
- Environment: isolated-staging
- Mode: Local guards/validation regression; live successful creation/cap behavior remains separate
- Scenario: Dev helper returns 403 in production even with its correct key; in development absent/blank configured key returns 503 and missing/wrong request key returns 401. Correct key with empty input reaches validation (400); no account request occurs. Test valid keyed creation, ten-account cap and existing non-dev protection separately in isolated staging.
- Automation: Unlinked

### TC-NFR-008-01

- Requirements: NFR-08
- Environment: isolated-staging
- Mode: Target deployed/shared database; local fallback is insufficient
- Scenario: Given two app instances behind a proxy that appends/overwrites x-forwarded-for, five admin attempts under the same address/account are allowed and the sixth is 429 across instances; unavailable limiter RPC/config returns 503. Repeat for checkout/review/restock boundaries.
- Automation: `tests/ecommerce/isolated/service-boundaries.spec.ts` (Partial: real isolated production admin-login/checkout/review/upload/restock handlers fail closed with exact HTTP 503 feedback when shared limiter configuration is absent. No multi-instance counters, deployed proxy trust, RPC-failure or fifth/sixth-attempt acceptance.)

### TC-OPS-009-01

- Requirements: OPS-09, NFR-01
- Environment: isolated-staging
- Mode: Shared catalog inventory queries tested locally including permission regression; full live CLI not executed
- Scenario: Given all migrations including admin catalog, run the read-only inspector with an explicitly configured staging DATABASE_URL. Check absence of legacy checkout RPC, service-only five-argument checkout/stock/catalog RPCs, private attempts, review/order/limiter policies, denied browser catalog grants, product-images limits/guards and invalid legacy rows. Role behavior needs separate proof.
- Automation: Unlinked

### TC-OPS-010-01

- Requirements: OPS-10, CHK-05, CHK-06, CHK-07, CHK-08, CHK-09, STK-02, STK-04, NFR-01
- Environment: website-repository-ci
- Mode: Scoped local SQL regression; no simultaneous-session or live integration proof
- Scenario: Run test:purchase with no live connection. Verify price/option snapshots, replay and changed-payload denial, customer key isolation, rollback, missing/obsolete size rows, stock membership/atomic total, denied anon/customer RPC/table access and removal of old RPC.
- Automation: Unlinked

### TC-CNT-001-01

- Requirements: CNT-01
- Environment: public-read-only
- Mode: Baseline demo; local browser regression
- Scenario: Given footer form, preview limits are visible before entry and the email field is labelled; valid email displays no-save/no-send feedback and sends no subscription request.
- Automation: `tests/ecommerce/newsletter-preview.spec.ts`, `tests/ecommerce/isolated/reset-newsletter.spec.ts` (Partial: blank/malformed newsletter email fails native validation without success or writes; valid preview behavior remains separately covered. No actual subscription or delivery claim.)

### TC-CAT-003-02

- Requirements: CAT-03, CAT-05, CAT-07
- Environment: isolated-fixture
- Mode: Controlled browser fixture regression
- Scenario: Given four controlled products with two brands and positive/zero stock, when combining brand and In stock only, then matching cards/counts agree, incompatible filters produce zero cards without demo fallback, and Clear all restores the original collection.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts` (controlled brand/unsized-stock combination, visible-of-matching count including zero matches and Clear all; missing brand/size metadata selector omission; other combinations untested)

### TC-CAT-005-02

- Requirements: CAT-03, CAT-05
- Environment: isolated-fixture
- Mode: Controlled browser fixture regression; missing rows remain G-09
- Scenario: Given two controlled sized products with inverse S/M availability at stock zero/one/four, when enabling In stock only and selecting S or M, then only the product with available selected-size stock remains. Missing stock rows remain unresolved G-09.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: controlled S/M size-stock zero/one/four boundaries, positive aggregate fallback when size rows are missing, and selected-size constraints when rows exist. Live inventory remains unverified.)

### TC-AUTH-002-02

- Requirements: AUTH-02
- Environment: public-read-only
- Mode: Current baseline regression
- Scenario: Given a fresh visitor registration form with valid fictional name, email and password, when confirmation is left empty and Register is submitted, then native required-field validation keeps the form open and no account-creation request is sent.
- Automation: `tests/ecommerce/auth-confirmation-blank.spec.ts` (blank confirmation branch)

### TC-CUR-003-01

- Requirements: CUR-03
- Environment: isolated-staging
- Mode: Current baseline
- Scenario: Given a controlled USD display rate, U-A and a product with known INR price, when viewing detail, cart and order history after a demo order, then each customer display uses the shared USD formatter while stored order unit price/total and admin money remain INR; compare UI with persisted snapshots.
- Automation: `tests/ecommerce/isolated/currency-surfaces.spec.ts` (Partial: controlled USD detail, browser bag and supplied order history use shared formatter while admin supplied totals remain INR; actual checkout/order storage and persisted reconciliation unverified.)

### TC-AUTH-003-01

- Requirements: AUTH-03
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given confirmed disposable U-A, when an incorrect password is submitted, then sign-in fails without a session; when the correct password is submitted, then the panel closes, the session survives reload and a protected action becomes available. Record provider configuration and clean up U-A.
- Automation: `tests/ecommerce/isolated/auth-favorites.spec.ts` (Partial: controlled login denial retains form/panel; mock success closes panel and fake session survives reload; real credential/session acceptance unverified.)

### TC-FAV-002-01

- Requirements: FAV-02
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given distinct confirmed U-A/U-B and a favorite owned by U-A, when U-A signs out and U-B signs in in the same browser, then U-A favorites disappear from UI and U-B cannot read or mutate U-A's favorite through direct authorized requests; inspect database/RLS results and clean up both users.
- Automation: `tests/ecommerce/isolated/account-switch.spec.ts` (Partial: fictional account switch clears favorite UI, filters reads by the second user and sends their identity on insert; real sessions and database RLS remain unverified.)

### TC-CART-001-01

- Requirements: CART-01
- Environment: public-read-only
- Mode: Current baseline regression
- Scenario: Given a fresh visitor and an in-stock unsized product, when Add to bag is pressed, then the account prompt opens and the browser cart remains empty; no customer or order write occurs.
- Automation: `tests/ecommerce/cart-guest-denial.spec.ts`, `tests/ecommerce/product-detail.spec.ts` (guest-denial branch; no signed-in add/replay)

### TC-CART-001-02

- Requirements: CART-01
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given the interrupted guest add and confirmed U-A in isolated staging, when U-A signs in, then the product is not automatically added; when U-A explicitly adds it again, then one line is added and the cart drawer opens.
- Automation: `tests/ecommerce/isolated/guest-cart-resume.spec.ts` (Partial: interrupted guest add stays empty through fake sign-in; explicit add creates one browser line; real login, ownership and integration unverified.)

### TC-CART-004-04

- Requirements: CART-04, NFR-03
- Environment: public-read-only
- Mode: Current baseline regression
- Scenario: Given a fresh visitor browser context with malformed JSON in els-cart before first navigation, when the homepage hydrates and My Cart opens, then the bag is empty and a visible recovery notice appears without a crash or non-read request.
- Automation: `tests/ecommerce/isolated/cart-malformed-storage.spec.ts`, `tests/ecommerce/isolated/cart-storage-fixture.spec.ts` (partial: malformed JSON and three non-array storage values recover to an empty bag with a notice; ownership unverified)

### TC-CHK-001-01

- Requirements: CHK-01
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given a guest or expired customer token and a nonempty fixture cart, when opening checkout or POSTing the order API, then UI submission is unavailable and API returns 401 without an order or stock change. Repeat with a valid customer and empty cart for the documented empty-cart rejection.
- Automation: `tests/ecommerce/guest-boundaries.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (partial: signed-out empty and nonempty checkout disable payment and preserve browser cart; expired-token API denial and signed-in empty checkout require staging)

### TC-AOR-004-01

- Requirements: AOR-04
- Environment: isolated-staging
- Mode: Baseline characterization plus pending decision G-19
- Scenario: Given a disposable order in each lifecycle status, when an authorized admin requests each of the five status values and an unsupported value, then record accepted/rejected transitions, persisted status and inventory after cancellation. Do not assert a future transition graph or stock reversal until G-19 is decided by the product owner.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Reviewed df94db9 contract migration: TC-AOR-004-01 forward status controls reflect responses and delivered orders are terminal. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance.)

### TC-NAV-07-CORE

- Requirements: NAV-07
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given a fresh visitor, when unknown product and subcategory URLs open, then both show not-found; the admin login route omits storefront chrome.
- Automation: `tests/ecommerce/not-found-admin-shell.spec.ts` (partial: unknown product and subcategory 404 plus admin chrome absence; route refresh untested)

### TC-CAT-01-CORE

- Requirements: CAT-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given one fixture product in each of 14 database categories, when opening English main and subcategory listings, then only normalized matching products appear and women/men collections stay separate.
- Automation: `tests/ecommerce/category-membership-fixture.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial: controlled reads of 14 English categories with mixed casing; seven main and nine subcategory routes assert exact membership, counts, and Women/Men separation; database query semantics and imported Turkish labels unverified)

### TC-CAT-02-CORE

- Requirements: CAT-02
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given tagged New, Best, Featured, Populer and untagged products, when opening New Arrivals, Best Sellers and Collection, then tag-derived matches and main-category membership follow the BRD without implying sales ranking.
- Automation: `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: Women and Men English New Arrivals/Best Sellers/Collection routes select New/BEST/Featured/Populer/null tag populations with controlled GET responses. Real database membership and legacy highlight variants remain unverified; no sales ranking is inferred.)

### TC-CAT-04-CORE

- Requirements: CAT-04
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given products at, below and above known displayed-price bounds, when using min/max sliders and Under tiers, then matches are inclusive, sliders do not cross, and currency change clears bounds.
- Automation: `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/catalog-boundaries-fixture.spec.ts` (Partial: keyboard inclusive bounds/crossing clamps, visible-of-matching counts, exact Under-tier boundary and delayed USD detection clearing both populated INR bounds. Controlled GET responses only; live region/rate integration remains unverified.)

### TC-CAT-06-CORE

- Requirements: CAT-06
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given products with tied prices, dates and tags, when choosing every sort option, then low/high price, New Arrivals and Recommended follow documented tie and incoming-order rules without losing products.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/price-sorting.spec.ts` (partial: controlled low/high price ordering with name ties, Recommended incoming order, and New Arrivals new-tag/date/name precedence; live Dress price-low multiset; missing dates/tags beyond the selected fixtures unverified)

### TC-CAT-08-CORE

- Requirements: CAT-08
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given controlled product/stock responses of success, empty, 503 and delay beyond eight seconds, when opening and retrying a collection, then loading, labelled demo fallback, live-stock warning, true empty and recovery remain distinct; abandoned requests cancel.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts` (controlled product/stock 503 and pending-request timeout, loading/demo/stock-warning distinction, successful retry, empty success and navigation cancellation; fixture results do not prove backend readiness)

### TC-SEA-01-CORE

- Requirements: SEA-01
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given a visitor, when opening header Search and submitting blank, padded, ampersand and Unicode queries, then the field starts focused, blank stays put, and nonblank input is trimmed and encoded at /search?q= with the overlay closed.
- Automation: `tests/ecommerce/search-input.spec.ts` (focus, blank submit, trim/encode ampersand and Unicode, and closed search panel)

### TC-SEA-03-CORE

- Requirements: SEA-03
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Controlled search success/empty/error/hung responses distinguish no matches from failure, allow retry after the eight-second deadline, cancel obsolete queries and clear blank queries without stale cards.
- Automation: `tests/ecommerce/catalog.spec.ts`, `tests/ecommerce/search-fixture.spec.ts` (partial: no-results state for a missing query only)

### TC-PDP-02-CORE

- Requirements: PDP-02
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given P-COLOR with distinct photos and P-DEMO, when selecting color and adding with U-A, then swatch, image and cart color agree; demo-image product hides colors and shows one photo.
- Automation: `tests/ecommerce/isolated/product-options.spec.ts` (Partial: seeded demo-product single photograph without thumbnails/colors; named color, photo correspondence and real cart colors unverified.)

### TC-PDP-04-CORE

- Requirements: PDP-04
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given known size stock four, when changing detail quantity through one, four and beyond, then it starts at one, cannot decrease below one, clamps at four and disables invalid increase/add.
- Automation: `tests/ecommerce/product-detail.spec.ts`, `tests/ecommerce/isolated/product-options.spec.ts` (partial: initial quantity one, increase to two, decrease to one on unsized product only Additional isolated scope: Controlled M=4/L=5 stock, minimum one, disabled increase at stock and clamp on size change; real inventory enforcement unverified.)

### TC-PDP-05-CORE

- Requirements: PDP-05
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given clothing detail, when opening and closing Size Guide, then static XS/S/M/L chest and waist references are visible and dismissible without claiming product-specific shoe or XL/XXL guidance.
- Automation: `tests/ecommerce/isolated/product-options.spec.ts` (Static XS/S/M/L clothing chest/waist table and close action on the real isolated frontend; not shoe or XL/XXL guidance.)

### TC-PDP-06-CORE

- Requirements: PDP-06
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given supplied and fallback product information, when opening Details, Measurements, Composition/Care/Origin and Shipping/Returns panels, then only one stays open and the appropriate text appears.
- Automation: `tests/ecommerce/product-information.spec.ts` (partial: four panels open one at a time with nonempty text on one available product; supplied/fallback variants untested)

### TC-PDP-07-CORE

- Requirements: PDP-07
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given zero, one and over eight same-main-category alternatives, when viewing a product, then Complete Your Look hides for zero or shows at most eight other IDs and never the current product.
- Automation: `tests/ecommerce/isolated/product-options.spec.ts` (Partial: zero/one/twelve related fixtures, zero/one/eight cards and links, prefix/excluded-ID/limit query; live database filtering unverified.)

### TC-CUR-01-CORE

- Requirements: CUR-01
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given controlled US, India and other country headers conflicting with browser locale/time zone, when resolving storefront region, then headers take precedence, US selects USD and others INR; missing headers use documented fallback.
- Automation: `tests/ecommerce/isolated/region.spec.ts` (Partial: India/America/time-zone/language browser fallback and real isolated non-US header precedence/no-store; US server exchange-provider branch unverified.)

### TC-CUR-02-CORE

- Requirements: CUR-02
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given known INR price and positive, zero, invalid or failed USD rates, when rendering prices, then valid USD rounds to whole en-US units and invalid/failed rates fall back to en-IN INR at rate one.
- Automation: `tests/ecommerce/isolated/currency-fixture.spec.ts` (partial: one fictional browser-cart price with controlled positive, zero, invalid and failed region responses; other price surfaces and live exchange provider untested)

### TC-AUTH-01-CORE

- Requirements: AUTH-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given separate staging Supabase and controlled inbox, when registering through actual signup, then required fields/name metadata, Sign In state and provider email policy are verified; helper-created confirmed users are separate evidence.
- Automation: `tests/ecommerce/isolated/auth-favorites.spec.ts` (Partial: required name/email/password block requests; controlled signup full_name metadata and confirmation guidance; actual signup/email policy/delivery unverified.)

### TC-AUTH-04-CORE

- Requirements: AUTH-04
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given fictional values in Sign In and Register, when toggling password visibility and switching tabs without submission, then entered password stays unchanged and both tabs remain operable.
- Automation: `tests/ecommerce/auth-password-visibility.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (password visibility and Sign In/Register tab behavior without form submission)

### TC-AUTH-05-CORE

- Requirements: AUTH-05
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Request recovery for blank/valid email; verify the /reset-password redirect, non-enumerating feedback, invalid/expired/current verified sessions, matching 8–128 character passwords, failed update/retry and local sign-out. Real mailbox/redirect/provider policy needs staging.
- Automation: `tests/ecommerce/guest-boundaries.spec.ts`, `tests/ecommerce/isolated/reset-newsletter.spec.ts`, `tests/ecommerce/isolated/password-recovery.spec.ts` (Partial: controlled password-reset success sends fictional email and origin return URL; denial preserves email and allows retry. Existing blank-email guard remains covered. Real provider delivery and reset completion unverified.)

### TC-AUTH-07-CORE

- Requirements: AUTH-07
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Browser registration always uses normal Supabase signup and never calls or receives credentials for the privileged dev helper. Verify provider success/error/retry separately from keyed nonproduction tooling, production denial and real email confirmation.
- Automation: `tests/ecommerce/isolated/auth-favorites.spec.ts` (Reviewed df94db9 contract migration: TC-AUTH-07-CORE registration uses only signup on success. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance. Reviewed df94db9 contract migration: TC-AUTH-07-CORE registration uses only signup after explicit retry. Fictional browser-service responses; no hosted auth, authorization, database, delivery or transaction acceptance.)

### TC-FAV-01-CORE

- Requirements: FAV-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given U-A and a fixture product, when toggling favorite from card and detail twice, then one unique record and icon/count follow successful writes; a failed write must not falsely toggle state.
- Automation: `tests/ecommerce/isolated/auth-favorites.spec.ts` (Partial: detail heart follows locally fulfilled insert/delete and preserves state on failure; real uniqueness, card toggles, persistence and ownership unverified.)

### TC-FAV-03-CORE

- Requirements: FAV-03
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given guest and U-A with zero, one and deleted saved products, when opening Favorites or pressing a heart, then guest gets account prompt and U-A sees accurate loading, cards/count, empty state and Discover Collection link.
- Automation: `tests/ecommerce/product-card-fixture.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (partial: guest favorite prompts sign-in, stays unselected and shows empty favorites; authenticated card loading and stored favorite details require staging)

### TC-CART-03-CORE

- Requirements: CART-03
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given isolated browser cart with two variants, when opening bag and pressing plus/minus/remove, then image/name/options, quantity, line total and deletion below one match local state without server writes.
- Automation: `tests/ecommerce/isolated/cart-browser-controls.spec.ts` (browser-local two-variant drawer rendering, quantity updates, line/subtotal calculations, below-one and explicit removal; fictional data only)

### TC-CART-06-CORE

- Requirements: CART-06
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given empty and nonempty isolated browser carts, when choosing Start Shopping or Proceed to Checkout, then appropriate action appears and drawer closes on navigation; no unimplemented upper quantity cap is asserted.
- Automation: `tests/ecommerce/isolated/cart-browser-controls.spec.ts`, `tests/ecommerce/account-cart-checkout.spec.ts` (empty and nonempty drawer actions and checkout navigation; upper quantity limit remains unimplemented and unasserted)

### TC-CHK-02-CORE

- Requirements: CHK-02
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given U-A, fixture cart and isolated checkout, when each of five shipping fields is blank/whitespace or over its documented limit, then required values fail and long values truncate without invented phone/postcode format rules.
- Automation: `tests/ecommerce/isolated/checkout.spec.ts` (Partial: five blank shipping inputs prevent requests through native validation; whitespace, server limits and real checkout unverified.)

### TC-CHK-04-CORE

- Requirements: CHK-04
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given U-A and valid fixture cart, when using card_demo and cash_on_delivery in separate orders, then both are labelled simulations with no card-number field or real charge; no unsupported decline branch is claimed.
- Automation: `tests/ecommerce/isolated/checkout.spec.ts` (Partial: both simulation labels, no card-number field, selected-method payload and mocked confirmation; saved order, charges and stock unverified.)

### TC-CHK-08-CORE

- Requirements: CHK-08
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given U-A and valid cart, when checkout succeeds with order ID, then bag clears and confirmation/ID/Continue Shopping appear; API failure shows error while preserving cart for retry.
- Automation: `tests/ecommerce/isolated/checkout.spec.ts`, `tests/ecommerce/isolated/checkout-attempts.spec.ts` (Partial: controlled pending payment blocks repeated client submits; retry keys persist across unchanged/reloaded attempts and rotate on changed details, including storage-denied fallback; missing order ID preserves bag for retry. Existing success/error feedback remains covered. Backend idempotency and persistence unverified.)

### TC-ORD-03-CORE

- Requirements: ORD-03
- Environment: isolated-staging
- Mode: Current reviewed contract; historical G-07 retained separately
- Scenario: Given persisted size/color/address/payment snapshots, customer history and the admin detail dialog show the actual stored values after reload, with honest absent-field and deleted-product fallbacks. Native fixtures cover presentation; real persisted reads and authorization require staging.
- Automation: Unlinked

### TC-REV-07-CORE

- Requirements: REV-07
- Environment: isolated-staging
- Mode: Current reviewed contract; historical G-05 retained separately
- Scenario: Use the shared moderation queue to save/remove bounded replies, retain failed drafts and verify reload. Only approved review replies appear publicly. Native injected/UI checks are separate from real migration, cookie/limiter, signing and customer-read acceptance.
- Automation: Unlinked

### TC-RST-01-CORE

- Requirements: RST-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Request unavailable products or selected unavailable configured sizes with valid/invalid email/options. Purchase stays disabled for unavailable size; currently available options return 409, unknown products 404 and unconfigured service 503. Verify normalized persisted requests and subscription/stock races in staging.
- Automation: `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: invalid email blocks requests; controlled HTTP/network errors retain email for retry; outgoing product/options checked; API validation and storage unverified.)

### TC-RST-03-CORE

- Requirements: RST-03
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given staging with mail enabled then disabled, when saving a restock request, then response/UI distinguishes configurations and pending request persists when delivery is disabled.
- Automation: `tests/ecommerce/isolated/reviews-restock.spec.ts` (Partial: mocked configured/unconfigured mail responses select distinct feedback and clear email; real mail and subscription persistence unverified.)

### TC-PRD-01-CORE

- Requirements: PRD-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given admin and products with varied names/categories/dates, when combining mixed-case name search and exact category filter, then newest-first matching rows or distinct no-match state appear.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: admin mixed-case name/exact category filtering, no-match and incoming response order; actual API newest ordering and persisted catalog unverified.)

### TC-PRD-04-CORE

- Requirements: PRD-04
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given admin and disposable product, when appending pasted URL or one upload and removing main image, then first remaining image becomes main after reload and product-images bucket behavior is verified.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: pasted-image preview, main-image removal and promoted image_url/images payload; actual upload bucket and saved images unverified.)

### TC-PRD-05-CORE

- Requirements: PRD-05
- Environment: isolated-staging
- Mode: Current reviewed atomic catalog contract; live concurrency remains open
- Scenario: Create sized products with zero-stock rows, retain selected quantities when editing, remove retired sizes and initialize new ones at zero. Verify aggregate consistency, rollback and metadata edits after depletion; native single-connection SQL is separate from staging concurrency and seed repair.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: new S/M form serializes selected sizes and zero overall stock; database stock-row initialization, editing and aggregate synchronization unverified.)

### TC-PRD-06-CORE

- Requirements: PRD-06
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given admin and disposable product with dependent records/order snapshot, when confirming Delete, then product/dependents disappear and historical price/quantity survive; cancel or permission failure leaves product unchanged.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: cancel sends no request; mocked delete failure preserves row and explicit successful retry removes it; real cascade and historical order snapshots unverified.)

### TC-STK-03-CORE

- Requirements: STK-03
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given stock 0, 1, 4 and 5 fixtures, when admin opens stock and dashboard, then rows say Out/Low/Available at boundaries and dashboard low count matches documented sized-product-only baseline.
- Automation: `tests/ecommerce/isolated/admin-catalog.spec.ts` (Partial: four sized 0/1/4/5 rows show Out/Low/Low/Available and dashboard count/units agree; unsized low-stock semantics and live inventory unverified.)

### TC-AOR-02-CORE

- Requirements: AOR-02
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given orders with distinct IDs, customers and statuses, when admin searches mixed case and filters exact status, then matching rows appear and no orders differs from no matches.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: controlled orders support mixed-case customer/order search with exact status, no-match versus empty response; real order ownership/data unverified.)

### TC-USR-01-CORE

- Requirements: USR-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given admin and over 200 profiles, when opening Users/API, then at most 200 updated_at-ordered ID/name/time rows appear and unauthenticated API read is denied.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: controlled profile IDs/names, null placeholders and supplied order; actual 200-row API cap, updated_at ordering and authorization unverified; View action untested.)

### TC-USR-02-CORE

- Requirements: USR-02
- Environment: isolated-staging
- Mode: Current reviewed profile dialog; historical G-20 retained separately
- Scenario: User View opens a read-only native profile dialog with name/ID/update-time fallbacks. Escape/Close restores focus; View customer orders opens an exact-customer search. Verify failed profile reads/retry and real permissions separately; email/edit/disable/delete remain unsupported.
- Automation: Unlinked

### TC-ANL-02-CORE

- Requirements: ANL-02
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given orders in all five statuses, when admin opens analytics, then each pipeline count and rounded percent matches loaded data; rounded percentages need not sum to 100.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: zero/six controlled orders produce exact five-status counts and rounded percentages, including rounding beyond a total of 100; live data unverified.)

### TC-ANL-03-CORE

- Requirements: ANL-03
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given sized/unsized fixture products, when admin opens inventory health, then healthy=max(products-low-out,0) and low/out counts/units use documented stock sources.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts`, `tests/ecommerce/isolated/analytics-loading.spec.ts` (Partial: controlled pending product response keeps stock units unavailable until loaded; sized/unsized inventory boundaries remain separately covered. Real inventory reconciliation unverified.)

### TC-ANL-05-CORE

- Requirements: ANL-05
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given approved/pending reviews, when admin opens customer signal, then count and one-decimal mean use all loaded reviews and zero when empty; do not call it approved-only sentiment.
- Automation: `tests/ecommerce/isolated/analytics-reviewed.spec.ts`, `tests/ecommerce/isolated/analytics-loading.spec.ts` (Partial: controlled pending review response keeps rating/count unavailable until loaded; reviewed approved-only population boundaries remain separately covered. Real authorized data reconciliation unverified.)

### TC-SET-01-CORE

- Requirements: SET-01
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given admin, when opening Settings, then identity and catalog/category counts appear; database label is static and no save, feature-toggle or live-health behavior is claimed.
- Automation: `tests/ecommerce/isolated/admin-orders-insights.spec.ts` (Partial: identity, catalog/category counts, static database label and absence of save buttons with controlled reads; no live connection-health claim.)

### TC-CNT-02-CORE

- Requirements: CNT-02
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given visitor, when following footer categories, favorites, privacy, terms, GitHub and return-home links, then destinations and external attributes match BRD without writes.
- Automation: `tests/ecommerce/footer-content.spec.ts`, `tests/ecommerce/legal.spec.ts` (footer hrefs and GitHub attributes; privacy/terms navigation and return-home links; category targets checked as hrefs only)

### TC-CNT-03-CORE

- Requirements: CNT-03
- Environment: public-read-only
- Mode: Current demo-content review; attribution gap G-22 remains
- Scenario: Check current demo/no-charge/no-shipment/no-support and data/assistant-memory/provider disclosures across home/detail/checkout/history/privacy/terms/footer. Historical fulfillment-copy findings stay archived; remaining attribution/license inconsistency is G-22.
- Automation: `tests/ecommerce/footer-content.spec.ts` (Current home/guest-checkout/privacy/terms demo copy slices; historical fulfillment promises corrected in reviewed source. Attribution/license inconsistency remains G-22; assistant/provider/data disclosures still require full review.)

### TC-CNT-04-CORE

- Requirements: CNT-04
- Environment: manual-review
- Mode: Out of current UI scope
- Scenario: Confirm countdown is not mounted and exclude it from current UI acceptance. If owner enables it, use controlled clock for local 31 Dec 2026 boundary/zero clamp without a discount claim.
- Automation: Unlinked

### TC-OPS-01-CORE

- Requirements: OPS-01
- Environment: public-read-only
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given public GET /api/health, when requested, then status is ok and timestamp parses; do not infer database readiness.
- Automation: `tests/ecommerce/api/public-api.spec.ts`, `tests/ecommerce/guest-boundaries.spec.ts` (full public health JSON shape and parseable timestamp; no database readiness inference)

### TC-OPS-05-CORE

- Requirements: OPS-05
- Environment: isolated-fixture
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given local app with/without base schema text, when schema endpoint or error-copy action runs, then plain SQL or not-found and clipboard failure are reported; no migration repair is implied.
- Automation: `tests/ecommerce/guest-boundaries.spec.ts` (partial: GET schema contract checks plain SQL when available or explicit 404 when absent on the current build; controlled local file removal and clipboard failure still need local runtime fixtures)

### TC-OPS-06-CORE

- Requirements: OPS-06
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given controlled requirements-source diff, when website docs test/check/sync/review run, then stale source fails build/lint, manual CSV fields survive, retired IDs archive and affected results need retest; review never marks passed.
- Automation: Unlinked

### TC-OPS-07-CORE

- Requirements: OPS-07
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given Zeouf website repo without live Supabase/mail keys, when test:ui and test:catalog run sequentially, then fixture servers/cache/artifacts stay isolated and mocks do not become live integration evidence.
- Automation: Unlinked

### TC-OPS-08-CORE

- Requirements: OPS-08
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given public HTTP(S) origin, when website test:live runs, then no local server launches, browsing routes work and write attempts fail; attribute results to deployed revision, not auth/order/email acceptance.
- Automation: Unlinked

### TC-NFR-04-CORE

- Requirements: NFR-04
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given agreed Chromium/Firefox/WebKit and 375/768/1440px viewports, when traversing nav/catalog/detail/admin, then essential controls stay operable without clipping; capture browser/viewport/build.
- Automation: `tests/ecommerce/navigation-accessibility.spec.ts` (partial: homepage and open empty bag without horizontal overflow at 375/768/1440px in Chromium; essential empty-bag action within viewport; catalog/detail/admin and Firefox/WebKit unverified)

### TC-NFR-05-CORE

- Requirements: NFR-05
- Environment: isolated-staging
- Mode: Proposed quality target
- Scenario: Given proposed WCAG 2.2 AA target, when auditing representative routes/dialogs with keyboard, screen reader and axe, then labels, focus, contrast, announcements and reduced motion are reviewed; axe pass alone is not conformance.
- Automation: `tests/ecommerce/navigation-accessibility.spec.ts` (partial: existing dialog focus containment, Escape and focus restoration plus desktop disclosure keyboard behavior; screen readers, automated WCAG audit, remaining pages and full WCAG 2.2 acceptance unverified)

### TC-NFR-06-CORE

- Requirements: NFR-06
- Environment: isolated-staging
- Mode: Target pending SLA
- Scenario: Given approved build, dataset, device/network and budget, when measuring key pages and representative load, then compare repeatable metrics to agreed thresholds; invent no current SLA.
- Automation: Unlinked

### TC-NFR-07-CORE

- Requirements: NFR-07
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Given public demo copy and staging analytics/stock/mail data, when inspecting claims and concurrent order/notification paths, then claims/metric population match capability and no false success or unsafe state appears.
- Automation: Unlinked

### TC-AOR-04-CORE

- Requirements: AOR-04
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Verify forward and terminal status transitions, repeated status idempotency, pre-shipment cancellation restoring each configured variant once, rollback on incompatible options, deleted and historical rows, and real independent-session races.
- Automation: Unlinked

### TC-RST-06-CORE

- Requirements: RST-06
- Environment: isolated-staging
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Use isolated SQL and fake-provider fixtures for durable exact payloads, stable provider keys, retry/backoff/lease recovery, permanent errors and 23-hour parking; verify scheduler credentials, separate admin authority and live sandbox delivery only in configured staging.
- Automation: Unlinked

### TC-PDP-10-CORE

- Requirements: PDP-10
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Audit all 280 originals and 243 versioned portrait replacements; preserve high-resolution/external URLs and saved bag records, inspect mobile/desktop actual and synthetic photos, provenance, hover, failures and manifest integrity.
- Automation: Unlinked

### TC-OPS-11-CORE

- Requirements: OPS-11
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Inspect read-only storefront audit output and its documented scope without promoting a structural or fixture pass to full acceptance.
- Automation: Unlinked

### TC-AST-11-CORE

- Requirements: AST-11
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Use the native assistant browser fixtures to verify reduced motion, inert close and immediate reopen, 320/390px layout, simulated keyboard viewport, multiline composer and reader-follow/resume behavior. Keep actual mobile keyboard and assistive-technology acceptance separate.
- Automation: Unlinked

### TC-AST-12-CORE

- Requirements: AST-12
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: With injected current catalog facts, verify bounded material, care negation, fit, measurements, features and fresh ordinal answers; reject instruction-bearing fields, qualify name hints and retain Not listed for absent evidence. Real provider topic selection and catalog truth remain separate.
- Automation: Unlinked

### TC-AST-13-CORE

- Requirements: AST-13
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Use native injected tools and browser fixtures for two/three unique products, duplicate/removed rejection, fresh ordered prices, INR/USD precision, missing attributes, size/budget rows and accessible mobile comparison navigation. Do not infer quality or comfort rankings.
- Automation: Unlinked

### TC-AST-14-CORE

- Requirements: AST-14
- Environment: website-repository-ci
- Mode: Current reviewed contract; integration acceptance remains separate
- Scenario: Use native preference/parser/API and browser fixtures to verify refinements, denominations, exclusions/null removals, family switches, validation, bounded-history retention, clearing/retry and identity/reset cleanup without persistent profiling. Real provider interpretation remains unverified.
- Automation: Unlinked

Read `case-catalog.json` for the source acceptance text and QA focus.
