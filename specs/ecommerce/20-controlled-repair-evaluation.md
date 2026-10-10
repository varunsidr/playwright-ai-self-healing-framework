# Controlled newsletter failure and repair evaluation

Target: Zeouf at `ECOMMERCE_BASE_URL`, project `ecommerce-chromium`; exploration seed remains `tests/ecommerce/seed.spec.ts`. Written acceptance: TC-CNT-001-01 / CNT-01, valid newsletter input produces a preview notice without saving or sending the email. The existing public test is unchanged.

Run the same evaluation spec and unchanged preview/no-write assertions in five fresh browser contexts:

| Stage                   | Browser-only change                               | Required observed result                        |
| ----------------------- | ------------------------------------------------- | ----------------------------------------------- |
| baseline                | None                                              | Pass                                            |
| locator-drift           | Rename the newsletter submit test ID              | Fail at the original submit locator             |
| locator-repair          | Same rename; use the proposed replacement locator | Pass with unchanged preview/no-write assertions |
| application-defect      | Replace the generated preview notice text         | Fail the original notice assertion              |
| environment-unavailable | Abort target document navigation                  | Fail navigation; record blocked requests        |

The orchestration command requires a passing baseline before injecting changes. If the target is unavailable or baseline behavior differs, retain the failure evidence and report the evaluation as blocked. Do not replace Zeouf with another application. Each stage blocks non-read requests. Changes exist only in a disposable browser context; no deployed website source, accounts, database, orders or persistent product data are changed.

This is a scripted evaluation harness and a locator-only repair rehearsal. The candidate is derived from an observed replacement test ID, constrained to the evaluation helper, and saved as a reviewable diff. It is not applied to the production page object. No human approval, autonomous AI diagnosis, merged repair or general repair accuracy is claimed. Three scripted decisions are compared to predefined scenario answers; this small known set is not an independent benchmark.

Intentional failures retain normal Playwright expectedStatus `passed`; do not add skip, fixme, expected-failure annotations, retries or weakened assertions. The orchestration succeeds only when the required failures, diagnoses, unchanged source hashes, and locator-only passing rerun are all observed. These results do not count toward live BRD case acceptance.
