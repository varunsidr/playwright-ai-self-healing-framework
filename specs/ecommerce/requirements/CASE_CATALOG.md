# Zeouf requirement-to-case catalog

Source: Zeouf BRD v1.5 and QA guide snapshot from website commit 481a090.

This is a **first-pass planning inventory**, not an execution report: 116 requirements map to 108 case records. 40 cases come from the QA guide; 68 are curated additions; 0 are requirement-backed placeholders. Scenarios still need tester review and may need more boundary cases, fixtures and detailed steps. Existing automation is not counted as verified coverage until linked and reviewed.

| Case ID         | Requirements                   | Priority | Environment           | Design          | Automation                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------ | -------- | --------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-NAV-006-01   | NAV-06                         | P1       | public-read-only      | guide-specified | `tests/ecommerce/legacy-category-redirects.spec.ts` (partial: three representative legacy category routes, not every mapped path)                                                                                                                                                                                                                                            |
| TC-CAT-005-01   | CAT-03, CAT-05                 | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CAT-007-01   | CAT-07                         | P1       | isolated-fixture      | guide-specified | `tests/ecommerce/catalog-fixture.spec.ts` (partial/mixed: controlled 0/1/24/25/48/49 collection counts, 24-item reveal batches and final button absence; deployed count drift stops 25/48/49 cases before later reveal assertions; live dataset not required)                                                                                                                |
| TC-SEA-002-01   | SEA-02                         | P1       | isolated-fixture      | guide-specified | `tests/ecommerce/search-fixture.spec.ts` (controlled mixed-case name/category request union, both-match ID deduplication and unrelated-product exclusion; actual database query behavior unverified)                                                                                                                                                                         |
| TC-AUTH-002-01  | AUTH-02                        | P0       | isolated-staging      | guide-specified | `tests/ecommerce/auth-confirmation-mismatch.spec.ts` (partial: mismatch branch only)                                                                                                                                                                                                                                                                                         |
| TC-CART-002-01  | CART-02, CART-05               | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CART-004-01  | CART-04, AUTH-06               | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CART-004-02  | CART-02, CART-04, CART-05      | P1, P0   | isolated-staging      | guide-specified | `tests/ecommerce/cart-storage-fixture.spec.ts` (browser-local mixed valid/invalid rows across eleven boundaries, edits persisted after reload, missing/empty/null color normalization and recovered tuple merging; account ownership remains unverified G-10)                                                                                                                |
| TC-CART-004-03  | CART-04, NFR-03                | P0, P1   | isolated-fixture      | guide-specified | `tests/ecommerce/cart-storage-fixture.spec.ts` (controlled cart-key SecurityError read and QuotaExceededError write; visible persistence notice, bag dismissal, in-memory quantity/subtotal and removal; cross-account state unverified)                                                                                                                                     |
| TC-NAV-001-01   | NAV-01, NAV-02                 | P1       | public-read-only      | guide-specified | `tests/ecommerce/home-hero.spec.ts`, `tests/ecommerce/home-destinations.spec.ts` (partial: manual women/men selection, pause and reduced-motion still media; all six editorial destinations, both collection panels and blouse edit resolve; seven homepage category hrefs checked; timed/offscreen/hidden playback untested)                                                |
| TC-NAV-005-01   | NAV-03, NAV-04, NAV-05         | P1       | public-read-only      | guide-specified | `tests/ecommerce/navigation-accessibility.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial/mixed: account/cart/search/mobile keyboard focus cycles, scroll lock, Escape and trigger restoration; mobile women/men clothing navigation and seven hrefs; desktop keyboard disclosure closes/inerts but loses focus to BODY; backdrop and additional paths unverified)      |
| TC-PDP-001-01   | PDP-01, PDP-08                 | P1       | isolated-fixture      | guide-specified | `tests/ecommerce/product-card-fixture.spec.ts` (partial: controlled unsized/sized/out-of-stock card actions at 375/1440px, hover/focus reveal, size href, image failure with readable name/price/link, and guest add denial; detail gallery, genuine touch device and live stock unverified)                                                                                 |
| TC-CHK-003-01   | CHK-03                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-005-01   | CHK-05, CHK-06                 | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-007-01   | CHK-07                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-007-02   | CHK-06, CHK-07                 | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-009-01   | CHK-09                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-009-02   | CHK-09                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ORD-001-01   | ORD-01, NFR-01                 | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-004-01   | REV-04                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-004-02   | REV-01, REV-04, NFR-01         | P1, P0   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-003-01   | REV-03                         | P1       | isolated-fixture      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-006-01   | REV-06, ADM-02                 | P1, P0   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-002-01   | REV-02                         | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-002-02   | REV-02, NFR-08                 | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-RST-002-01   | RST-02                         | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-RST-004-01   | RST-04                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-RST-005-01   | RST-05                         | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ADM-002-01   | ADM-02, AOR-01, STK-01         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ADM-001-01   | ADM-01, NFR-02                 | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ADM-002-02   | ADM-02, REV-05                 | P0, P1   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ADM-003-01   | ADM-03                         | P0       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PRD-002-01   | PRD-02, ADM-02                 | P1, P0   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-STK-002-01   | STK-02, ADM-04                 | P0, P1   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-AOR-003-01   | AOR-03, ORD-02                 | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ANL-001-01   | ANL-01, ANL-04                 | P1, P2   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-OPS-002-01   | OPS-02, OPS-03, OPS-04, NFR-02 | P0, P1   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-NFR-008-01   | NFR-08                         | P1       | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-OPS-009-01   | OPS-09, NFR-01                 | P1, P0   | isolated-staging      | guide-specified | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CNT-001-01   | CNT-01                         | P1       | public-read-only      | guide-specified | `tests/ecommerce/newsletter-preview.spec.ts` (partial: valid email preview and no write; invalid email validation untested)                                                                                                                                                                                                                                                  |
| TC-CAT-003-02   | CAT-03, CAT-05, CAT-07         | P1       | isolated-fixture      | curated         | `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts` (controlled brand/unsized-stock combination, zero matches, count and Clear all; missing brand/size metadata selector omission; current count contract drift can stop the combined-filter case; other combinations untested)                                                 |
| TC-CAT-005-02   | CAT-03, CAT-05                 | P1       | isolated-fixture      | curated         | `tests/ecommerce/catalog-fixture.spec.ts` (controlled S/M size-stock zero/one/four filter boundaries; missing stock rows and live inventory unverified)                                                                                                                                                                                                                      |
| TC-AUTH-002-02  | AUTH-02                        | P0       | public-read-only      | curated         | `tests/ecommerce/auth-confirmation-blank.spec.ts` (blank confirmation branch)                                                                                                                                                                                                                                                                                                |
| TC-PDP-003-01   | PDP-03                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CUR-003-01   | CUR-03                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-AUTH-003-01  | AUTH-03                        | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-FAV-002-01   | FAV-02                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CART-001-01  | CART-01                        | P0       | public-read-only      | curated         | `tests/ecommerce/cart-guest-denial.spec.ts` (guest-denial branch; no signed-in add/replay)                                                                                                                                                                                                                                                                                   |
| TC-CART-001-02  | CART-01                        | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CART-004-04  | CART-04, NFR-03                | P0, P1   | public-read-only      | curated         | `tests/ecommerce/cart-malformed-storage.spec.ts` (malformed JSON recovery only)                                                                                                                                                                                                                                                                                              |
| TC-CHK-001-01   | CHK-01                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PRD-003-01   | PRD-03                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-STK-004-01   | STK-04                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-AOR-004-01   | AOR-04                         | P0       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-NAV-07-CORE  | NAV-07                         | P1       | public-read-only      | curated         | `tests/ecommerce/not-found-admin-shell.spec.ts` (partial: unknown product and subcategory 404 plus admin chrome absence; route refresh untested)                                                                                                                                                                                                                             |
| TC-CAT-01-CORE  | CAT-01                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CAT-02-CORE  | CAT-02                         | P1       | isolated-staging      | curated         | `tests/ecommerce/catalog-refinements-fixture.spec.ts` (partial: Women's New Arrivals, Best Sellers and Collection with New/BEST/Featured/Populer/null tags in controlled GET fixtures; Men and real database membership unverified)                                                                                                                                          |
| TC-CAT-04-CORE  | CAT-04                         | P1       | isolated-staging      | curated         | `tests/ecommerce/catalog-refinements-fixture.spec.ts` (partial/mixed: keyboard inclusive price bounds and crossing clamps plus exact Under-tier boundary; the keyboard case currently fails the CAT-07 collection-total expectation before later clamp steps; currency change reset unverified)                                                                              |
| TC-CAT-06-CORE  | CAT-06                         | P1       | isolated-staging      | curated         | `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/price-sorting.spec.ts` (partial: controlled low/high price ordering with name ties, Recommended incoming order, and New Arrivals new-tag/date/name precedence; live Dress price-low multiset; missing dates/tags beyond the selected fixtures unverified) |
| TC-CAT-08-CORE  | CAT-08                         | P1       | isolated-fixture      | curated         | `tests/ecommerce/catalog-fixture.spec.ts` (controlled product/stock 503 and pending-request timeout, loading/demo/stock-warning distinction, successful retry, empty success and navigation cancellation; fixture results do not prove backend readiness)                                                                                                                    |
| TC-SEA-01-CORE  | SEA-01                         | P1       | public-read-only      | curated         | `tests/ecommerce/search-input.spec.ts` (focus, blank submit, trim/encode ampersand and Unicode, and closed search panel)                                                                                                                                                                                                                                                     |
| TC-SEA-03-CORE  | SEA-03                         | P2       | isolated-fixture      | curated         | `tests/ecommerce/catalog.spec.ts` (partial: no-results state for a missing query only)                                                                                                                                                                                                                                                                                       |
| TC-PDP-02-CORE  | PDP-02                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PDP-04-CORE  | PDP-04                         | P1       | isolated-staging      | curated         | `tests/ecommerce/product-detail.spec.ts` (partial: initial quantity one, increase to two, decrease to one on unsized product only)                                                                                                                                                                                                                                           |
| TC-PDP-05-CORE  | PDP-05                         | P2       | isolated-fixture      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PDP-06-CORE  | PDP-06                         | P2       | public-read-only      | curated         | `tests/ecommerce/product-information.spec.ts` (partial: four panels open one at a time with nonempty text on one available product; supplied/fallback variants untested)                                                                                                                                                                                                     |
| TC-PDP-07-CORE  | PDP-07                         | P2       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CUR-01-CORE  | CUR-01                         | P1       | isolated-fixture      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CUR-02-CORE  | CUR-02                         | P1       | isolated-fixture      | curated         | `tests/ecommerce/currency-fixture.spec.ts` (partial: one fictional browser-cart price with controlled positive, zero, invalid and failed region responses; other price surfaces and live exchange provider untested)                                                                                                                                                         |
| TC-AUTH-01-CORE | AUTH-01                        | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-AUTH-04-CORE | AUTH-04                        | P1       | public-read-only      | curated         | `tests/ecommerce/auth-password-visibility.spec.ts` (password visibility and Sign In/Register tab behavior without form submission)                                                                                                                                                                                                                                           |
| TC-AUTH-05-CORE | AUTH-05                        | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-AUTH-07-CORE | AUTH-07                        | P1       | isolated-fixture      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-FAV-01-CORE  | FAV-01                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-FAV-03-CORE  | FAV-03                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CART-03-CORE | CART-03                        | P1       | public-read-only      | curated         | `tests/ecommerce/cart-browser-controls.spec.ts` (browser-local two-variant drawer rendering, quantity updates, line/subtotal calculations, below-one and explicit removal; fictional data only)                                                                                                                                                                              |
| TC-CART-06-CORE | CART-06                        | P1       | public-read-only      | curated         | `tests/ecommerce/cart-browser-controls.spec.ts` (empty and nonempty drawer actions and checkout navigation; upper quantity limit remains unimplemented and unasserted)                                                                                                                                                                                                       |
| TC-CHK-02-CORE  | CHK-02                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-04-CORE  | CHK-04                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CHK-08-CORE  | CHK-08                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ORD-03-CORE  | ORD-03                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-REV-07-CORE  | REV-07                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-RST-01-CORE  | RST-01                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-RST-03-CORE  | RST-03                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PRD-01-CORE  | PRD-01                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PRD-04-CORE  | PRD-04                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PRD-05-CORE  | PRD-05                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-PRD-06-CORE  | PRD-06                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-STK-03-CORE  | STK-03                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-AOR-02-CORE  | AOR-02                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-USR-01-CORE  | USR-01                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-USR-02-CORE  | USR-02                         | P2       | manual-review         | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ANL-02-CORE  | ANL-02                         | P2       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ANL-03-CORE  | ANL-03                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-ANL-05-CORE  | ANL-05                         | P2       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-SET-01-CORE  | SET-01                         | P2       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-CNT-02-CORE  | CNT-02                         | P1       | public-read-only      | curated         | `tests/ecommerce/footer-content.spec.ts` (footer hrefs and GitHub attributes; privacy/terms navigation and return-home links; category targets checked as hrefs only)                                                                                                                                                                                                        |
| TC-CNT-03-CORE  | CNT-03                         | P1       | public-read-only      | curated         | `tests/ecommerce/footer-content.spec.ts` (partial: current home, guest checkout, privacy and terms demo wording; known G-22 copy conflicts remain open)                                                                                                                                                                                                                      |
| TC-CNT-04-CORE  | CNT-04                         | P2       | manual-review         | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-OPS-01-CORE  | OPS-01                         | P2       | public-read-only      | curated         | `tests/ecommerce/api/public-api.spec.ts` (full public health JSON shape and parseable timestamp; no database readiness inference)                                                                                                                                                                                                                                            |
| TC-OPS-05-CORE  | OPS-05                         | P2       | isolated-fixture      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-OPS-06-CORE  | OPS-06                         | P1       | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-OPS-07-CORE  | OPS-07                         | P1       | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-OPS-08-CORE  | OPS-08                         | P1       | website-repository-ci | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-NFR-04-CORE  | NFR-04                         | P1       | isolated-staging      | curated         | `tests/ecommerce/navigation-accessibility.spec.ts` (partial: homepage and open empty bag without horizontal overflow at 375/768/1440px in Chromium; essential empty-bag action within viewport; catalog/detail/admin and Firefox/WebKit unverified)                                                                                                                          |
| TC-NFR-05-CORE  | NFR-05                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-NFR-06-CORE  | NFR-06                         | P2       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |
| TC-NFR-07-CORE  | NFR-07                         | P1       | isolated-staging      | curated         | Unlinked                                                                                                                                                                                                                                                                                                                                                                     |

## Case scenarios

### TC-NAV-006-01

- Requirements: NAV-06
- Environment: public-read-only
- Mode: Baseline
- Scenario: Given a clean browser, when opening /kadin/elbise, then navigation reaches /women/dress and shows Dress listing; repeat for mapped legacy paths.
- Automation: `tests/ecommerce/legacy-category-redirects.spec.ts` (partial: three representative legacy category routes, not every mapped path)

### TC-CAT-005-01

- Requirements: CAT-03, CAT-05
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given P-SIZED and selected S with In stock only, when filters apply, then this product is excluded; selected M includes it.
- Automation: Unlinked

### TC-CAT-007-01

- Requirements: CAT-07
- Environment: isolated-fixture
- Mode: Baseline
- Scenario: Given 49 matching products, when listing opens and Load More is clicked twice, then visible counts are 24/48/49 and the final button is absent.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts` (partial/mixed: controlled 0/1/24/25/48/49 collection counts, 24-item reveal batches and final button absence; deployed count drift stops 25/48/49 cases before later reveal assertions; live dataset not required)

### TC-SEA-002-01

- Requirements: SEA-02
- Environment: isolated-fixture
- Mode: Baseline
- Scenario: Given a product matching both name and category query, when searching different-case text, then it occurs once in results.
- Automation: `tests/ecommerce/search-fixture.spec.ts` (controlled mixed-case name/category request union, both-match ID deduplication and unrelated-product exclusion; actual database query behavior unverified)

### TC-AUTH-002-01

- Requirements: AUTH-02
- Environment: isolated-staging
- Mode: Baseline; resolved G-01
- Scenario: Given password A and confirmation B, when submitting, then mismatch alert appears and neither helper nor signup runs. Blank confirmation is required; matching values proceed without sending confirmation and clear it after success/tab change.
- Automation: `tests/ecommerce/auth-confirmation-mismatch.spec.ts` (partial: mismatch branch only)

### TC-CART-002-01

- Requirements: CART-02, CART-05
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given U-A and P-COLOR, when adding M/red twice and L/red once, then two lines exist with quantities 2/1 and correct subtotal.
- Automation: Unlinked

### TC-CART-004-01

- Requirements: CART-04, AUTH-06
- Environment: isolated-staging
- Mode: Baseline finding plus pending target; G-10
- Scenario: Given U-A's stored cart, when signing out and signing in as U-B in the same browser, then record the current shared cart; separately test the owner-approved account separation target.
- Automation: Unlinked

### TC-CART-004-02

- Requirements: CART-02, CART-04, CART-05
- Environment: isolated-staging
- Mode: Baseline recovery; account ownership remains G-10
- Scenario: Given a saved line and mixed invalid rows, when loading and editing quantity then reloading, then valid items/totals persist and invalid rows do not crash rendering. Missing/null color variants merge; invalid JSON recovers with notice.
- Automation: `tests/ecommerce/cart-storage-fixture.spec.ts` (browser-local mixed valid/invalid rows across eleven boundaries, edits persisted after reload, missing/empty/null color normalization and recovered tuple merging; account ownership remains unverified G-10)

### TC-CART-004-03

- Requirements: CART-04, NFR-03
- Environment: isolated-fixture
- Mode: Baseline
- Scenario: Given blocked reads or full/unavailable writes, when loading and using the bag, then in-memory controls remain usable and a persistence notice appears.
- Automation: `tests/ecommerce/cart-storage-fixture.spec.ts` (controlled cart-key SecurityError read and QuotaExceededError write; visible persistence notice, bag dismissal, in-memory quantity/subtotal and removal; cross-account state unverified)

### TC-NAV-001-01

- Requirements: NAV-01, NAV-02
- Environment: public-read-only
- Mode: Baseline
- Scenario: Given desktop/mobile or reduced motion, when switching/pausing hero or scrolling away, then matching links/posters appear, only one active clip exists and hidden/offscreen/reduced-motion playback stops; each editorial destination resolves.
- Automation: `tests/ecommerce/home-hero.spec.ts`, `tests/ecommerce/home-destinations.spec.ts` (partial: manual women/men selection, pause and reduced-motion still media; all six editorial destinations, both collection panels and blouse edit resolve; seven homepage category hrefs checked; timed/offscreen/hidden playback untested)

### TC-NAV-005-01

- Requirements: NAV-03, NAV-04, NAV-05
- Environment: public-read-only
- Mode: Baseline
- Scenario: Given keyboard/mobile navigation, when opening clothing menus or an account/cart/search drawer, then subcategory links work, Tab stays in the active dialog, Escape closes it and focus returns to the trigger; closed drawers are inert.
- Automation: `tests/ecommerce/navigation-accessibility.spec.ts`, `tests/ecommerce/catalog.spec.ts` (partial/mixed: account/cart/search/mobile keyboard focus cycles, scroll lock, Escape and trigger restoration; mobile women/men clothing navigation and seven hrefs; desktop keyboard disclosure closes/inerts but loses focus to BODY; backdrop and additional paths unverified)

### TC-PDP-001-01

- Requirements: PDP-01, PDP-08
- Environment: isolated-fixture
- Mode: Baseline
- Scenario: Given in-stock/out-of-stock/sized/unsized products, when loading, aborting an image, hovering, focusing or touching a card, then information remains readable, failure feedback appears and only valid actions are offered.
- Automation: `tests/ecommerce/product-card-fixture.spec.ts` (partial: controlled unsized/sized/out-of-stock card actions at 375/1440px, hover/focus reveal, size href, image failure with readable name/price/link, and guest add denial; detail gallery, genuine touch device and live stock unverified)

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
- Automation: Unlinked

### TC-CHK-007-01

- Requirements: CHK-07
- Environment: isolated-staging
- Mode: Baseline; verify transaction
- Scenario: Given P-LAST stock one and two independently authenticated customers, when both buy simultaneously, then exactly one succeeds and one conflicts; stock is zero and only one complete order exists.
- Automation: Unlinked

### TC-CHK-007-02

- Requirements: CHK-06, CHK-07
- Environment: isolated-staging
- Mode: Baseline; isolated fault injection
- Scenario: Given first line has stock and later line is forced to fail inside the transaction after precheck, when checkout executes, then no order/lines remain and all inventory is unchanged.
- Automation: Unlinked

### TC-CHK-009-01

- Requirements: CHK-09
- Environment: isolated-staging
- Mode: Target; G-08
- Scenario: Given a sized product, when a direct API caller omits size or supplies invented color, then invalid options are rejected with no writes. Current code does not enforce this.
- Automation: Unlinked

### TC-CHK-009-02

- Requirements: CHK-09
- Environment: isolated-staging
- Mode: Target; decision required G-14
- Scenario: Given a successful valid checkout request, when the same request is retried, then agreed idempotent behavior prevents another order. No current idempotency contract exists.
- Automation: Unlinked

### TC-ORD-001-01

- Requirements: ORD-01, NFR-01
- Environment: isolated-staging
- Mode: Baseline with RLS evidence
- Scenario: Given orders for U-A and U-B, when U-A reads history and attempts a direct U-B order read, then only U-A's records are accessible.
- Automation: Unlinked

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
- Automation: Unlinked

### TC-REV-006-01

- Requirements: REV-06, ADM-02
- Environment: isolated-staging
- Mode: Target protected admin list; G-05
- Scenario: Given approved and pending reviews, admin sidebar fetches all through a signed-cookie API while an unauthenticated direct API call returns 401; the sidebar remains read-only and direct pending moderation page remains separate.
- Automation: Unlinked

### TC-REV-002-01

- Requirements: REV-02
- Environment: isolated-staging
- Mode: Target applied storage integration
- Scenario: Given U-A and existing product after the hardening migration, one to three real JPEG/PNG/WebP files within 1 byte–2 MiB return private object paths; an unauthenticated storage URL is denied and the moderator page shows ten-minute signed URLs. Empty/fourth/oversize/mismatched signature, invalid token/product and absent bucket fail.
- Automation: Unlinked

### TC-REV-002-02

- Requirements: REV-02, NFR-08
- Environment: isolated-staging
- Mode: Target shared limiter and retention check
- Scenario: Given U-A, the first ten valid upload requests in one day may pass and the eleventh returns 429 across separate app instances; failed review creation must not silently show a public review. Inspect orphan objects separately.
- Automation: Unlinked

### TC-RST-002-01

- Requirements: RST-02
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given a pending request, when the same email in different casing requests the same product/options, then already_subscribed is returned and pending count remains one.
- Automation: Unlinked

### TC-RST-004-01

- Requirements: RST-04
- Environment: isolated-staging
- Mode: Target eligibility plus baseline batching; G-12
- Scenario: Given S and M requests and only M stock restored, when notifying M, then only eligible M/whole-item requests are delivered; re-run, provider failure and size-less notification are checked separately.
- Automation: Unlinked

### TC-RST-005-01

- Requirements: RST-05
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given a valid alert token, when using its unsubscribe URL twice, then record is absent and both valid-shape requests return confirmation; malformed token returns 400.
- Automation: Unlinked

### TC-ADM-002-01

- Requirements: ADM-02, AOR-01, STK-01
- Environment: isolated-staging
- Mode: Baseline APIs; P0
- Scenario: Given admin_auth=1 without signed cookie, when calling admin order/stock APIs, then both deny authorization and no writes occur.
- Automation: Unlinked

### TC-ADM-001-01

- Requirements: ADM-01, NFR-02
- Environment: isolated-staging
- Mode: Target production configuration and local fixture regression
- Scenario: Given two named admins and distinct password hashes, only matching username/password pairs receive a one-hour secure cookie; old DEV_CREATE_USER_KEY cannot sign in in production, and rotating ADMIN_SESSION_SECRET invalidates existing cookies. Test missing/short secrets and absent hashes.
- Automation: Unlinked

### TC-ADM-002-02

- Requirements: ADM-02, REV-05
- Environment: isolated-staging
- Mode: Target protected mutation
- Scenario: Given customer token or old x-dev-key without signed admin cookie, DELETE /api/admin/reviews/{id} returns 401 and review remains; a valid cookie can delete.
- Automation: Unlinked

### TC-ADM-003-01

- Requirements: ADM-03
- Environment: isolated-staging
- Mode: Baseline; resolved G-13
- Scenario: Given a signed admin cookie, when sidebar logout succeeds, then cookie and local flag are absent, route is /admin and a private API returns 401. Failed logout retains state and allows retry. GET logout redirects 303 on the request origin; POST returns no-store JSON.
- Automation: Unlinked

### TC-PRD-002-01

- Requirements: PRD-02, ADM-02
- Environment: isolated-staging
- Mode: Known-gap reproduction; G-06
- Scenario: Given the checked-in base write policies and cookie-only administrator, when saving a catalog change, then verify persistence on reload and capture the permissions failure instead of trusting closed form.
- Automation: Unlinked

### TC-STK-002-01

- Requirements: STK-02, ADM-04
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given P-SIZED S=0/M=4/L=5, when saving M=2 through stock API, then M is 2 and product stock is 7; refresh dashboard and verify inventory.
- Automation: Unlinked

### TC-AOR-003-01

- Requirements: AOR-03, ORD-02
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given a pending U-A order, when admin sets processing, then persisted status and U-A history after reload show Processing.
- Automation: Unlinked

### TC-ANL-001-01

- Requirements: ANL-01, ANL-04
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given known totals including a cancelled order, when loading analytics, then sum/average/top units use all loaded orders under baseline rules; cancelled-excluded metric is a separate owner decision.
- Automation: Unlinked

### TC-OPS-002-01

- Requirements: OPS-02, OPS-03, OPS-04, NFR-02
- Environment: isolated-staging
- Mode: Baseline
- Scenario: Given production mode, when calling test reset/seed-user and dev create-user, then first two return 404 and dev helper returns 403; no mutation occurs.
- Automation: Unlinked

### TC-NFR-008-01

- Requirements: NFR-08
- Environment: isolated-staging
- Mode: Target deployed/shared database; local fallback is insufficient
- Scenario: Given two app instances behind a proxy that appends/overwrites x-forwarded-for, five admin attempts under the same address/account are allowed and the sixth is 429 across instances; unavailable limiter RPC/config returns 503. Repeat for checkout/review/restock boundaries.
- Automation: Unlinked

### TC-OPS-009-01

- Requirements: OPS-09, NFR-01
- Environment: isolated-staging
- Mode: Target read-only inspection; not full role acceptance
- Scenario: Given an explicit read-only DATABASE_URL for a known QA project, security:check-db reports the applied review/order/limiter policy inventory and private review bucket without writes or secret output; removing a required grant/policy in isolated QA causes a nonzero result.
- Automation: Unlinked

### TC-CNT-001-01

- Requirements: CNT-01
- Environment: public-read-only
- Mode: Baseline demo
- Scenario: Given footer form, when submitting valid email, then preview-only feedback appears and no subscription network write/email occurs.
- Automation: `tests/ecommerce/newsletter-preview.spec.ts` (partial: valid email preview and no write; invalid email validation untested)

### TC-CAT-003-02

- Requirements: CAT-03, CAT-05, CAT-07
- Environment: isolated-fixture
- Mode: Controlled browser fixture regression
- Scenario: Given four controlled products with two brands and positive/zero stock, when combining brand and In stock only, then matching cards/counts agree, incompatible filters produce zero cards without demo fallback, and Clear all restores the original collection.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts` (controlled brand/unsized-stock combination, zero matches, count and Clear all; missing brand/size metadata selector omission; current count contract drift can stop the combined-filter case; other combinations untested)

### TC-CAT-005-02

- Requirements: CAT-03, CAT-05
- Environment: isolated-fixture
- Mode: Controlled browser fixture regression; missing rows remain G-09
- Scenario: Given two controlled sized products with inverse S/M availability at stock zero/one/four, when enabling In stock only and selecting S or M, then only the product with available selected-size stock remains. Missing stock rows remain unresolved G-09.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts` (controlled S/M size-stock zero/one/four filter boundaries; missing stock rows and live inventory unverified)

### TC-AUTH-002-02

- Requirements: AUTH-02
- Environment: public-read-only
- Mode: Current baseline regression
- Scenario: Given a fresh visitor registration form with valid fictional name, email and password, when confirmation is left empty and Register is submitted, then native required-field validation keeps the form open and no account-creation request is sent.
- Automation: `tests/ecommerce/auth-confirmation-blank.spec.ts` (blank confirmation branch)

### TC-PDP-003-01

- Requirements: PDP-03
- Environment: isolated-staging
- Mode: Current baseline plus known gap G-09
- Scenario: Given P-SIZED with S stock 0 and M stock 4 and confirmed U-A, when add is attempted without a size, then no cart line is added; S is unavailable, while selecting M allows an M line. Separately record missing stock-row behavior as unresolved G-09 rather than declaring it passed.
- Automation: Unlinked

### TC-CUR-003-01

- Requirements: CUR-03
- Environment: isolated-staging
- Mode: Current baseline
- Scenario: Given a controlled USD display rate, U-A and a product with known INR price, when viewing detail, cart and order history after a demo order, then each customer display uses the shared USD formatter while stored order unit price/total and admin money remain INR; compare UI with persisted snapshots.
- Automation: Unlinked

### TC-AUTH-003-01

- Requirements: AUTH-03
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given confirmed disposable U-A, when an incorrect password is submitted, then sign-in fails without a session; when the correct password is submitted, then the panel closes, the session survives reload and a protected action becomes available. Record provider configuration and clean up U-A.
- Automation: Unlinked

### TC-FAV-002-01

- Requirements: FAV-02
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given distinct confirmed U-A/U-B and a favorite owned by U-A, when U-A signs out and U-B signs in in the same browser, then U-A favorites disappear from UI and U-B cannot read or mutate U-A's favorite through direct authorized requests; inspect database/RLS results and clean up both users.
- Automation: Unlinked

### TC-CART-001-01

- Requirements: CART-01
- Environment: public-read-only
- Mode: Current baseline regression
- Scenario: Given a fresh visitor and an in-stock unsized product, when Add to bag is pressed, then the account prompt opens and the browser cart remains empty; no customer or order write occurs.
- Automation: `tests/ecommerce/cart-guest-denial.spec.ts` (guest-denial branch; no signed-in add/replay)

### TC-CART-001-02

- Requirements: CART-01
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given the interrupted guest add and confirmed U-A in isolated staging, when U-A signs in, then the product is not automatically added; when U-A explicitly adds it again, then one line is added and the cart drawer opens.
- Automation: Unlinked

### TC-CART-004-04

- Requirements: CART-04, NFR-03
- Environment: public-read-only
- Mode: Current baseline regression
- Scenario: Given a fresh visitor browser context with malformed JSON in els-cart before first navigation, when the homepage hydrates and My Cart opens, then the bag is empty and a visible recovery notice appears without a crash or non-read request.
- Automation: `tests/ecommerce/cart-malformed-storage.spec.ts` (malformed JSON recovery only)

### TC-CHK-001-01

- Requirements: CHK-01
- Environment: isolated-staging
- Mode: Current configured integration
- Scenario: Given a guest or expired customer token and a nonempty fixture cart, when opening checkout or POSTing the order API, then UI submission is unavailable and API returns 401 without an order or stock change. Repeat with a valid customer and empty cart for the documented empty-cart rejection.
- Automation: Unlinked

### TC-PRD-003-01

- Requirements: PRD-03
- Environment: isolated-staging
- Mode: Target requirement; known gap G-17
- Scenario: Given a disposable product and authorized admin on isolated staging, when saving blank/whitespace name, negative or nonfinite price, and negative/fractional stock, then validation rejects each value and the stored product remains unchanged after reload. Current source has G-17; record failures as known gap, not passed target behavior.
- Automation: Unlinked

### TC-STK-004-01

- Requirements: STK-04
- Environment: isolated-staging
- Mode: Target requirement; known gap G-18
- Scenario: Given P-SIZED and authorized admins in isolated staging, when concurrent edits or an injected failure occur between size and overall-stock writes, then inventory must remain consistent with no partial update. Current non-atomic implementation is G-18; capture both records before and after and label any mismatch a defect.
- Automation: Unlinked

### TC-AOR-004-01

- Requirements: AOR-04
- Environment: isolated-staging
- Mode: Baseline characterization plus pending decision G-19
- Scenario: Given a disposable order in each lifecycle status, when an authorized admin requests each of the five status values and an unsupported value, then record accepted/rejected transitions, persisted status and inventory after cancellation. Do not assert a future transition graph or stock reversal until G-19 is decided by the product owner.
- Automation: Unlinked

### TC-NAV-07-CORE

- Requirements: NAV-07
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given a fresh visitor, when unknown product and subcategory URLs open, then both show not-found; the admin login route omits storefront chrome.
- Automation: `tests/ecommerce/not-found-admin-shell.spec.ts` (partial: unknown product and subcategory 404 plus admin chrome absence; route refresh untested)

### TC-CAT-01-CORE

- Requirements: CAT-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given one fixture product in each of 14 database categories, when opening English main and subcategory listings, then only normalized matching products appear and women/men collections stay separate.
- Automation: Unlinked

### TC-CAT-02-CORE

- Requirements: CAT-02
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given tagged New, Best, Featured, Populer and untagged products, when opening New Arrivals, Best Sellers and Collection, then tag-derived matches and main-category membership follow the BRD without implying sales ranking.
- Automation: `tests/ecommerce/catalog-refinements-fixture.spec.ts` (partial: Women's New Arrivals, Best Sellers and Collection with New/BEST/Featured/Populer/null tags in controlled GET fixtures; Men and real database membership unverified)

### TC-CAT-04-CORE

- Requirements: CAT-04
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given products at, below and above known displayed-price bounds, when using min/max sliders and Under tiers, then matches are inclusive, sliders do not cross, and currency change clears bounds.
- Automation: `tests/ecommerce/catalog-refinements-fixture.spec.ts` (partial/mixed: keyboard inclusive price bounds and crossing clamps plus exact Under-tier boundary; the keyboard case currently fails the CAT-07 collection-total expectation before later clamp steps; currency change reset unverified)

### TC-CAT-06-CORE

- Requirements: CAT-06
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given products with tied prices, dates and tags, when choosing every sort option, then low/high price, New Arrivals and Recommended follow documented tie and incoming-order rules without losing products.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts`, `tests/ecommerce/catalog-refinements-fixture.spec.ts`, `tests/ecommerce/price-sorting.spec.ts` (partial: controlled low/high price ordering with name ties, Recommended incoming order, and New Arrivals new-tag/date/name precedence; live Dress price-low multiset; missing dates/tags beyond the selected fixtures unverified)

### TC-CAT-08-CORE

- Requirements: CAT-08
- Environment: isolated-fixture
- Mode: Current baseline or known gap
- Scenario: Given controlled product/stock responses of success, empty, 503 and delay beyond eight seconds, when opening and retrying a collection, then loading, labelled demo fallback, live-stock warning, true empty and recovery remain distinct; abandoned requests cancel.
- Automation: `tests/ecommerce/catalog-fixture.spec.ts` (controlled product/stock 503 and pending-request timeout, loading/demo/stock-warning distinction, successful retry, empty success and navigation cancellation; fixture results do not prove backend readiness)

### TC-SEA-01-CORE

- Requirements: SEA-01
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given a visitor, when opening header Search and submitting blank, padded, ampersand and Unicode queries, then the field starts focused, blank stays put, and nonblank input is trimmed and encoded at /search?q= with the overlay closed.
- Automation: `tests/ecommerce/search-input.spec.ts` (focus, blank submit, trim/encode ampersand and Unicode, and closed search panel)

### TC-SEA-03-CORE

- Requirements: SEA-03
- Environment: isolated-fixture
- Mode: Baseline plus target gap G-15
- Scenario: Given slow, empty, failing and rapidly changed search responses, when searching then clearing the query, then loading/count/results/no-results states are honest; record missing service-error/retry and blank-query clearing as G-15.
- Automation: `tests/ecommerce/catalog.spec.ts` (partial: no-results state for a missing query only)

### TC-PDP-02-CORE

- Requirements: PDP-02
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given P-COLOR with distinct photos and P-DEMO, when selecting color and adding with U-A, then swatch, image and cart color agree; demo-image product hides colors and shows one photo.
- Automation: Unlinked

### TC-PDP-04-CORE

- Requirements: PDP-04
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given known size stock four, when changing detail quantity through one, four and beyond, then it starts at one, cannot decrease below one, clamps at four and disables invalid increase/add.
- Automation: `tests/ecommerce/product-detail.spec.ts` (partial: initial quantity one, increase to two, decrease to one on unsized product only)

### TC-PDP-05-CORE

- Requirements: PDP-05
- Environment: isolated-fixture
- Mode: Current baseline or known gap
- Scenario: Given clothing detail, when opening and closing Size Guide, then static XS/S/M/L chest and waist references are visible and dismissible without claiming product-specific shoe or XL/XXL guidance.
- Automation: Unlinked

### TC-PDP-06-CORE

- Requirements: PDP-06
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given supplied and fallback product information, when opening Details, Measurements, Composition/Care/Origin and Shipping/Returns panels, then only one stays open and the appropriate text appears.
- Automation: `tests/ecommerce/product-information.spec.ts` (partial: four panels open one at a time with nonempty text on one available product; supplied/fallback variants untested)

### TC-PDP-07-CORE

- Requirements: PDP-07
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given zero, one and over eight same-main-category alternatives, when viewing a product, then Complete Your Look hides for zero or shows at most eight other IDs and never the current product.
- Automation: Unlinked

### TC-CUR-01-CORE

- Requirements: CUR-01
- Environment: isolated-fixture
- Mode: Current baseline or known gap
- Scenario: Given controlled US, India and other country headers conflicting with browser locale/time zone, when resolving storefront region, then headers take precedence, US selects USD and others INR; missing headers use documented fallback.
- Automation: Unlinked

### TC-CUR-02-CORE

- Requirements: CUR-02
- Environment: isolated-fixture
- Mode: Current baseline or known gap
- Scenario: Given known INR price and positive, zero, invalid or failed USD rates, when rendering prices, then valid USD rounds to whole en-US units and invalid/failed rates fall back to en-IN INR at rate one.
- Automation: `tests/ecommerce/currency-fixture.spec.ts` (partial: one fictional browser-cart price with controlled positive, zero, invalid and failed region responses; other price surfaces and live exchange provider untested)

### TC-AUTH-01-CORE

- Requirements: AUTH-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given separate staging Supabase and controlled inbox, when registering through actual signup, then required fields/name metadata, Sign In state and provider email policy are verified; helper-created confirmed users are separate evidence.
- Automation: Unlinked

### TC-AUTH-04-CORE

- Requirements: AUTH-04
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given fictional values in Sign In and Register, when toggling password visibility and switching tabs without submission, then entered password stays unchanged and both tabs remain operable.
- Automation: `tests/ecommerce/auth-password-visibility.spec.ts` (password visibility and Sign In/Register tab behavior without form submission)

### TC-AUTH-05-CORE

- Requirements: AUTH-05
- Environment: isolated-staging
- Mode: Baseline plus target gap G-02
- Scenario: Given existing disposable account and controlled inbox, when reset is requested with empty/valid email, then empty is rejected and valid request reaches provider; link completion remains G-02 until implemented.
- Automation: Unlinked

### TC-AUTH-07-CORE

- Requirements: AUTH-07
- Environment: isolated-fixture
- Mode: Current baseline or known gap
- Scenario: Given nonproduction helper and fallback configurations, when registering, then the observed helper or Supabase path matches policy; production disables helper. Helper success never proves email confirmation.
- Automation: Unlinked

### TC-FAV-01-CORE

- Requirements: FAV-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given U-A and a fixture product, when toggling favorite from card and detail twice, then one unique record and icon/count follow successful writes; a failed write must not falsely toggle state.
- Automation: Unlinked

### TC-FAV-03-CORE

- Requirements: FAV-03
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given guest and U-A with zero, one and deleted saved products, when opening Favorites or pressing a heart, then guest gets account prompt and U-A sees accurate loading, cards/count, empty state and Discover Collection link.
- Automation: Unlinked

### TC-CART-03-CORE

- Requirements: CART-03
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given isolated browser cart with two variants, when opening bag and pressing plus/minus/remove, then image/name/options, quantity, line total and deletion below one match local state without server writes.
- Automation: `tests/ecommerce/cart-browser-controls.spec.ts` (browser-local two-variant drawer rendering, quantity updates, line/subtotal calculations, below-one and explicit removal; fictional data only)

### TC-CART-06-CORE

- Requirements: CART-06
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given empty and nonempty isolated browser carts, when choosing Start Shopping or Proceed to Checkout, then appropriate action appears and drawer closes on navigation; no unimplemented upper quantity cap is asserted.
- Automation: `tests/ecommerce/cart-browser-controls.spec.ts` (empty and nonempty drawer actions and checkout navigation; upper quantity limit remains unimplemented and unasserted)

### TC-CHK-02-CORE

- Requirements: CHK-02
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given U-A, fixture cart and isolated checkout, when each of five shipping fields is blank/whitespace or over its documented limit, then required values fail and long values truncate without invented phone/postcode format rules.
- Automation: Unlinked

### TC-CHK-04-CORE

- Requirements: CHK-04
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given U-A and valid fixture cart, when using card_demo and cash_on_delivery in separate orders, then both are labelled simulations with no card-number field or real charge; no unsupported decline branch is claimed.
- Automation: Unlinked

### TC-CHK-08-CORE

- Requirements: CHK-08
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given U-A and valid cart, when checkout succeeds with order ID, then bag clears and confirmation/ID/Continue Shopping appear; API failure shows error while preserving cart for retry.
- Automation: Unlinked

### TC-ORD-03-CORE

- Requirements: ORD-03
- Environment: isolated-staging
- Mode: Target requirement; known gap G-07
- Scenario: Given order with size/color snapshots, when customer and admin open it, then stored options should display; current omission is G-07 and must be recorded as unmet target.
- Automation: Unlinked

### TC-REV-07-CORE

- Requirements: REV-07
- Environment: isolated-staging
- Mode: Target requirement; known gap G-05
- Scenario: Given approved review and admin, when reply save/remove is attempted, then persisted reply should be customer-visible; missing controls/columns are G-05 and require implementation before pass.
- Automation: Unlinked

### TC-RST-01-CORE

- Requirements: RST-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given unavailable product and chosen size/color, when visitor submits valid/invalid email or product IDs, then valid alert stores without login and invalid inputs fail; unavailable-size selection remains G-09.
- Automation: Unlinked

### TC-RST-03-CORE

- Requirements: RST-03
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given staging with mail enabled then disabled, when saving a restock request, then response/UI distinguishes configurations and pending request persists when delivery is disabled.
- Automation: Unlinked

### TC-PRD-01-CORE

- Requirements: PRD-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given admin and products with varied names/categories/dates, when combining mixed-case name search and exact category filter, then newest-first matching rows or distinct no-match state appear.
- Automation: Unlinked

### TC-PRD-04-CORE

- Requirements: PRD-04
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given admin and disposable product, when appending pasted URL or one upload and removing main image, then first remaining image becomes main after reload and product-images bucket behavior is verified.
- Automation: Unlinked

### TC-PRD-05-CORE

- Requirements: PRD-05
- Environment: isolated-staging
- Mode: Baseline plus target gap G-18
- Scenario: Given admin, when creating XS–XXL/36–44 sized product, then zero stock rows initialize; later size edits should synchronize rows/aggregate but current G-18 is reported separately.
- Automation: Unlinked

### TC-PRD-06-CORE

- Requirements: PRD-06
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given admin and disposable product with dependent records/order snapshot, when confirming Delete, then product/dependents disappear and historical price/quantity survive; cancel or permission failure leaves product unchanged.
- Automation: Unlinked

### TC-STK-03-CORE

- Requirements: STK-03
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given stock 0, 1, 4 and 5 fixtures, when admin opens stock and dashboard, then rows say Out/Low/Available at boundaries and dashboard low count matches documented sized-product-only baseline.
- Automation: Unlinked

### TC-AOR-02-CORE

- Requirements: AOR-02
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given orders with distinct IDs, customers and statuses, when admin searches mixed case and filters exact status, then matching rows appear and no orders differs from no matches.
- Automation: Unlinked

### TC-USR-01-CORE

- Requirements: USR-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given admin and over 200 profiles, when opening Users/API, then at most 200 updated_at-ordered ID/name/time rows appear and unauthenticated API read is denied.
- Automation: Unlinked

### TC-USR-02-CORE

- Requirements: USR-02
- Environment: manual-review
- Mode: Out of current implemented scope
- Scenario: Given current Users table, when pressing View, record absent detail handler; no passing profile-detail test until a future requirement and implementation are approved.
- Automation: Unlinked

### TC-ANL-02-CORE

- Requirements: ANL-02
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given orders in all five statuses, when admin opens analytics, then each pipeline count and rounded percent matches loaded data; rounded percentages need not sum to 100.
- Automation: Unlinked

### TC-ANL-03-CORE

- Requirements: ANL-03
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given sized/unsized fixture products, when admin opens inventory health, then healthy=max(products-low-out,0) and low/out counts/units use documented stock sources.
- Automation: Unlinked

### TC-ANL-05-CORE

- Requirements: ANL-05
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given approved/pending reviews, when admin opens customer signal, then count and one-decimal mean use all loaded reviews and zero when empty; do not call it approved-only sentiment.
- Automation: Unlinked

### TC-SET-01-CORE

- Requirements: SET-01
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given admin, when opening Settings, then identity and catalog/category counts appear; database label is static and no save, feature-toggle or live-health behavior is claimed.
- Automation: Unlinked

### TC-CNT-02-CORE

- Requirements: CNT-02
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given visitor, when following footer categories, favorites, privacy, terms, GitHub and return-home links, then destinations and external attributes match BRD without writes.
- Automation: `tests/ecommerce/footer-content.spec.ts` (footer hrefs and GitHub attributes; privacy/terms navigation and return-home links; category targets checked as hrefs only)

### TC-CNT-03-CORE

- Requirements: CNT-03
- Environment: public-read-only
- Mode: Baseline content review plus gap G-22
- Scenario: Given visitor, when reading home, guest checkout, privacy and terms, then demo/no-charge/no-shipment/data claims agree; record generic shipping/return or confirmation conflicts as G-22.
- Automation: `tests/ecommerce/footer-content.spec.ts` (partial: current home, guest checkout, privacy and terms demo wording; known G-22 copy conflicts remain open)

### TC-CNT-04-CORE

- Requirements: CNT-04
- Environment: manual-review
- Mode: Out of current UI scope
- Scenario: Confirm countdown is not mounted and exclude it from current UI acceptance. If owner enables it, use controlled clock for local 31 Dec 2026 boundary/zero clamp without a discount claim.
- Automation: Unlinked

### TC-OPS-01-CORE

- Requirements: OPS-01
- Environment: public-read-only
- Mode: Current baseline or known gap
- Scenario: Given public GET /api/health, when requested, then status is ok and timestamp parses; do not infer database readiness.
- Automation: `tests/ecommerce/api/public-api.spec.ts` (full public health JSON shape and parseable timestamp; no database readiness inference)

### TC-OPS-05-CORE

- Requirements: OPS-05
- Environment: isolated-fixture
- Mode: Current baseline or known gap
- Scenario: Given local app with/without base schema text, when schema endpoint or error-copy action runs, then plain SQL or not-found and clipboard failure are reported; no migration repair is implied.
- Automation: Unlinked

### TC-OPS-06-CORE

- Requirements: OPS-06
- Environment: website-repository-ci
- Mode: Current baseline or known gap
- Scenario: Given controlled requirements-source diff, when website docs test/check/sync/review run, then stale source fails build/lint, manual CSV fields survive, retired IDs archive and affected results need retest; review never marks passed.
- Automation: Unlinked

### TC-OPS-07-CORE

- Requirements: OPS-07
- Environment: website-repository-ci
- Mode: Current baseline or known gap
- Scenario: Given Zeouf website repo without live Supabase/mail keys, when test:ui and test:catalog run sequentially, then fixture servers/cache/artifacts stay isolated and mocks do not become live integration evidence.
- Automation: Unlinked

### TC-OPS-08-CORE

- Requirements: OPS-08
- Environment: website-repository-ci
- Mode: Current baseline or known gap
- Scenario: Given public HTTP(S) origin, when website test:live runs, then no local server launches, browsing routes work and write attempts fail; attribute results to deployed revision, not auth/order/email acceptance.
- Automation: Unlinked

### TC-NFR-04-CORE

- Requirements: NFR-04
- Environment: isolated-staging
- Mode: Target requirement
- Scenario: Given agreed Chromium/Firefox/WebKit and 375/768/1440px viewports, when traversing nav/catalog/detail/admin, then essential controls stay operable without clipping; capture browser/viewport/build.
- Automation: `tests/ecommerce/navigation-accessibility.spec.ts` (partial: homepage and open empty bag without horizontal overflow at 375/768/1440px in Chromium; essential empty-bag action within viewport; catalog/detail/admin and Firefox/WebKit unverified)

### TC-NFR-05-CORE

- Requirements: NFR-05
- Environment: isolated-staging
- Mode: Proposed quality target
- Scenario: Given proposed WCAG 2.2 AA target, when auditing representative routes/dialogs with keyboard, screen reader and axe, then labels, focus, contrast, announcements and reduced motion are reviewed; axe pass alone is not conformance.
- Automation: Unlinked

### TC-NFR-06-CORE

- Requirements: NFR-06
- Environment: isolated-staging
- Mode: Target pending SLA
- Scenario: Given approved build, dataset, device/network and budget, when measuring key pages and representative load, then compare repeatable metrics to agreed thresholds; invent no current SLA.
- Automation: Unlinked

### TC-NFR-07-CORE

- Requirements: NFR-07
- Environment: isolated-staging
- Mode: Current baseline or known gap
- Scenario: Given public demo copy and staging analytics/stock/mail data, when inspecting claims and concurrent order/notification paths, then claims/metric population match capability and no false success or unsafe state appears.
- Automation: Unlinked

Read `case-catalog.json` for the source acceptance text and QA focus.
