# Custom Static Analysis

This repository includes a small project-specific static analysis CLI at [scripts/static-analysis.js](../scripts/static-analysis.js).

## What It Checks

- Specs in `tests/` should import `test` and `expect` from [fixtures/base.ts](../fixtures/base.ts).
- Specs in `tests/` should not contain hardcoded locator calls or direct navigation details.
- Flows in `flows/` should orchestrate steps only and avoid assertions.
- Page objects in `pages/` should not import test files.

## How To Run

```powershell
npm run analyze
```

The command exits with a non-zero status when it finds a violation, so it can be used locally or in CI.