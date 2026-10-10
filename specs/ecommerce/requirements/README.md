# Zeouf requirements snapshot

These files are a read-only input snapshot copied from the separate Zeouf website repository at commit `481a090` on 2026-10-06:

- `BRD.md` (version 1.5, draft for business and QA review)
- `QA_TESTING_GUIDE.md`
- `REQUIREMENTS_TRACEABILITY.csv`

The website repository owns these documents. Refresh this snapshot from a reviewed website revision before claiming coverage against a new build. Preserve requirement IDs and record the revision used for every generated case and execution result. The copied CSV is source input, not this framework's live execution report; do not overwrite it with unverified pass claims.

Run `npm run cases:zeouf:catalog` to rebuild `case-catalog.json` and `CASE_CATALOG.md` from the snapshot, the QA guide's seeded cases, `guide-case-environments.json`, `additional-cases.json`, `core-case-designs.json`, and `case-links.json`. The generated catalog contains first-pass case scenarios and execution environments for all 116 requirements. The 54 core designs are human-curated additions to the guide's seeded cases. Every scenario still needs tester review against the BRD and may need more boundary cases, fixture data, and detailed execution steps. `case-links.json` records only reviewed automation links and the scope of observed evidence; it does not promote partial checks into full requirement acceptance.

An automation link has a primary `automationFile` and may list `additionalAutomationFiles` when several specs cover different parts of the same case. The generator validates every referenced path and includes all linked files in both catalog outputs. Record partial scope and current failures in `automationScope` and `lastEvidence`; retaining an older passing result alone would hide a regression.

`check-links.json` is a separate reviewed overlay for individual automated checks. Its stable IDs appear as `zeouf-check` annotations on pilot tests and link to existing catalog case IDs and reviewed spec paths. It does not alter the copied requirements or generated catalog. See [case execution monitoring](../../../docs/ecommerce-ci-monitoring.md) for CI evidence generation and status semantics.

The public Zeouf deployment is read-only for testing. Authenticated, email, checkout, review, stock and admin acceptance needs an isolated staging deployment with a separate Supabase project, controlled identities and inboxes, and verified cleanup. A skipped, mocked, helper-seeded or unexecuted case is not a passed live requirement.

The framework's full staging gate uses `ECOMMERCE_BASE_URL`, `ECOMMERCE_STAGING_CONFIRMED=true`, and disposable `ECOMMERCE_TEST_USER_EMAIL`/`ECOMMERCE_TEST_USER_PASSWORD` secrets. The URL must be a separate HTTPS host. This is a configuration check, not proof that its Supabase project is isolated. The operator must confirm backend credentials and cleanup before setting the flag. Public browser-local cart fixtures use only localStorage and block non-read requests.
