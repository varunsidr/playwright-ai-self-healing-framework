# Custom Static Analysis

This repository includes a small project-specific static analysis CLI at [scripts/static-analysis.js](../scripts/static-analysis.js).

## What It Checks

- UI specs should import from [fixtures/base.ts](../fixtures/base.ts), while API specs should import from [fixtures/api-fixtures.ts](../fixtures/api-fixtures.ts).
- UI specs should not contain hardcoded locator calls or direct navigation details.
- Type-only imports from `@playwright/test` are allowed; runtime test APIs must come from a project fixture.
- Flows in `flows/` should orchestrate steps only and avoid assertions.
- Page objects in `pages/` should not import test files.

## How To Run

```powershell
npm run analyze
```

The command exits with a non-zero status when it finds a violation, so it can be used locally or in CI.
