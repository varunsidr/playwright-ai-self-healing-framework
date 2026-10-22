# Accounts, stock recovery and reviewed analytics

Continue the [isolated admin batch](22-browser-only-admin-and-guest.md) on the pinned Zeouf frontend `843646b7d0c52ef5149f7905b19ec5d87fe5054b`, project `ecommerce-chromium`, using the existing storefront page object and fixtures derived from `fixtures/ecommerce-base`. Follow `tests/ecommerce/seed.spec.ts`. No staging is available.

## Browser contracts

- TC-FAV-002-01: a fictional user's favorite clears on sign-out; the second user's read uses their ID, starts empty, and inserts under their own ID. Reload restores that user's controlled response. Database RLS and real authentication remain unverified.
- TC-CART-004-01: record G-10: the browser bag remains shared across fictional accounts. This passing baseline observation does not accept the account-separated cart target.
- TC-CUR-003-01: a controlled USD rate of 0.025 displays INR 8,900 as $223 on detail, INR 1,000 as $25 in the bag, and an INR 2,000 supplied order as $50. Admin displays the same supplied total as ₹2,000. No actual order creation or persisted-price reconciliation.
- TC-STK-002-01: controlled M=4 to M=2 updates the size and aggregate 9 to 7 after a fresh read. HTTP/network failure retains aggregate 9 until explicit retry. Negative, fractional and overflowing quantities send no write. Assert the size-specific notify request, without claiming email delivery or atomic database writes.
- TC-CHK-005-01: a forged browser price of 1 is omitted from the checkout payload; each item sends only ID, quantity, size and color. Backend recomputation remains unverified.
- TC-REV-002-02: controlled upload 429 retains fields and preview, sends no review POST and makes no successful/public submission claim. Distributed daily-limit enforcement remains unverified.
- TC-PRD-003-01: blank/whitespace names disable Save; Cancel leaves the supplied catalog unchanged. Server numeric validation and database invariants remain unverified.

## Actual local production denials

APIRequestContext bypasses browser mocks and contacts only the disposable loopback production server. The pinned handlers reject these requests before backend access, and the runner supplies no backend credentials.

- TC-OPS-002-01: POST reset and seed-user return 404; dev create-user returns 403.
- TC-ADM-002-02: DELETE review with a fictional customer bearer or retired development key, without a signed admin cookie, returns 401. A real valid-cookie deletion and database preservation need staging.

## Reviewed analytics requirements

The [scoped requirements import](requirements/analytics-requirement-updates.json) records exact BRD/QA links at the pinned website revision and the website's 2026-10-10 documentation review for ANL-01, ANL-04 and ANL-05. The older CAT-07 import keeps its own revision. Original BRD/QA/CSV snapshots remain source history. This supersedes the disputed analytics baseline noted in plan 22; it does not constitute stakeholder sign-off or executed acceptance.

- TC-ANL-001-01: active totals/count/average exclude cancelled orders, while the pipeline still includes them. Empty and cancelled-only populations yield zeros. Failed order reads show unavailable summaries. Top products exclude cancelled/deleted products, cap at five and preserve incoming product order for ties.
- TC-ANL-05-CORE: approved-only counts and one-decimal average for mixed, single, pending-only and empty populations; failed reads show unavailable instead of zero.

All analytics responses are controlled browser fixtures; loading-state and real authorized database reconciliation remain separate.

## Execution

Use `npm run test:ecommerce:isolated -- test-results/coverage-runtime/website <fresh-evidence-directory>`. Preserve initial failures and rerun corrected tests in a fresh directory. Run the separate deployed read-only suite with one worker and zero retries; combine only reports matching the final catalog/manifest hashes. Every browser write must be fulfilled locally or fail the fixture guard.

## Retained first attempt

The first isolated run passed 95 checks and failed two new analytics checks because they expected service-error text that this view does not render. The order view shows `Could not load orders. Please retry.`; failed review metrics show an unavailable value in Customer signal. The corrected checks retain all unavailable-value assertions. Raw reports, DOM snapshots, traces and a separate monitoring snapshot remain in `test-results/accounts-stock-analytics-run1/`.

Broad deployed project discovery also passed all 144 browser checks and skipped the two gated staging-only tests. Its evidence remains at `test-results/accounts-stock-analytics-public/`, including the previous combined monitoring snapshot. The final public allowlist run is separate and excludes those staging-only specs.

## Final validation

This batch adds **28 checks for 11 previously unmapped cases**. The corrected full isolated run passed **97 checks**, and the explicit public read-only allowlist passed **144 checks**. Both used one worker, zero retries and no skips/flaky results. `npm run check` passed formatting, lint, TypeScript, static analysis, 241 unique executable mappings and all 43 script regression tests. The isolated runner and final validation confirmed unchanged protected test inputs.

Combined monitoring records **241 passing scoped checks**, **86 mapped cases** and **22 unlinked cases**: 17 staging, three website CI and two manual reviews. Full acceptance remains unassessed; G-10 remains an observed shared-cart finding. Evidence and monitoring copies are under `test-results/accounts-stock-analytics-verified/` and `test-results/accounts-stock-analytics-read-only/`. The former includes `validation.json`; prior monitoring and the initial failures remain at the separate paths above. These are local working-tree results; GitHub Actions has not been run in this batch.
