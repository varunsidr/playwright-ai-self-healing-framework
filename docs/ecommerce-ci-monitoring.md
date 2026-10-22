# Zeouf case execution monitoring

Latest focused navigation recheck: the unchanged TC-CAT-003-02 passed ten repetitions, and its surrounding catalog-refinement file passed 21 checks across three runs. All 31 checks used one worker and zero retries, with no skips/flaky results or source changes. Every original pending chunk URL completed with HTTP 200 in each focused repetition; all 31 diagnostic snapshots had zero pending/failed scripts and page errors. Evidence is retained at `test-results/navigation-timeout-recheck-2026-10-22/`. The original timeout was not reproduced and its cause remains unresolved. This targeted evidence does not replace the earlier full-suite failure, prove a fix or certify GitHub Actions. Repeat-each reports remain separate diagnostic artifacts.

The Git case catalog remains the planning inventory. This increment adds a reviewed manifest, stable individual-check annotations, and a batch execution report. It requires no external test-management subscription.

`specs/ecommerce/requirements/check-links.json` maps 260 individual browser checks to 86 cases: 144 public-safe checks and 116 isolated browser contracts. Every public-safe browser check has an individual mapping, including parameterized boundaries. The 108-case inventory still has 22 cases without individual checks: 17 staging cases, three website-repository CI cases and two manual reviews; see the [generated backlog](../specs/ecommerce/automation-backlog.md). None of these mappings certifies complete BRD acceptance.

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

The [recovery and loading continuation](../specs/ecommerce/24-browser-only-recovery-and-loading.md) adds 19 checks within eight already mapped cases: reset feedback, newsletter validation, customer history states, client checkout submission/attempt keys, analytics pending reads/retry and review-image selection/removal. The 22 unlinked cases remain unlinked because these browser contracts do not replace their required environment or decision. Client retry-key tests do not establish backend idempotency.

Latest local validation for the recovery/loading batch: 116 isolated passes and 143 public passes, with one public navigation timeout retained. Combined primary monitoring shows 259 passes and one failure. The unchanged failing check passed three diagnostic repeat iterations, archived separately because repeat-each spec identities differ. Do not rewrite report identities to bypass the monitoring guard or use those passes to erase the primary failure. Full acceptance and GitHub Actions remain unverified; see plan 24 for artifact paths.

Run `npm run test:ecommerce:isolated -- <clean-Zeouf-checkout> <new-evidence-directory>`. The runner copies the exact source commit into a short temporary path, rejects environment files, builds with placeholder services, starts a fresh loopback server and runs one attempt per check. It records source identity, framework-input hashes, raw JSON/HTML, local request-contract attachments and a result summary. Tests fail on an unhandled write/fixture-service request, missing mapping, changed protected inputs, skip, retry or failed check. Ordinary public runs exclude these specs; mapping discovery includes them without executing them.

CI checks out website commit `843646b7d0c52ef5149f7905b19ec5d87fe5054b` with credentials persistence disabled and runs this batch separately from public regressions. Its report joins public reports during monitoring. Update the pin through a reviewed source/test change; it does not track the deployed website automatically. Public and isolated reports have distinct origins/environment labels and must share the same case/manifest hashes to combine.

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

The next increment adds a [controlled failure and locator-repair rehearsal](ecommerce-repair-evaluation.md), with its own archived evidence and manual CI workflow. It does not change the case-monitoring outcomes or establish autonomous repair accuracy. Historical trend storage, a dashboard, source-change impact analysis and independently assessed agent proposals remain future work. Both workflows must still be verified on actual GitHub runners.

## Native repository evidence

The [native completion plan](../specs/ecommerce/25-native-and-staging-completion.md) and `specs/ecommerce/requirements/non-browser-check-links.json` keep native website checks and manual source findings separate from browser monitoring. Run `npm run test:ecommerce:native -- <clean-pinned-website-checkout> <new-evidence-directory>`. The finalized local batch passed 13 documentation, 19 in-memory PostgreSQL, 32 UI/handler, 9 catalog and 13 public read-only tests, with unchanged tracked website inputs. All three repository case groups have local native evidence; the two manual reviews record a known gap and an unused component, not passed future behavior. Seventeen cases still need staging or implementation/scope decisions.

Native evidence is under `test-results/native-remaining-final/`. The new manual `.github/workflows/ecommerce-native.yml` retains separate native artifacts and supplies no backend credentials; it has not run on GitHub Actions. Native results do not modify browser check IDs/totals, erase the existing navigation failure, verify a mutable deployment revision or promote full case acceptance.
