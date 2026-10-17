# Zeouf CI failure investigation: 17 October 2026

The [failed Playwright Tests run](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/runs/39023802264) tested framework commit `81f92bfaeec53fa03b9d62125fa4b1b6f5919e0f`. GitHub's job API confirms dependency installation, mapping validation, demo tests and ecommerce API smoke passed; the expanded read-only browser step failed. Detailed logs and artifact downloads require authenticated GitHub access.

The [companion report-deployment run](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/runs/39023802258) ran the same framework commit and storefront origin. Its report was read from the public `gh-pages` branch, independently of the failed job's inaccessible artifact. It records these failures on all three attempts:

| Check                     | Evidence                                          | Correction                                                                                                                                |
| ------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dress price sorting       | INR parser received `$204` on the US runner       | Use the existing browser-local INR region fixture before navigation. Preserve the price parser, ascending-order and price-set assertions. |
| Men's trousers membership | Women's Trousers appears alongside Men's Trousers | Require selected main-collection membership in the website's ordinary subcategory filter.                                                 |
| Men's jacket membership   | Women's Jacket appears alongside Men's Jacket     | Apply the same main-collection guard.                                                                                                     |

The framework sorting correction changes only region setup. Currency selection and USD fallback remain covered separately by `currency-fixture.spec.ts`.

## Website patch

[zeouf-category-membership.patch](patches/zeouf-category-membership.patch) targets website commit `847e90aed04f5902449b0e36424b7a50a90eed61`, whose complete source tree was checked against GitHub tree `f06bb420f35645b7a70d48a6b9b46733dc3de403` before editing. It contains the category guard and the website's required BRD, QA guide and documentation-review records. It preserves acceptance criteria, tag-route handling and normalization.

From a clean website feature branch based on that revision, use the absolute path to the patch in this framework checkout:

```powershell
git apply --check C:/path/to/pw-mcp-demo/docs/patches/zeouf-category-membership.patch
git apply C:/path/to/pw-mcp-demo/docs/patches/zeouf-category-membership.patch
npm run docs:check
npm run lint
npm run build
```

If the website has advanced, review applicability and refresh its documentation review before publication. Merge and deploy the reviewed website correction, commit the framework region setup correction, then rerun the public browser suite against the deployment. A framework-only push cannot fix the deployed category filter.

## Validation

- `npm run check`: passed, including all 38 script regression tests and executable check-mapping validation.
- Sorting, four currency scenarios and storefront seed with CI settings, one worker and zero retries: 6 passed.
- Full live public suite after the sorting correction: 141 passed, 3 failed, zero retries/skips. The category defects remained; an additional accessories navigation check exceeded the existing five-second loading assertion. That accessories check then passed three independent zero-retry repetitions. The original failed attempt remains recorded and is not certified as a clean pass.
- Website patch: applies cleanly to the verified current website source; documentation checks, lint (zero errors, 28 existing warnings), type checking and isolated production build passed.
- Complete candidate verification from a frozen disposable framework checkout: **144 passed, zero failed/skipped/flaky, zero retries**. The verifier confirmed unchanged framework sources, all expected mapped checks and matching inventory hashes. An earlier 144-pass browser run in the live workspace was rejected by its wrapper because investigation documentation was added during execution; the frozen repeat supplies the valid verification result.

Raw reports and build logs are retained under `test-results/ci-currency-fix-results.json`, `test-results/ci-fix-live-results.json`, `test-results/ci-loading-recheck-results.json` and `test-results/ci-website-validation/`. The successful frozen verification, source/patch/report hashes and browser artifacts are in `test-results/ci-website-verification-frozen/`, with status in `result.json`. Browser output and artifacts remain Git-ignored. The open monitoring report reflects the live run, not the isolated candidate's passing result.

The isolated build uses placeholder backend configuration and browser-local fixtures. It establishes frontend regression behavior, not live database permissions, authenticated purchase behavior or deployed acceptance. No website PR, production deployment or GitHub repository setting was changed. Automatic repair remains an explicit repository opt-in; its skipped workflow is separate from the browser failure.
