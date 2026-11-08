# Zeouf requirements snapshot

The current reviewed baseline is **BRD v2.0 at `df94db96826c3226abc77422d2234c7d3db92ea1`**, imported on 2 November 2026. It contains **137 requirements and 140 cases**, including 32 cases added since the October baseline. See [plan 27](../27-reviewed-baseline-scenarios.md) for current execution, new-case coverage and remaining work. Native website checks and dated source findings remain separately registered in `non-browser-check-links.json`; they do not inflate browser totals or establish full requirement acceptance.

These files are read-only inputs from that reviewed website revision:

- `BRD.md` (version 2.0; source review is not stakeholder sign-off)
- `QA_TESTING_GUIDE.md`
- `REQUIREMENTS_TRACEABILITY.csv`
- `requirements-reviews.json` and `requirements-source-snapshot.json`

The website repository owns these documents. Refresh this snapshot from a reviewed website revision before claiming coverage against a new build. Preserve requirement IDs and record the revision used for every generated case and execution result. The copied CSV is source input, not this framework's live execution report; do not overwrite it with unverified pass claims.

`source-baseline.json` pins the full revision, source links and SHA-256 hashes of all five inputs. Catalog generation rejects document drift. The October baseline and its evidence remain in `history/2026-10-26/`; historical CAT-07 and analytics overlay files remain for their dated provenance and regression tests. The current generator uses the complete v2.0 snapshot rather than applying those overlays to an older baseline.

The reviewed count contract remains `Showing {visible} of {matching} products`. Active order metrics exclude cancelled orders and customer signal uses approved reviews. Source review alone does not verify these behaviors on the deployed website.

Run `npm run cases:zeouf:catalog` to rebuild `case-catalog.json` and `CASE_CATALOG.md` from the snapshot, guide cases, environment/design overlays and `case-links.json`. The current catalog has 67 guide cases and 73 curated cases, with explicit environments for all 140. Stable earlier core IDs remain when the new guide adds a case for the same requirement. Presentation examples are not requirement-linked cases. Cases still need detailed tester review and may need additional boundaries. Automation links record scoped evidence, not complete acceptance.

An automation link has a primary `automationFile` and may list `additionalAutomationFiles` when several specs cover different parts of the same case. The generator validates every referenced path and includes all linked files in both catalog outputs. Record partial scope and current failures in `automationScope` and `lastEvidence`; retaining an older passing result alone would hide a regression.

`check-links.json` is a separate reviewed overlay for individual automated checks. Its stable IDs appear as `zeouf-check` annotations and link to existing catalog case IDs and reviewed spec paths. Original tests declare their annotation explicitly; expanded mappings use an exact `testTitle` and file selector, attached by the base fixture. `npm run cases:zeouf:mappings` verifies each entry resolves to exactly one discovered ecommerce-chromium test and rejects missing, duplicate, or conflicting selectors. Preserve the ID and update the reviewed selector when renaming a test. This does not alter the copied requirements. See [case execution monitoring](../../../docs/ecommerce-ci-monitoring.md) for evidence semantics and the [all-case backlog](../automation-backlog.md) for outstanding work.

The public Zeouf deployment is read-only for testing. Authenticated, email, checkout, review, stock and admin acceptance needs an isolated staging deployment with a separate Supabase project, controlled identities and inboxes, and verified cleanup. A skipped, mocked, helper-seeded or unexecuted case is not a passed live requirement.

The framework's full staging gate uses `ECOMMERCE_BASE_URL`, `ECOMMERCE_STAGING_CONFIRMED=true`, and disposable `ECOMMERCE_TEST_USER_EMAIL`/`ECOMMERCE_TEST_USER_PASSWORD` secrets. The URL must be a separate HTTPS host. This is a configuration check, not proof that its Supabase project is isolated. The operator must confirm backend credentials and cleanup before setting the flag. Public browser-local cart fixtures use only localStorage and block non-read requests.
