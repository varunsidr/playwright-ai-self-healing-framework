# Zeouf acceptance findings from continued automation

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
