# Zeouf case execution monitoring

The current v2.0 manifest contains **304 individually mapped checks for 93/140 cases**: **128 public-safe and 176 isolated frontend/local-handler checks**. Native documentation, SQL, assistant, restock, photo and observational audit evidence is registered separately. See the [generated backlog](../specs/ecommerce/automation-backlog.md) and [current execution plan](../specs/ecommerce/27-reviewed-baseline-scenarios.md) for fresh results and remaining scope. A mapping or fixture pass does not certify complete BRD acceptance. The dated October batches below retain their historical inventories and failures.

Final local verification on 5 November 2026 passed all **304 checks**, with matching catalog/manifest hashes, zero retries/skips/flaky results, no runner errors and no unmapped tests. The current snapshot is also retained in `test-results/scenarios-2026-11-05/monitoring.json` and `.md`; its primary reports are `public-complete/results.json` and `isolated-postfix/results.json`. Earlier failed migrations and the public homepage connection reset remain in their original report directories. A later pass does not prove the connection reset's cause is fixed.

On 26 October 2026, the unchanged CAT-07 pagination-reset regression passed three repetitions and all 30 related catalog checks passed after the developer reported the fix. Subsequent complete runs passed **154 public-safe and 135 isolated checks**, with zero retries/skips/failures and matching then-current inventory hashes. Their reports remain in `test-results/docs-ready-public-2026-10-26/` and `test-results/docs-ready-isolated-2026-10-26/`. The earlier 288-pass/one-failure snapshot is archived under `test-results/docs-ready-previous-monitoring-2026-10-26/`; its raw reports are unchanged. Repeat-each reports remain separate diagnostics. These historical passes do not prove acceptance of the refreshed baseline or a new GitHub CI result.

Historical focused navigation recheck on 22 October: the unchanged TC-CAT-003-02 passed ten repetitions, and its surrounding catalog-refinement file passed 21 checks across three runs. All 31 checks used one worker and zero retries, with no skips/flaky results or source changes. Every original pending chunk URL completed with HTTP 200 in each focused repetition; all 31 diagnostic snapshots had zero pending/failed scripts and page errors. Evidence is retained at `test-results/navigation-timeout-recheck-2026-10-22/`. The original timeout was not reproduced and its cause remains unresolved. This targeted evidence does not replace the earlier full-suite failure, prove a fix or certify GitHub Actions.

The Git case catalog remains the planning inventory. This increment adds a reviewed manifest, stable individual-check annotations, and a batch execution report. It requires no external test-management subscription.

`specs/ecommerce/requirements/check-links.json` owns the stable browser check inventory, including parameterized boundaries. Native website checks and dated reviews use `non-browser-check-links.json` and remain outside browser-project totals. The application and framework repositories have independent revisions and deployment cycles.

Original checks have explicit source annotations. Expanded checks use exact `testTitle`, file and project selectors in the manifest, attached by an automatic base fixture. `npm run cases:zeouf:mappings` discovers tests without running the browser and rejects selectors that match zero or multiple tests, duplicate selectors and conflicting source IDs. Keep the stable ID when changing a title and update its reviewed selector. `npm run test:mappings` verifies these failure conditions.

The base fixture blocks non-read browser requests outside a confirmed separate staging host and fails if a test attempts a write. The read-only runner uses an explicit allowlist and forces the staging flag off. It never auto-discovers staging specs.

## Generate local evidence

Run from the repository root. Playwright now produces a JSON report locally as well as in CI. Give each batch separate output paths to preserve prior evidence. For example, in PowerShell:

```powershell
$env:PW_OUTPUT_DIR = 'test-results/read-only-run'
$env:PW_HTML_REPORT_DIR = 'playwright-report/read-only-run'
$env:PW_JSON_REPORT_PATH = 'test-results/read-only-run-results.json'
npm.cmd run test:ecommerce:read-only -- --retries=0

npm.cmd run monitor:ecommerce -- test-results/read-only-run-results.json
```

Continue to generate monitoring after failures. The category membership fixtures cover Women's products leaking into Men's Jackets and Trousers; see the [developer fix](zeouf-men-category-regression.md). Preserve those assertions and report failures. The earlier desktop Escape fix has been verified on the deployment.

The [17 October CI investigation](ecommerce-ci-failure-2026-10-17.md) records the runner-dependent currency correction, current website patch and separate live/candidate verification evidence.

Outputs are `test-results/ecommerce-monitoring.json` and `test-results/ecommerce-monitoring.md`. The Markdown is readable case evidence; the JSON includes check IDs, observed test titles, project/file validation, retry attempts, report hashes and attachment paths. Preserve these outputs with their source JSON reports, HTML reports and failure artifacts. Local summaries overwrite the previous monitoring snapshot; copy them into your chosen run archive when retaining history.

## Product navigation diagnostics

Product selection records the selected card's destination and name, clicks its link and waits for that exact URL. Product readiness then checks the matching product heading, cart and favorite actions, quantity and review controls. A collection heading alone cannot satisfy product readiness. Quantity changes and the guest review restriction retain their existing assertions.

The ecommerce base fixture observes document, fetch, XHR and script requests without intercepting them. Unexpected results attach `navigation-diagnostics` JSON with request timings, status, pending/finished/failed state, RSC and prefetch flags, main-frame URL changes, page errors and console errors. Request records omit URL queries and fragments; error messages remain diagnostic text. The attachment records no request headers or bodies. Collection is capped at 500 requests and 200 events, with omitted counts reported.

Set `$env:ECOMMERCE_NAVIGATION_DIAGNOSTICS = '1'` before running to retain this attachment for passing tests too. Without that setting, attachments are retained only for unexpected results. These observations support investigation; they do not establish the cause of a navigation failure by themselves.

On 21 October 2026, the complete read-only allowlist passed against `https://zeouf-luxury-fashion-ecommerce.vercel.app`: **144 passed, zero failed/skipped/flaky, zero retries**, with one worker. This includes the previously failing product quantity/review check and all three checks using product selection. All 144 results contain navigation diagnostics, and the three affected TypeScript files retained their recorded hashes during validation. `npm run check` also passed, including 38 script regression tests. The raw report, HTML report, source hashes, validation summary and monitoring copies are under `test-results/navigation-resume-2026-10-21/`. The prior monitoring snapshot is preserved in its `previous-monitoring/` directory; its original failed run remains separate evidence. That run's monitoring snapshot reported 144 passing checks mapped to 41 of 108 cases, with 67 cases unlinked and full acceptance still not assessed. This is working-tree evidence; no clean framework commit or independently verified deployed website revision is claimed.

## Isolated browser contracts

The [first browser-only plan](../specs/ecommerce/21-browser-only-remaining-cases.md) adds 43 checks for 16 previously unmapped cases and deeper quantity coverage. The [admin and guest-cart continuation](../specs/ecommerce/22-browser-only-admin-and-guest.md) adds 26 checks for another 18 cases. The [account/stock/analytics continuation](../specs/ecommerce/23-browser-only-accounts-stock-analytics.md) adds 28 checks for 11 more cases, including independently sourced reviewed analytics rules. At that stage the inventory contained 241 checks across 86 of 108 cases. Together these batches exercise actual Zeouf UI with fake sessions and locally fulfilled service contracts: product options, checkout validation/retry, account feedback, favorites, reviews, restock, region resolution, admin filters/forms/metrics and interrupted guest add. Non-US region-header checks call the real isolated GET route. The admin-flag denial check calls the actual isolated order GET and stock PATCH without a signed cookie; the pinned early guard returns 401 before any backend operation. The additional production-denial checks exercise actual local helper guards and review DELETE without a signed cookie. No valid-admin, migrated database, order, subscription, stock or email acceptance is inferred.

The [recovery and loading continuation](../specs/ecommerce/24-browser-only-recovery-and-loading.md) added 19 checks within eight already mapped cases: reset feedback, newsletter validation, customer history states, client checkout submission/attempt keys, analytics pending reads/retry and review-image selection/removal. At that stage, 22 cases remained unlinked because those browser contracts did not replace their required environment or decision. Client retry-key tests do not establish backend idempotency.

Historical recovery/loading validation: 116 isolated passes and 143 public passes, with one public navigation timeout retained. That combined primary snapshot shows 259 passes and one failure. The unchanged failing check passed three diagnostic repeat iterations, archived separately because repeat-each spec identities differ. Do not rewrite report identities to bypass the monitoring guard or use those passes to erase the primary failure. Full acceptance and GitHub Actions were unverified in that batch; see plan 24 for artifact paths.

The [browser/service-boundary continuation](../specs/ecommerce/26-remaining-browser-and-service-boundaries.md) adds 29 checks, including 19 local handler checks for NFR-08/RST-05, and records the subsequent pagination-fix verification. Local APIRequestContext requests bypass browser interception; the isolated fixture's loopback/configuration checks and credential-free production build keep those requests away from the public deployment.

Run `npm run test:ecommerce:isolated -- <clean-Zeouf-checkout> <new-evidence-directory>`. The runner copies the exact source commit into a short temporary path, rejects environment files, builds with placeholder services, starts a fresh loopback server and runs one attempt per check. It records source identity, framework-input hashes, raw JSON/HTML, local request-contract attachments and a result summary. Tests fail on an unhandled write/fixture-service request, missing mapping, changed protected inputs, skip, retry or failed check. Ordinary public runs exclude these specs; mapping discovery includes them without executing them.

CI checks out reviewed website commit `df94db96826c3226abc77422d2234c7d3db92ea1` with credentials persistence disabled and runs this batch separately from public regressions. Its report joins public reports during monitoring. Update the pin through a reviewed source/test change; it does not track the deployed website automatically. Public and isolated reports have distinct origins/environment labels and must share the same case/manifest hashes to combine.

## Evidence semantics

- `passed` means the mapped automated check passed its assertions. Every case's full acceptance remains `not-assessed`; the manifest states the limited scope.
- `flaky`, `expected-failure`, `failed`, `interrupted`, `skipped`, `unknown`, `not-run` and `partial-run` remain distinct. A retry pass is flaky. A failure in one batch cannot be overwritten by a pass in another.
- Unlinked cases and cases with only file-level links remain visible without inferred execution evidence. A missing mapped check is not-run. No blocking diagnosis is inferred from a skip, timeout or planned staging environment.
- Missing reports and Playwright runner errors mark evidence incomplete. A complete set of reports does not imply complete test or acceptance coverage. Missing or failed setup is not a successful shopping journey.
- Unknown check annotations, conflicting project/file identity, reused IDs, malformed mappings and inventory hash mismatches fail report generation. Test titles can change without changing a stable check ID. Keep one check ID per test; multiple cases can reference a check.

## Revisions and environments

At execution, Playwright records hashes of the case catalog and check manifest. The monitoring command rejects mismatches when consuming newer inventory against an older recorded report. To examine historical reports, check out their original inventory revision. Older reports without hashes remain identifiable as having no inventory recorded at execution; unannotated legacy tests are not retrospectively promoted to mapped evidence.

`GITHUB_SHA` records code revision in CI. Local runs may supply `ECOMMERCE_CODE_REVISION`; leave it unset if an exact revision is unavailable. Label dirty working-tree evidence honestly rather than claiming it matches a clean commit. `ECOMMERCE_BUILD_REVISION` is optional operator-supplied website revision metadata, not an independently verified deployment revision. Unknown values remain null. The metadata retains only the configured ecommerce URL origin and a public-read-only, isolated-staging-declared or isolated-browser-fixture environment label. The isolated runner records its copied source revision; this does not establish live backend isolation or deployment identity.

## CI integration

The public workflow validates all check selectors, runs public API smoke checks separately, and runs the entire browser allowlist once through `test:ecommerce:read-only`. This includes the former fixture, navigation and pilot batches plus the newly covered frontend cases. Confirmed staging retains its gated full ecommerce run. An always-run step builds combined evidence and appends it to the GitHub Actions job summary. JSON/Markdown evidence is included in the existing test-results artifact, whose retention is 30 days. Website revision remains operator-supplied when configured. Public API checks currently remain unannotated in case monitoring; the browser project includes a separately mapped read-only health check.

`npm run test:monitoring` exercises mapping validation, status semantics, cross-batch failures, missing reports, inventory revision conflicts, Windows paths and retry evidence using synthetic reports. It is also part of `npm run check`. Synthetic tests establish reporter behavior, not live storefront acceptance.

The separate [controlled failure and locator-repair rehearsal](ecommerce-repair-evaluation.md) has its own archived evidence and manual CI workflow. It does not change ordinary case-monitoring outcomes or establish autonomous repair accuracy. The [repair orchestrator](ecommerce-auto-repair.md) also has separate diagnosis/proposal/verification gates; its workflow and publication validation must be assessed independently. Historical trend storage, a dashboard and generalized source-change impact analysis remain future work.

Public job metadata verified successful ordinary [Playwright CI](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/runs/39836915057) and [quality-gate CI](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/runs/39836914886) for framework commit `2be4a094cace7a7665fa422026209401cb2ea921`, starting on 23 October 2026 IST. The public-safe and isolated steps ran; deployment pinning and staging were skipped. This does not verify a later local working tree, individual retry counts, the native workflow or repair publication. A new pushed commit requires fresh CI.

## Native repository evidence

The [reviewed baseline continuation](../specs/ecommerce/27-reviewed-baseline-scenarios.md) and non-browser registry keep native evidence separate from browser monitoring. The current expanded native runner passed 209 checks: 13 documentation, 27 purchase SQL, 8 restock SQL, 50 UI/handler, 27 catalog, 71 assistant and 13 public read-only. The photo audit also passed. Source inputs were unchanged; live integration and provider acceptance remain separate.

Current native evidence is under test-results/scenarios-2026-11-05/native/. Earlier native-remaining-final evidence retains its October revision and counts. The manual native workflow retains separate artifacts and supplies no backend credentials; no fresh CI execution is claimed. Native tests do not increase browser totals or erase historical failures.
