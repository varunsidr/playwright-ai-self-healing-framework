# Zeouf requirements snapshot

These files are a read-only input snapshot copied from the separate Zeouf website repository at commit `481a090` on 2026-10-06:

- `BRD.md` (version 1.5, draft for business and QA review)
- `QA_TESTING_GUIDE.md`
- `REQUIREMENTS_TRACEABILITY.csv`

The website repository owns these documents. Refresh this snapshot from a reviewed website revision before claiming coverage against a new build. Preserve requirement IDs and record the revision used for every generated case and execution result. The copied CSV is source input, not this framework's live execution report; do not overwrite it with unverified pass claims.

`requirement-updates.json` records a scoped CAT-07 revision from the website's BRD v1.9 and QA guide at commit `243b37ddf2a7f1eb46c3cf2f369daaa2088a4ebb`, including its 2026-10-09 documentation review and exact source links. The current count contract is `Showing {visible} of {matching} products`, including every pagination batch and filtered result. The generator applies only this requirement and its linked guide scenario over the original snapshot, retaining their IDs and explicit revision provenance. Other requirements remain on the original baseline; this is not a full v1.9 refresh or a claim of business sign-off.

Run `npm run cases:zeouf:catalog` to rebuild `case-catalog.json` and `CASE_CATALOG.md` from the snapshot, the QA guide's seeded cases, `guide-case-environments.json`, `additional-cases.json`, `core-case-designs.json`, and `case-links.json`. The generated catalog contains first-pass case scenarios and execution environments for all 116 requirements. The 54 core designs are human-curated additions to the guide's seeded cases. Every scenario still needs tester review against the BRD and may need more boundary cases, fixture data, and detailed execution steps. `case-links.json` records only reviewed automation links and the scope of observed evidence; it does not promote partial checks into full requirement acceptance.

An automation link has a primary `automationFile` and may list `additionalAutomationFiles` when several specs cover different parts of the same case. The generator validates every referenced path and includes all linked files in both catalog outputs. Record partial scope and current failures in `automationScope` and `lastEvidence`; retaining an older passing result alone would hide a regression.

`check-links.json` is a separate reviewed overlay for individual automated checks. Its stable IDs appear as `zeouf-check` annotations and link to existing catalog case IDs and reviewed spec paths. Original tests declare their annotation explicitly; expanded mappings use an exact `testTitle` and file selector, attached by the base fixture. `npm run cases:zeouf:mappings` verifies each entry resolves to exactly one discovered ecommerce-chromium test and rejects missing, duplicate, or conflicting selectors. Preserve the ID and update the reviewed selector when renaming a test. This does not alter the copied requirements. See [case execution monitoring](../../../docs/ecommerce-ci-monitoring.md) for evidence semantics and the [all-case backlog](../automation-backlog.md) for outstanding work.

The public Zeouf deployment is read-only for testing. Authenticated, email, checkout, review, stock and admin acceptance needs an isolated staging deployment with a separate Supabase project, controlled identities and inboxes, and verified cleanup. A skipped, mocked, helper-seeded or unexecuted case is not a passed live requirement.

The framework's full staging gate uses `ECOMMERCE_BASE_URL`, `ECOMMERCE_STAGING_CONFIRMED=true`, and disposable `ECOMMERCE_TEST_USER_EMAIL`/`ECOMMERCE_TEST_USER_PASSWORD` secrets. The URL must be a separate HTTPS host. This is a configuration check, not proof that its Supabase project is isolated. The operator must confirm backend credentials and cleanup before setting the flag. Public browser-local cart fixtures use only localStorage and block non-read requests.
