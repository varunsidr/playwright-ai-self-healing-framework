# Product cards, catalog refinements and keyboard navigation

Source acceptance: Zeouf BRD v1.5 / QA guide snapshot at website commit `481a090`. Target: `ECOMMERCE_BASE_URL` (default deployed Zeouf), project `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`. No isolated staging is configured. Use the existing storefront page object and `fixtures/ecommerce-base`; all new tests block server writes and assert no attempted non-read request.

## Controlled card and catalog checks

`tests/ecommerce/product-card-fixture.spec.ts` checks TC-PDP-001-01 with fictional catalog/size-stock GET data: unsized available stock offers Add to bag; sized stock links to size choice and hides direct add; stock zero omits purchase controls. At 375px actions remain exposed; at 1440px hover and keyboard focus reveal them. A guest add prompts for an account without changing the bag. Aborted optimized-image reads show Image unavailable while preserving product name, exact price, detail href and guest action. This does not validate a detail gallery, touch-device events, signed-in additions or live inventory.

`tests/ecommerce/catalog-refinements-fixture.spec.ts` checks TC-CAT-04-CORE via real keyboard slider interactions: min/max inclusivity, crossing clamps and the exact Under-tier boundary. It retains the copied-BRD matching-versus-collection count expectation; current deployed count behavior conflicts with this assertion. Currency-change reset remains unverified. The file also checks selector omission without brand/size metadata (TC-CAT-003-02), Women's New/Best/Featured/Populer tag membership in highlight routes (TC-CAT-02-CORE), and New Arrivals tag/date/name sort precedence (TC-CAT-06-CORE). Real database matching, Men highlights and missing-date behavior remain unverified.

## Public keyboard and destination checks

`tests/ecommerce/navigation-accessibility.spec.ts` checks TC-NAV-005-01: open account/cart/search/mobile through keyboard activation, verify initial focus is inside, wrap Tab and Shift+Tab at both edges, lock body scrolling, close with Escape and restore the trigger. Closed persistent drawers are inert; the search dialog is removed. Both desktop category menus expand by Enter, expose the correct clothing href, close with Escape and become inert. The case's expected focus return currently fails: BODY receives focus. Hover remains a step after that failed assertion and is not claimed passed until the case completes. Both mobile clothing sections expand through their summary and close/inert after navigating to Dress/Suit; all seven main-category hrefs are checked.

TC-NFR-04-CORE covers only homepage/empty-bag controls and horizontal overflow at 375/768/1440px in Chromium. Other pages, Firefox/WebKit and full accessibility/screen-reader conformance remain unverified.

`tests/ecommerce/home-destinations.spec.ts` extends TC-NAV-001-01 with actual clicks through all six editorial links, both collection panels and the blouse edit, checking destination headings (and editorial product presence). It also checks all seven homepage category hrefs. Timed/offscreen/hidden-tab hero playback remains unverified.

## Evidence, execution and findings

The initial 30-test batch produced 26 passes and four failures. One failure came from an incorrect test assumption that a closed search overlay retains an inert DOM node; the deployed overlay is removed, so the corrected assertion checks absence. Final evidence for the 30 new tests is **27 passed, 3 failed**; the full browser suite reports **115 passed, 7 failed, 2 skipped**. The remaining failures expose count-contract drift and desktop focus return, documented in [the findings](../../docs/zeouf-automation-findings.md). Price crossing/clamp steps after the failed count assertion remain unexecuted. Preserve these expectations and do not skip, weaken or auto-heal them into passes.

Run `npm run test:ecommerce:fixtures` for the six fixture specs; run `npm run test:ecommerce:navigation` for public navigation and homepage destinations. CI runs both batches when staging is unconfigured and includes them in the full suite on confirmed staging. Case links now support `additionalAutomationFiles` so older and new checks remain visible together; every referenced file is validated when regenerating the catalog.

Record final verification totals in `requirements/AUTOMATION_STATUS.md`. Full requirement acceptance remains distinct from these frontend slices. Refresh the requirements snapshot only from a reviewed website revision and record its build identity; current deployment differences do not authorize changing the copied BRD.
