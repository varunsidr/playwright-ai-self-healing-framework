# Contributing

Thank you for contributing! Please follow these steps before opening a PR:

- Create a short-lived feature branch: `git checkout -b feat/<short-descriptor>`
- Install dependencies and prepare Husky hooks:

```powershell
npm ci
npm run prepare
```

If you need Playwright browsers installed locally, run:

```powershell
npx playwright install
```

On Windows PowerShell, if `npx` is blocked by execution policy, use `npx.cmd` instead:

```powershell
npx.cmd playwright install
```

- Run the quality gate locally:

```powershell
npm run check
```

- For Zeouf changes, run the public-safe suite with zero retries and a separate evidence directory before pushing. Follow the [tester guide](docs/ecommerce-tester-guide.md) to set the `PW_*` output paths so previous reports are retained:

```powershell
npm run test:ecommerce:read-only -- --workers=1 --retries=0
```

For Zeouf BRD work, review the source snapshot and [case catalog](specs/ecommerce/requirements/CASE_CATALOG.md). Add or revise scenarios in the catalog input JSON files, then run `npm run cases:zeouf:catalog`. Put browser plans in `specs/ecommerce/` and tests in `tests/ecommerce/` using the base or specialized storefront fixtures and project `ecommerce-chromium`. Link exact case scope in `case-links.json` and stable individual check IDs/selectors in `check-links.json`; a partial or unrun check is not accepted requirement coverage. Regenerate `npm run cases:zeouf:backlog` when mappings change. Catalog/manifest edits change evidence hashes, so retain the original reports and capture new results against the new inventory.

Use `npm run test:ecommerce:isolated -- <clean-website-checkout> <new-evidence-directory>` for isolated fixture and local-handler changes. Use the native runner separately for website-native evidence. `npm test` runs all configured projects, including the separate practice examples; `npm run test:ecommerce` includes staging-gated storefront specs. Choose the suites appropriate to the changed layer and retain failures rather than adding skips, retry masking or weaker assertions.

For documentation changes, keep [ARCHITECTURE.md](ARCHITECTURE.md), README, tester/monitoring guides and the relevant execution plan consistent. Record current results alongside dated historical failures. Do not claim full-suite or CI success from a focused recheck. Format only the edited Markdown files, for example:

```powershell
npx prettier --write ARCHITECTURE.md README.md CONTRIBUTING.md
npx prettier --check ARCHITECTURE.md README.md CONTRIBUTING.md
```

Check that relative links in edited files resolve from each document's directory. Raw `test-results/`, reports, credentials and disposable website checkouts stay ignored; commit the documentation, reviewed input JSON, regenerated catalog/backlog and source tests. Before pushing, review `git status --short`, `git diff --check` and your intended diff so new documents/specs are included and unrelated local work is preserved. A new commit needs its own GitHub Actions result; prior successful CI verifies only its recorded commit.

Public Zeouf runs are read-only. Account creation, checkout, review, stock, admin, and email-delivery checks need an isolated staging deployment with its own Supabase project, disposable identities, controlled inboxes, and verified cleanup. A confirmed account from `/api/test/seed-user` is a login fixture, not email-delivery evidence. See the [current automation status](specs/ecommerce/requirements/AUTOMATION_STATUS.md) for blockers.

For a full staging run, configure a separate HTTPS Zeouf URL in `ECOMMERCE_BASE_URL`, set `ECOMMERCE_STAGING_CONFIRMED=true` only after confirming separate Supabase credentials and cleanup, and supply an already confirmed disposable account through `ECOMMERCE_TEST_USER_EMAIL` and `ECOMMERCE_TEST_USER_PASSWORD`. Run `node scripts/verify-ecommerce-staging.js` before `npm run test:ecommerce`. In GitHub Actions, use repository variables for the URL/confirmation and secrets for the account. URL validation cannot prove backend isolation; verify it outside this framework. Signup/email confirmation needs its own controlled inbox and must observe the real signup path.

Pre-commit hooks will run `eslint --fix` and `prettier --write` on staged `.ts` files via `lint-staged`. If you need help, open an issue or ping a maintainer.
