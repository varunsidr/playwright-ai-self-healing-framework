# Zeouf acceptance findings from continued automation

## Current expansion

The latest public read-only run contains **144 individually mapped browser checks: 142 passed and 2 failed without retries**, covering limited scopes in **41 of 108 cases**. It adds 22 tests for category membership, guest favorites, blank password reset, nonempty guest checkout, browser-cart variant merging, health and schema reads. All existing public-safe checks now have individual mappings; no browser test in this run is unmapped.

Both failures are a new category membership regression: Men's Jackets and Trousers include the corresponding Women's products. The fixture uses the real deployed listing with intercepted GET responses and no server writes. See [the developer fix and reproduction](zeouf-men-category-regression.md). Expected membership remains enforced, so expanded CI will fail until the website is repaired and deployed.

Current execution evidence is in `test-results/ecommerce-monitoring.md`. The [all-case backlog](../specs/ecommerce/automation-backlog.md) records 67 cases without individual checks: 58 require staging, four need additional controlled runtime fixtures, three belong to website repository CI, and two require manual scope review. Mapped cases retain partial scopes and unassessed full acceptance.

## Earlier count and keyboard repairs

Repair prepared on 2026-10-11: website source review found that CAT-07 had already been revised to `Showing {visible} of {matching} products` in BRD v1.9 at website commit `243b37d`, with an explicit 2026-10-09 documentation review. The five count failures below came from this framework's older snapshot. `requirements/requirement-updates.json` records that scoped revision and the count assertions now verify every reveal batch, filtered results, zero matches and clearing filters. Other requirements retain the original baseline.

The separate website checkout restores the Women/Men disclosure button's focus when Escape is pressed inside the menu or on its trigger. Pending hover closure is cancelled. Both website keyboard regressions passed; the eight focused framework checks (seven former failures plus seed) and all 43 related catalog/navigation checks passed against the local production build. Website ESLint, TypeScript, documentation checks and production build passed. The focus fix was subsequently verified on the public deployment, and both desktop checks also passed in the current expanded run. The user reported the earlier CI rerun passed; the new workflow has not yet been run on GitHub.

Verification artifacts retain the initial development-server results: Next's debugger attempted `POST /__nextjs_original-stack-frames`, which the unchanged read-only guards rejected. Production-mode verification passed all 43 checks. A separate local monitoring attempt had seven passes and one guest-add setup failure because the fallback catalog did not expose the required unsized Add-to-cart control; the deployed read-only pilot is verified separately. These local fixture limitations do not replace the historical deployed findings below.

Earlier monitoring recorded ten pilot passes before this expansion. The preceding monitoring snapshot is now archived as `test-results/automation-expansion-prior-monitoring.md` and `.json`; the former failing snapshot remains under `test-results/ci-fix-prior-monitoring/`. Retain historical reports with their original catalog/manifest revision rather than merging them into the new inventory.

Observed on 2026-10-10 at the public Zeouf deployment in project `ecommerce-chromium`. The copied acceptance baseline is website commit `481a090`, BRD v1.5. The deployed build's commit has not been verified; these results belong to the observed deployment, not a claim that it still matches that source revision. All scenarios use fresh browser contexts and block non-read server requests.

## AUTO-001: catalog count conflicts with copied acceptance

Requirement CAT-07 says the count describes matching versus collection totals. The previous fixture run accepted a two-of-four filter count and a 49-of-49 collection count before all cards were revealed. The currently deployed UI uses `Showing … of … products`; at a 100–200 price range over four controlled products priced 0/100/200/300, it displays `Showing 2 of 2 products`, where the copied expectation is 2 of 4. The displayed cards are the correct boundary products.

Reproduce with the keyboard-boundary test in `tests/ecommerce/catalog-refinements-fixture.spec.ts` or the combined-brand filter test in `tests/ecommerce/catalog-fixture.spec.ts`. The 25/48/49 pagination cases also fail: they display 24 of the collection total before reveal, while acceptance expects all matching products against the collection total. Those three cases stop before later reveal assertions. The page helper accepts the observed optional Showing prefix while retaining exact expected numbers. Together these account for five failures in the final run.

Classification: deployed behavior versus copied-requirements conflict. Have the website owner confirm whether visible-versus-filtered counting is intended in a newer reviewed revision or restore the documented matching-versus-collection contract. Do not simply replace expected counts with observed values. The copied source documents remain unchanged.

## AUTO-002: desktop menu closure loses keyboard focus

TC-NAV-005-01 expects Escape dismissal to return focus to the trigger after clothing-menu/dialog interaction. At 1440px, focus Browse women categories, press Enter, focus Dress, then press Escape. The menu becomes closed/inert and aria-expanded becomes false, but `document.activeElement` is BODY rather than the disclosure button. The Men/Suit path behaves the same. An independent fresh-browser reproduction confirmed BODY for the Women path.

Reproduce with the two desktop disclosure tests in `tests/ecommerce/navigation-accessibility.spec.ts`. Their trigger-focus assertions remain failing; subsequent hover assertions are not reached and must not be reported as passed. All four account/cart/search/mobile keyboard cycles pass in the final run. Search is removed from DOM on close, so closure is checked as absence rather than an inert attribute.

Classification: mismatch with the QA case's keyboard expectation. Restore focus to the relevant disclosure in the website implementation, or resolve the expectation through reviewed requirements. This framework does not own the storefront source and cannot repair the deployed menu here.

## Test maintenance and execution evidence

The privacy notice expanded its list from "charge money, or arrange shipment" to "charge money, arrange shipment, accept returns". Its locator now permits the optional conjunction while still requiring the same no-card-details/no-charge/no-shipment claims. The footer disclosure test passes; this copy repair does not resolve G-22 in the source snapshot. The closed-search check was also corrected to DOM absence, preserving dismissal, focus return and scroll restoration.

Final full browser run: **115 passed, 7 failed, 2 skipped** out of 124 tests. The seven failing tests represent the two findings above. HTML, screenshots, video and traces remain available locally; run `npm run report` to inspect the full run. CI uses separate folders for each batch so later runs preserve earlier evidence.

## Environment blockers

Real signup/mail, session ownership, checkout/stock transactions, reviews/RLS and admin writes remain blocked by absent isolated staging, a separate Supabase project, controlled identities/inboxes and verified cleanup. Server-only region/schema and detail/review fixture cases need a controlled website runtime or appropriate staging. Browser mocks are frontend evidence and cannot establish those server contracts.

See [automation status](../specs/ecommerce/requirements/AUTOMATION_STATUS.md) for current totals and [the batch plan](../specs/ecommerce/19-brd-cards-catalog-navigation.md) for scope.
