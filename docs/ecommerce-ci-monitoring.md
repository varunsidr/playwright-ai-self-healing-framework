# Zeouf case execution monitoring

The Git case catalog remains the planning inventory. This increment adds a reviewed manifest, stable individual-check annotations, and a batch execution report. It requires no external test-management subscription.

`specs/ecommerce/requirements/check-links.json` maps 144 individual browser checks to 41 cases. Every public-safe browser check has an individual mapping, including parameterized boundaries. The 108-case inventory still has 67 cases without individual checks; see the [generated backlog](../specs/ecommerce/automation-backlog.md). None of these mappings certifies complete BRD acceptance.

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

Continue to generate monitoring after failures. The new category membership fixtures expose Women's products leaking into Men's Jackets and Trousers; see the [developer fix](zeouf-men-category-regression.md). Preserve those assertions and report failures. The earlier desktop Escape fix has been verified on the deployment.

Outputs are `test-results/ecommerce-monitoring.json` and `test-results/ecommerce-monitoring.md`. The Markdown is readable case evidence; the JSON includes check IDs, observed test titles, project/file validation, retry attempts, report hashes and attachment paths. Preserve these outputs with their source JSON reports, HTML reports and failure artifacts. Local summaries overwrite the previous monitoring snapshot; copy them into your chosen run archive when retaining history.

## Evidence semantics

- `passed` means the mapped automated check passed its assertions. Every case's full acceptance remains `not-assessed`; the manifest states the limited scope.
- `flaky`, `expected-failure`, `failed`, `interrupted`, `skipped`, `unknown`, `not-run` and `partial-run` remain distinct. A retry pass is flaky. A failure in one batch cannot be overwritten by a pass in another.
- Unlinked cases and cases with only file-level links remain visible without inferred execution evidence. A missing mapped check is not-run. No blocking diagnosis is inferred from a skip, timeout or planned staging environment.
- Missing reports and Playwright runner errors mark evidence incomplete. A complete set of reports does not imply complete test or acceptance coverage. Missing or failed setup is not a successful shopping journey.
- Unknown check annotations, conflicting project/file identity, reused IDs, malformed mappings and inventory hash mismatches fail report generation. Test titles can change without changing a stable check ID. Keep one check ID per test; multiple cases can reference a check.

## Revisions and environments

At execution, Playwright records hashes of the case catalog and check manifest. The monitoring command rejects mismatches when consuming newer inventory against an older recorded report. To examine historical reports, check out their original inventory revision. Older reports without hashes remain identifiable as having no inventory recorded at execution; unannotated legacy tests are not retrospectively promoted to mapped evidence.

`GITHUB_SHA` records code revision in CI. Local runs may supply `ECOMMERCE_CODE_REVISION`; leave it unset if an exact revision is unavailable. Label dirty working-tree evidence honestly rather than claiming it matches a clean commit. `ECOMMERCE_BUILD_REVISION` is optional operator-supplied website revision metadata, not an independently verified deployment revision. Unknown values remain null. The metadata retains only the configured ecommerce URL origin and a public-read-only or isolated-staging-declared environment label; neither proves backend isolation.

## CI integration

The public workflow validates all check selectors, runs public API smoke checks separately, and runs the entire browser allowlist once through `test:ecommerce:read-only`. This includes the former fixture, navigation and pilot batches plus the newly covered frontend cases. Confirmed staging retains its gated full ecommerce run. An always-run step builds combined evidence and appends it to the GitHub Actions job summary. JSON/Markdown evidence is included in the existing test-results artifact, whose retention is 30 days. Website revision remains operator-supplied when configured. Public API checks currently remain unannotated in case monitoring; the browser project includes a separately mapped read-only health check.

`npm run test:monitoring` exercises mapping validation, status semantics, cross-batch failures, missing reports, inventory revision conflicts, Windows paths and retry evidence using synthetic reports. It is also part of `npm run check`. Synthetic tests establish reporter behavior, not live storefront acceptance.

The next increment adds a [controlled failure and locator-repair rehearsal](ecommerce-repair-evaluation.md), with its own archived evidence and manual CI workflow. It does not change the case-monitoring outcomes or establish autonomous repair accuracy. Historical trend storage, a dashboard, source-change impact analysis and independently assessed agent proposals remain future work. Both workflows must still be verified on actual GitHub runners.
