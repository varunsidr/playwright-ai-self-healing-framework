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

- Run lint and format locally:

```powershell
npm run lint
npm run format
```

- Run the test suite before pushing:

```powershell
npm test
```

For Zeouf BRD work, review the source snapshot and [case catalog](specs/ecommerce/requirements/CASE_CATALOG.md). Add or revise scenarios in the catalog input JSON files, then run `npm run cases:zeouf:catalog`. Put browser plans in `specs/ecommerce/` and tests in `tests/ecommerce/` using `fixtures/ecommerce-base` and project `ecommerce-chromium`. Link verified automation and its exact scope in `case-links.json`; a partial or unrun check is not accepted requirement coverage. Run `npm run test:ecommerce` and `npm run check` before proposing the change.

Public Zeouf runs are read-only. Account creation, checkout, review, stock, admin, and email-delivery checks need an isolated staging deployment with its own Supabase project, disposable identities, controlled inboxes, and verified cleanup. A confirmed account from `/api/test/seed-user` is a login fixture, not email-delivery evidence. See the [current automation status](specs/ecommerce/requirements/AUTOMATION_STATUS.md) for blockers.

For a full staging run, configure a separate HTTPS Zeouf URL in `ECOMMERCE_BASE_URL`, set `ECOMMERCE_STAGING_CONFIRMED=true` only after confirming separate Supabase credentials and cleanup, and supply an already confirmed disposable account through `ECOMMERCE_TEST_USER_EMAIL` and `ECOMMERCE_TEST_USER_PASSWORD`. Run `node scripts/verify-ecommerce-staging.js` before `npm run test:ecommerce`. In GitHub Actions, use repository variables for the URL/confirmation and secrets for the account. URL validation cannot prove backend isolation; verify it outside this framework. Signup/email confirmation needs its own controlled inbox and must observe the real signup path.

Pre-commit hooks will run `eslint --fix` and `prettier --write` on staged `.ts` files via `lint-staged`. If you need help, open an issue or ping a maintainer.
