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

Pre-commit hooks will run `eslint --fix` and `prettier --write` on staged `.ts` files via `lint-staged`. If you need help, open an issue or ping a maintainer.
