# Browser recovery, pending requests and form boundaries

Continue [plan 23](23-browser-only-accounts-stock-analytics.md) on pinned Zeouf frontend `843646b7d0c52ef5149f7905b19ec5d87fe5054b`, project `ecommerce-chromium`, using `fixtures/ecommerce-base` through the existing isolated fixtures and storefront page object. Follow `tests/ecommerce/seed.spec.ts`. No staging is available.

The 22 unlinked cases retain their staging, website-CI or manual-review requirements. This batch deepens eight already mapped cases; it does not substitute response mocks for transaction, authorization, email or concurrency evidence.

## Scenarios

- TC-AUTH-05-CORE: controlled reset success sends the entered fictional email and local-origin return URL; controlled denial keeps the email, reports failure and permits explicit retry. No mailbox delivery or reset-link completion claim.
- TC-CNT-001-01: blank and malformed newsletter email fail native validation, keep the field focused and never show preview success or send a write.
- TC-ORD-001-01: hold the order read to distinguish loading from empty history. Assert the requested current-user filter and descending date order. Failed reads show error rather than empty; reload can recover. Supplied rows preserve incoming sequence, show all five status labels and allow one expanded order at a time. A deleted-product fallback, unknown status and simulated cash-on-delivery payment remain readable. Real query ordering, cross-user denial and RLS remain unverified; G-07 size/color omission is not accepted.
- TC-CHK-08-CORE: repeated form submissions while either payment method is pending cause one client request and disable submission. Identical failed retries, including after reload, retain the client attempt key; changed shipping details generate a new key. Attempt storage contains only digest/key. Unavailable attempt storage still permits in-memory retry. HTTP success without an order ID preserves the bag and permits retry. These checks do not establish backend idempotency or unique persisted orders; TC-CHK-009-02 remains unlinked.
- TC-ANL-001-01, TC-ANL-03-CORE, TC-ANL-05-CORE: explicitly held order/product/review responses keep dependent summaries unavailable until loaded. An order read failure retains unavailable summaries during explicit Retry loading data and recovers only after response release. Existing reviewed analytics populations and source provenance remain intact.
- TC-REV-002-01: selecting four files shows the frontend's first three previews; removing one excludes it from multipart upload. A mixed oversize/valid selection retains only the valid preview, which can be removed without a write. Backend file-signature, bucket/privacy and fourth-file rejection remain unverified.

## Execution and evidence

Run the full isolated suite through `npm run test:ecommerce:isolated -- test-results/coverage-runtime/website <fresh-evidence-directory>`, one worker and zero retries. Every held response must release in `finally`; use response synchronization rather than fixed sleeps. All browser writes remain local and recorded, and unhandled requests fail the fixture guard. Record only the checkout attempt key and uploaded filenames beyond existing fixture contracts; do not capture authorization headers or binary uploads.

Run the unchanged deployed read-only allowlist separately, with fresh report/artifact paths and zero retries. Combine reports only if their catalog/manifest hashes match. Preserve prior monitoring and initial failures separately. Validate with `npm run check`; a mapped passing check remains scoped frontend evidence, and full case acceptance remains unassessed.

## Isolated validation

All **116 isolated checks passed on their first attempt**, including the 19 added checks, with one worker and zero retries/skips/flaky results. The runner verified unchanged protected inputs and the pinned website revision. Evidence is retained at `test-results/recovery-loading-browser-run1/`. `npm run check` passed, including all 43 script regressions and 260 unique executable mappings.

An existing public catalog check, TC-CAT-003-02, timed out waiting for `page.goto('/women')` to reach `load`, before its metadata assertions. The same unchanged check passed three separate repeat iterations with zero retries and navigation diagnostics; evidence is at `test-results/recovery-loading-public-recheck/`. Retain the original timeout from `test-results/recovery-loading-public/`; passing rechecks do not certify a clean full public run or establish the cause of the navigation delay.

## Combined result

The public allowlist finished with **143 passed and one failed**, no retries/skips/flaky results. At the timeout, navigation diagnostics recorded ten pending JavaScript chunk requests; no request failure was recorded in that snapshot. This is an observed pending-request symptom, not an established root cause. The summary is retained at `test-results/recovery-loading-public/navigation-timeout-summary.json` alongside the full raw report and failure artifacts.

Combined primary-run monitoring records **259 passing checks and one failed check**, mapped to **86/108 cases**, with **22 unlinked cases** unchanged (17 staging, three website CI and two manual reviews). It preserves the public failure. The repeat-each diagnostic report remains separate because its Playwright spec identities differ; no raw IDs were rewritten to bypass the monitor's identity guard. Its three passes are recorded in `test-results/recovery-loading-browser-run1/validation.json`.

Current monitoring copies are retained with both primary runs. The previous 241-check monitoring snapshot is archived under `test-results/recovery-loading-public/previous-monitoring/`. Full acceptance remains unassessed; this batch is not a clean full-public result or verification of GitHub Actions. Changes remain local and uncommitted.
