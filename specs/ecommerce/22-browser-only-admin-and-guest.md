# Admin UI and interrupted guest-cart coverage

Target: the pinned Zeouf frontend from `843646b7d0c52ef5149f7905b19ec5d87fe5054b`, project `ecommerce-chromium`, and the existing storefront page object. Follow the conventions of `tests/ecommerce/seed.spec.ts` and `fixtures/ecommerce-base`. Extend the isolated runner and write guards from the [first browser-only batch](21-browser-only-remaining-cases.md). No staging has been supplied.

## Admin catalog

- TC-PRD-01-CORE: mixed-case name search and exact category filter combine; clearing restores the response's incoming order; a no-match result appears. Server-side newest ordering remains unverified.
- TC-PRD-002-01: controlled HTTP/network save failures leave editor values intact; an explicit mocked success closes the editor and refreshes the list. No real permissions or persistence claim.
- TC-PRD-06-CORE: cancelling Delete sends no request; denial leaves the row; explicit successful retry removes the row. Product/dependent deletion and historical order preservation remain staging work.
- TC-PRD-04-CORE: append a pasted image URL, remove the main preview, and assert the remaining image becomes main in the request payload. Actual upload bucket and persistence remain unverified.
- TC-PRD-05-CORE: selecting S/M on a new product disables overall-stock editing and sends both sizes with zero stock. Database size-row initialization and synchronization remain unverified.
- TC-STK-03-CORE: sized stock 0/1/4/5 yields Out/Low/Low/Available, dashboard low/out/total counts agree. Unsized low-stock semantics and real inventory remain outside this slice.

## Orders and read-only admin views

- TC-AOR-02-CORE: mixed-case customer search plus exact status filtering; distinguish no orders from no matches.
- TC-AOR-004-01: the five current statuses appear; each changed selection sends the expected explicit request and reflects controlled successful responses. This also adds an admin UI slice for TC-AOR-003-01; real customer-history synchronization, transition policy and cancellation inventory remain unverified.
- TC-AOR-003-01: failed status response retains pending status in detail and list.
- TC-ANL-02-CORE: populated and empty pipelines calculate explicit counts and rounded percentages. Do not require percentages to sum to 100.
- TC-ANL-03-CORE: four sized boundaries plus a healthy unsized product produce the expected healthy/low/out counts and units. No live database metric acceptance.
- TC-USR-01-CORE: supplied profile order, ID/name rendering and null placeholders. Actual 200-row cap and endpoint ordering/authorization require staging. Do not claim that the unimplemented View action opens a profile.
- TC-SET-01-CORE: identity, product/category counts and static database label; no save controls or live-health inference.
- TC-REV-006-01: controlled approved/pending rows appear through the all-status read; sidebar offers no moderation buttons; a failed response shows its error. Real signed-cookie access and RLS remain unverified.

## Admin access and guest cart

- TC-ADM-001-01: sign-in is disabled with either credential missing; controlled 401/429/500 responses show distinct feedback and never establish the local admin flag. Real hash matching, cookie lifetime and secret rotation remain unverified.
- TC-ADM-003-01: mocked logout failure retains the local flag/route and allows retry; mocked success clears the flag and returns to sign-in. Signed-cookie revocation remains unverified.
- TC-ADM-002-01: a local browser flag and forged legacy cookie fail to authorize actual order GET and stock PATCH on the fresh isolated server. Inspect the pinned early authorization guards before running; the loopback build has placeholder services and no backend credentials. This does not establish migrated staging authorization or a valid-admin success path.
- TC-CART-001-02: a guest add prompts for sign-in and leaves the browser bag empty; fake sign-in does not automatically replay it; explicit add then creates one line. Real customer login and cart ownership remain unverified.

## Requirements boundaries and execution

Keep the frozen BRD expectations. Current source excludes cancelled orders and pending ratings in analytics, while TC-ANL-001-01 and TC-ANL-05-CORE describe the older populations. At this batch they remained unlinked pending a reviewed requirements update. The later [account/stock/analytics plan](23-browser-only-accounts-stock-analytics.md) imports only the three rules supported by a pinned website documentation review, preserves the original snapshots and adds controlled browser checks.

Use `npm run test:ecommerce:isolated -- <clean-Zeouf-checkout> <new-evidence-directory>`. All browser mutations are fulfilled locally and recorded; unhandled writes fail the batch. The local authorization-denial check uses APIRequestContext against the isolated server and supplies no signed cookie. Preserve raw reports and original failed attempts; only one clean attempt per check establishes a passing batch. Update mappings and monitoring with explicit partial scopes, and keep real database, stock, email, permissions and manual acceptance separate.

## Validation

The continued batch added **26 checks for 18 previously unmapped cases**. The full isolated run passed **69 checks**, and the separate deployed read-only run passed **144 checks**, each with one worker, zero retries, no skips and no flaky results. `npm run check` passed, including all 38 script regression tests and discovery of 213 unique mapped checks. The isolated wrapper verified unchanged protected inputs and the pinned website source revision.

Evidence is retained under `test-results/admin-browser-coverage-verified/` and `test-results/admin-coverage-public/`; current combined monitoring reports **213 passing checks**, **75 mapped cases** and **33 unlinked cases** (28 staging, three website CI, two manual). Full acceptance remains unassessed. The previous monitoring snapshot, including its public navigation connection resets and passing rechecks, is preserved at `test-results/admin-coverage-public/previous-monitoring/`.

The initial admin run recorded 66 passes and three test-navigation failures, retained in `test-results/admin-browser-coverage-run1/`. Stock Management is a client sidebar view rather than `/admin/stock`; the read-only sidebar Reviews view differs from the direct server moderation route at `/admin/reviews`. Tests now use the actual sidebar controls, preserving all stock, review and error expectations. The corrected full run supplies the clean result.
