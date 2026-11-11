# Remaining local contracts — 9 November 2026

The website source remains the reviewed `df94db96826c3226abc77422d2234c7d3db92ea1` baseline: 137 requirements and 140 cases. Only the main hosted website is available, as confirmed by the owner. Production remains read-only. No website source, remote database, account, order, stock, review or email was changed.

## Added executable coverage

The new `tests/ecommerce/contracts/` suite executes the actual pinned TypeScript checkout/review handlers in a controlled module context. It supplies fictional auth, RPC, rate-limit and storage dependencies, uses the real pinned NextResponse implementation, rejects unknown imports, and prevents network requests from the handlers. It does not replace handler code with test logic. The SQL suite applies the actual review migrations to in-memory PostgreSQL and changes database roles to exercise permissions.

| Cases         | Assertions                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-CHK-003-01 | Merged quantity 21, raw count 0/50/51, invalid UUID/quantities, and no purchase RPC on validation failure.                                                                                                                                                                                             |
| TC-CHK-009-04 | Missing/malformed attempt keys; nonstring and 30/31-character size or 40/41-character color boundaries; Number conversion; trimmed/sorted duplicate normalization; verified identity; safe purchase errors. Normalized replay payload is checked locally; real persisted replay remains separate.      |
| TC-REV-004-01 | Approved-only query despite approved=false input, newest-first order, 100-row query limit, public field allowlist, owned private photo signing, no-service photo fallback, safe read errors, anonymous/author PostgreSQL visibility. Query shape assertions do not establish hosted Supabase behavior. |
| TC-REV-004-02 | Pending-only server creation, verified author, trimmed fields, name/rating/comment/image boundaries, rejection of foreign image paths and unauthenticated writes. Real database roles cannot insert, approve, reply or delete directly; service moderation remains permitted.                          |

The first isolated run passed all 58 new checks, with zero skips/failures and unchanged website inputs. Its immutable evidence is under `test-results/remaining-coverage-2026-11-09/contracts-initial/`. The default isolated CI runner and the manual native runner both execute this new stage after installing pinned website dependencies. An individual run is available with:

```powershell
npm.cmd run test:ecommerce:contracts -- C:/path/to/clean-pinned-Zeouf test-results/new-contract-evidence
```

The checkout must be clean and at the reviewed website SHA, with its lockfile dependencies installed. Every run requires a new output directory. It records source hashes, nonempty TAP totals, failures and preserved logs; a nonzero test process, skipped tests or changed inputs cannot count as passing evidence.

Existing native tests also gain explicit mappings for TC-RST-002-01, TC-RST-004-01, TC-OPS-009-01 and TC-NFR-07-CORE. These cover already-executed subscription/queue SQL, catalog-inspector permission regression and dashboard metric/failed-read assertions. These four links are inventory corrections, not newly written tests. Exact scopes remain in `requirements/non-browser-check-links.json`.

Across all layers, scoped executable linkage rises from 127/140 to **135/140 cases (96.4%)**. Browser-only inventory stays **304 checks across 93 cases**, including 128 public-safe and 176 isolated checks. **135/137 requirements** have at least one scoped executable case. These percentages measure linkage, not full case acceptance or overall project completion.

## Remaining five cases without executable mappings

| Case           | Prerequisite / disposition                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-AST-002-02  | Explicitly configured real Groq smoke environment/provider access. Existing injected-model tests do not establish real-provider behavior.                                    |
| TC-CHK-007-01  | Separate staging database and two independent authenticated customers for last-unit purchase races.                                                                          |
| TC-STK-004-02  | Independent staging sessions for duplicate attempts, crossed orders and stock-edit/purchase races. A single PGlite connection cannot establish concurrency safety.           |
| TC-CNT-04-CORE | Countdown is outside current mounted UI acceptance; owner scope decision is needed before enabling it. Historical exclusion remains separate from current executed evidence. |
| TC-NFR-06-CORE | Agreed performance budgets, build, dataset and device/network conditions. Measurement tooling exists; no invented SLA or threshold pass is recorded.                         |

Mapped staging cases also retain unfinished hosted authentication, RLS/grants/migrations, persisted orders/stock, private storage, limiter, scheduler and email acceptance. Serious contrast findings from the earlier 15-sample audit remain open. Test coverage does not repair those website findings.

## Verification

The complete native run passed **267 checks**, including all 58 new contracts, with unchanged tracked website inputs. Documentation tooling, photo audit, SQL, native UI/catalog/assistant and public read-only checks passed. Evidence is under `test-results/remaining-coverage-2026-11-09/native-final/`.

The first isolated rerun retained **174 passes and two cart-startup failures** under `isolated-final/`. TC-CART-03-CORE opened a seeded bag before the account restored its contents; TC-CART-004-03's blocked-read scenario reached Start Shopping after initialization closed the drawer. The affected seeded/cart-currency/account scenarios now require the expected restored badge count before opening; blocked reads wait for the persistence notice to be attached inside the closed drawer. The notice locator includes hidden elements for this readiness check, while the existing visible-notice, empty-bag, quantity, subtotal, storage and action assertions remain intact. No retries, fixed sleeps, forced clicks or removed assertions were added. All three affected control/storage branches passed three repetitions (**9/9**) under `cart-readiness-focused/`.

The final fresh isolated runner passed **176/176 browser checks**, plus all **58/58 contracts**, with zero retries/skips/flaky results and unchanged framework inputs. Install, contracts, website lint/typecheck/build and browser verification all passed. Evidence is under `test-results/remaining-coverage-2026-11-09/isolated-verified/`. The 267-check native total includes the 58 new contracts; these are not 267 additional tests beyond that stage. The external 128-check public browser baseline remains separately dated 5 November and was not rerun in this increment; 13 native public live checks did pass in the fresh native run.

The full framework quality gate passed again after the readiness changes, including all 48 script regressions. Historical failed reports remain untouched. The last verified GitHub Actions run at the start of this work is the successful Playwright run `42509781472` on framework revision `574ff9ee0242a72b4ad699eaa59b8e5b199d76e7`; this new local work has not yet run in GitHub Actions.
