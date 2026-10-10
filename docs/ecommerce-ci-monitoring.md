# Zeouf case execution monitoring

The Git case catalog remains the planning inventory. This increment adds a reviewed manifest, stable individual-check annotations, and a batch execution report. It requires no external test-management subscription.

`specs/ecommerce/requirements/check-links.json` maps ten check IDs to nine existing cases. Eight checks cover public validation, browser-local recovery, newsletter preview, search and product information. Two additional checks cover desktop Women/Men focus return and retain the existing acceptance assertions. This pilot does not map all 32 file-linked cases or certify any complete BRD requirement.

## Generate local evidence

Run from the repository root. Playwright now produces a JSON report locally as well as in CI. Give each batch separate output paths to preserve prior evidence. For example, in PowerShell:

```powershell
$env:PW_OUTPUT_DIR = 'test-results/monitoring-pilot'
$env:PW_HTML_REPORT_DIR = 'playwright-report/monitoring-pilot'
$env:PW_JSON_REPORT_PATH = 'test-results/monitoring-pilot-results.json'
npm.cmd run test:ecommerce:monitoring-pilot

$env:PW_OUTPUT_DIR = 'test-results/monitoring-navigation'
$env:PW_HTML_REPORT_DIR = 'playwright-report/monitoring-navigation'
$env:PW_JSON_REPORT_PATH = 'test-results/monitoring-navigation-results.json'
npx.cmd playwright test tests/ecommerce/navigation-accessibility.spec.ts --project=ecommerce-chromium --grep 'desktop.*disclosure'

npm.cmd run monitor:ecommerce -- test-results/monitoring-pilot-results.json test-results/monitoring-navigation-results.json
```

The navigation command may fail the desktop focus assertions. Continue to generate the monitoring report after test failure; a failed check is evidence, not a reason to suppress the report. Public tests retain the non-read request guard.

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

The public workflow runs the eight read-only pilot tests in their own report/artifact directories. The existing navigation batch supplies the two desktop checks. Confirmed staging uses its existing full ecommerce run. An always-run step builds the combined case report and appends it to the GitHub Actions job summary. JSON/Markdown evidence is included in the existing test-results artifact, whose retention is 30 days. Each browser invocation records the same website revision variable when configured.

`npm run test:monitoring` exercises mapping validation, status semantics, cross-batch failures, missing reports, inventory revision conflicts, Windows paths and retry evidence using synthetic reports. It is also part of `npm run check`. Synthetic tests establish reporter behavior, not live storefront acceptance.

The next increment adds a [controlled failure and locator-repair rehearsal](ecommerce-repair-evaluation.md), with its own archived evidence and manual CI workflow. It does not change the case-monitoring outcomes or establish autonomous repair accuracy. Historical trend storage, a dashboard, source-change impact analysis and independently assessed agent proposals remain future work. Both workflows must still be verified on actual GitHub runners.
