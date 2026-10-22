# Remaining native checks and staging handoff

Source: reviewed Zeouf website commit `843646b7d0c52ef5149f7905b19ec5d87fe5054b`. This continues [plan 24](24-browser-only-recovery-and-loading.md). No separate staging site/database has been supplied. Native website evidence is separate from `ecommerce-chromium` browser monitoring; it must not inflate the 260 browser-check count or erase its retained navigation timeout.

## Native repository cases

Run `npm run test:ecommerce:native -- test-results/coverage-runtime/website <new-evidence-directory>`. The runner clones the clean pinned website into a disposable short path, rejects environment files and scrubs inherited credentials. It preserves native source/tests, compares discovered and executed tests, requires one clean attempt per browser check, and uses separate artifact directories. UI and catalog servers run sequentially. The native live configuration launches no local server and its public browser guard rejects writes.

- TC-OPS-06-CORE: execute docs check → sync → check, plus the native documentation regression fixtures. Those fixtures exercise changed/retired requirements, manual evidence preservation, source drift and review assertions without writing a new review of the actual website.
- TC-OPS-07-CORE: execute native UI then catalog suites with their dedicated local fixture servers and placeholder backend settings. Native mocks remain frontend/handler evidence.
- TC-OPS-08-CORE: execute native public live smoke checks without credentials or mutations. Attribute the source of the tests to the pin; the mutable public deployment's exact source revision remains unverified.

The native purchase suite runs real PostgreSQL in memory through PGlite. Its rollback, invalid-option, replay and atomic size-edit checks provide additional SQL-layer evidence for TC-CHK-007-02, TC-CHK-009-01, TC-CHK-009-02 and TC-STK-004-01. A single in-memory connection does not establish multi-session concurrency, actual API authorization or deployed migrations. These four staging cases remain pending integration acceptance.

## Manual source review, 22 October 2026

- TC-USR-02-CORE: `src/components/AdminApp.tsx:858` renders the profile rows; line 863 has a View button with no handler. Record **known gap G-20**, not a passing profile-detail test. Implementing/removing/labelling the control requires a separate website change; no profile management capability is accepted here.
- TC-CNT-04-CORE: `src/components/SaleBanner.tsx` defines the countdown, local-browser deadline `2026-12-31T23:59:59`, one-second updates and zero clamp. Searching all `src` files finds no import or mounting of SaleBanner outside that component. Record **excluded from current UI acceptance**. Future enablement requires scope confirmation and controlled-clock tests; no discount capability is inferred.

These source observations complete the current technical review. They do not approve future product behavior, retire gaps or replace business decisions.

## The 17 cases still requiring staging or scope decisions

All rows below remain **not run against staging**. Existing browser or native SQL slices remain limited evidence.

| Case           | Remaining evidence                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| TC-CHK-003-01  | Identical cart entries with quantities 10 and 11 are rejected at the real API; inspect absence of order/stock writes.                 |
| TC-CHK-007-01  | Two independently authenticated buyers compete for the last unit; inspect one complete order and zero remaining stock.                |
| TC-CHK-007-02  | Inject failure after precheck inside the real transaction; reconcile order, lines, attempts and inventory snapshots.                  |
| TC-CHK-009-01  | Real API rejects missing/invented options with no persisted changes; local SQL rejection is separate evidence.                        |
| TC-CHK-009-02  | Real API replay returns one original order and changed-payload conflict; verify deployed idempotency contract and concurrent retries. |
| TC-REV-004-01  | Approved/own-pending/other-user review visibility through actual API and RLS roles.                                                   |
| TC-REV-004-02  | Customer direct insert/update/delete and approval/reply tampering denied; pending server creation and image ownership validated.      |
| TC-RST-002-01  | Case-normalized duplicate email/options leave one pending alert.                                                                      |
| TC-RST-004-01  | Size-specific eligibility, provider failure and rerun behavior with a controlled inbox and persisted delivery state.                  |
| TC-RST-005-01  | Valid/repeated unsubscribe token confirmation and actual deletion; malformed token returns 400.                                       |
| TC-NFR-008-01  | Shared limits across two instances and proxy addresses, including fail-closed limiter configuration.                                  |
| TC-OPS-009-01  | Explicit read-only QA database inspection of real grants/policies/storage, plus isolated negative inventory fixture.                  |
| TC-STK-004-01  | Real concurrent edits and injected failures keep size and aggregate inventory atomic.                                                 |
| TC-ORD-03-CORE | Implement/review G-07 option rendering, then verify persisted size/color on customer and admin order detail.                          |
| TC-REV-07-CORE | Implement/review the reply workflow and permissions, then verify saved/removed replies through real customer reads.                   |
| TC-NFR-06-CORE | Agree dataset/device/network and performance budgets before measuring acceptance; no invented SLA.                                    |
| TC-NFR-07-CORE | Reconcile demo claims, metric populations, concurrent orders and mail with actual staging capability.                                 |

Some frozen scenario notes describe older implementations. Preserve their target assertions; review current source/requirements provenance before retiring historical gaps. Passing local SQL tests alone does not update the accepted deployed baseline.

Staging needs a separate HTTPS Zeouf URL and Supabase project, disposable confirmed U-A/U-B and named admin identities, verified products/stock, controlled inbox/provider settings and scoped cleanup. Capture before/after persisted values and remove only those fixtures. Use the existing staging gate and verified backend isolation before any authenticated integration run. Never point these mutation cases at the shared public demo.

## Final execution, 22 October 2026

The finalized runner passed all **86 native checks**, with unchanged tracked website inputs:

| Layer                                             | Passed |
| ------------------------------------------------- | -----: |
| Documentation regressions                         |     13 |
| In-memory PostgreSQL purchase/catalog regressions |     19 |
| Native UI/handler suite                           |     32 |
| Native catalog suite                              |      9 |
| Native public read-only suite                     |     13 |

All three repository case groups, TC-OPS-06-CORE/07-CORE/08-CORE, have passing local native evidence. Each browser suite used one worker and zero retries, with no skips/flaky results. Documentation check → sync → check also passed without changing tracked website inputs. `npm run check` passed, including all **48 framework script regressions** and the existing 260 browser mappings.

Evidence is in `test-results/native-remaining-final/`, including `result.json`, source hashes, Node TAP logs, browser discovery/results and distinct artifact directories. `test-results/native-remaining-verified/` retains the earlier complete passing run. The first wrapper attempt, `test-results/native-remaining-run1/`, retains a discovery-output parsing error after its 13 documentation and 19 SQL tests passed; it is not counted as a complete native pass. Discovery now writes JSON to stdout separately from execution report files.

The separate registry `requirements/non-browser-check-links.json` connects these native layers and manual findings to case IDs. The manual technical review records G-20 and excludes the unused countdown, while future behavior remains undecided. **17 cases remain for staging or implementation/scope decisions**, plus unfinished acceptance inside already partially covered cases. The browser monitoring snapshot remains 259 passes and one retained navigation failure; native smoke passes do not erase it. The new manual workflow `.github/workflows/ecommerce-native.yml` is implemented but has not run on GitHub Actions. No website behavior was changed, and no staging or full acceptance is claimed.
