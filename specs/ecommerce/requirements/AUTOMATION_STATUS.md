# Zeouf case and automation status

Source baseline: Zeouf BRD v1.5 draft, QA guide and traceability CSV from website commit `481a090`, copied on 2026-10-06. Target for public checks: `https://zeouf-luxury-fashion-ecommerce.vercel.app/`, project `ecommerce-chromium`.

## Current inventory

| Measure                               |    Count | Meaning                                                                                               |
| ------------------------------------- | -------: | ----------------------------------------------------------------------------------------------------- |
| BRD requirements                      |      116 | Every requirement has at least one first-pass case record.                                            |
| P0 requirements                       |       29 | Every P0 has at least one case record; this is planning coverage.                                     |
| Case records                          |      108 | 40 QA-guide cases and 68 curated cases. Tester review can add more boundary cases and detailed steps. |
| Cases linked to automation            |       28 | Links include partial checks; a link does not prove full requirement acceptance.                      |
| Public read-only cases linked         | 16 of 16 | Every public case has at least one check; partial acceptance and known gaps remain.                   |
| P0 requirements with any linked check |        3 | AUTH-02, CART-01 and CART-04; none is a claim that all P0 acceptance rules passed.                    |

Execution environments for the 108 case records: 16 public read-only, 73 isolated staging, 14 isolated fixture, 3 website-repository CI, and 2 manual review. The public deployment has no disposable accounts, separate database, controlled inboxes or verified reset, so staging cases remain unexecuted here. Browser-local or mocked slices can check frontend behavior for some staging-designated records; they do not satisfy the full staging acceptance. Remaining fixture and CI cases need their own setup.

The 2026-10-10 automation batch added **35 browser tests** for catalog pagination at 0/1/24/25/48/49, combined brand/stock filters and clearing, selected-size stock boundaries, low/high/recommended sorting with price ties, product/stock error and timeout recovery, cancellation on navigation, search union/deduplication and empty success, and cart restoration/storage faults. All 35 passed in an initial targeted run against the deployed frontend. Catalog/search GET responses and currency were controlled; cart records were fictional localStorage fixtures. Server writes were blocked and asserted absent. New links include TC-CAT-007-01, TC-CAT-08-CORE, TC-SEA-002-01, TC-CART-004-02/03 and two curated filter cases. This raises linked case records from 21/106 to 28/108, with **80 records still unlinked**. See `../18-brd-controlled-catalog-search-cart.md` for steps and limitations. Run these plus the existing currency fixture with `npm run test:ecommerce:fixtures`; CI now includes that command in the public configuration.

The verified public browser slices include AUTH-02 mismatch and blank confirmation, AUTH-04 password visibility, CART-01 guest add denial, CART-03 browser-local variants and quantities, CART-04 malformed browser-cart recovery, CART-06 bag actions, NAV-01 manual/reduced-motion hero behavior, NAV-06 representative legacy-route redirects, NAV-07 not-found/admin shell, SEA-01 header search, PDP-06 information panels, CNT-01 newsletter preview, CNT-02 footer/legal navigation, and CNT-03 current demo disclosures. A controlled browser fixture also covers CUR-02 positive, zero, invalid and failed region-rate responses for one fictional cart price. Existing checks have also been linked to narrow parts of NAV-05, CAT-06, SEA-03 and PDP-04. The public health API check covers OPS-01. Exact scope and last observed evidence are in `case-links.json`; see `CASE_CATALOG.md` for every case scenario and environment.

Verification on 2026-10-07: `npm run test:ecommerce` reported **57 passed, 2 skipped** on the public deployment. The skips are the admin password submission and perfume checkout journey, which need isolated staging because they write or can write. `npm run test:ecommerce:api` reported **6 passed** for public read-only HTTP/API checks. `npm run check` passed formatting, lint, typecheck and static analysis. These run totals are suite health, not 57 or 63 independently accepted BRD cases.

The public catalog currently offers **zero size-selection links** after loading all 145 women, 114 men and 29 shoes product cards. PDP-05 size-guide behavior is therefore not verified on the live site; it needs a sized fixture in isolated staging or a controlled fixture test. The older product-detail test now checks only quantity and disabled review submission, which it can observe without such a fixture.

All 16 public read-only case records now have at least one linked automation check. This is linkage, not full acceptance: NAV-01/NAV-02 timed/offscreen/hidden playback and all editorial destinations remain untested; CNT-03 still has the open G-22 copy conflict. Other linked records also name partial branches in `case-links.json`.

Verification on 2026-10-10: the full `ecommerce-chromium` run reported **92 passed, 2 skipped** (94 collected). The same admin credential submission and perfume checkout journeys remain staging-only. This includes the 35 new fixture tests; the totals are runner health rather than complete BRD acceptance. After making write-fault initialization deterministic and checking the exact persistence notice, the three affected recovery/fault tests passed again. `npm run check` passed formatting, lint, typecheck and static analysis. The API suite was not rerun in this batch; retain its separately dated 2026-10-07 evidence above.

## Safety and evidence rules

- Public production runs are read-only. New BRD-linked browser tests install a route guard that aborts and records non-read HTTP requests. The linked cases name partial scope where applicable.
- A mocked form test or `/api/test/seed-user` confirmed account is not evidence of confirmation email delivery. Real signup requires a controlled inbox and a verified Supabase signup path, separate from `/api/dev/create-user`.
- Authenticated cart, checkout, reviews, stock and admin mutation cases require a separate staging site **and** Supabase project, disposable data, and verified cleanup.
- The CI full-suite gate requires `ECOMMERCE_STAGING_CONFIRMED=true`, a separate HTTPS `ECOMMERCE_BASE_URL`, and disposable confirmed-user secrets. The URL/flag check does not prove backend isolation; the operator must confirm the separate Supabase project and cleanup. The perfume journey now uses that confirmed fixture user instead of creating an unconfirmed account with a throwaway email.
- A generated case, skipped test, mock, or unexecuted case is never reported as a passing live requirement.

## Remaining implementation work

1. Review the 108 first-pass scenarios with the Zeouf owner, add missing boundary cases, and pin the website build revision and any changed BRD revision.
2. Provide isolated staging and fixtures for the 73 staging cases, then automate P0 journeys first: registration/email and login, cart ownership, checkout price/stock/transaction rules, reviews/RLS, and admin authorization. A staging URL needs its own Supabase project, controlled inboxes, disposable users and verified cleanup; none has been supplied or verified yet.
3. Complete the remaining acceptance within the 14 controlled fixture records and 3 website-repository CI checks. Pagination, search deduplication, collection recovery/cancellation, cart storage faults, two filter cases and currency formatting now have browser fixture evidence; product-detail/review/auth/server-region/schema fixtures still need setup. Network, infrastructure and real concurrency rules require their appropriate environment.
4. Add a source-change detector and reviewed test-update proposals. The updated planner/generator/healer instructions and catalog do **not** automatically regenerate tests on developer commits or implement autonomous self-healing. Preserve expectations and report conflicts during future repairs.

Regenerate this inventory with `npm run cases:zeouf:catalog`. The copied source documents remain inputs; update the overlay JSON files and `case-links.json`, then regenerate instead of editing generated output.
