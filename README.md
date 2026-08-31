# Playwright AI Self-Healing Framework

GitHub repo: https://github.com/varunsidr/playwright-ai-self-healing-framework

A compact Playwright TypeScript framework for the Expand Testing inputs page.
The project is intentionally lean, but it still keeps the main layers separated and highlights AI-assisted self-healing as a core theme:

- `tests/` for scenario specs
- `flows/` for orchestration
- `pages/` for page objects
- `fixtures/` for shared test setup and data
- `ARCHITECTURE.md` for the durable project map

## Highlights

- AI-assisted test repair and maintenance workflows
- Self-healing-friendly locator and fixture structure
- Thin but readable framework layers for long-term maintainability

## Getting Started

```powershell
npm install
npx playwright install
npm test
```

## Useful Scripts

- `npm test` runs the full suite
- `npm run test:headed` runs tests in headed mode
- `npm run report` opens the latest HTML report
- `npm run record` starts Playwright codegen for the inputs page

## Project Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) explains the framework layout and conventions
- [specs/README.md](specs/README.md) gives a short notes area for test plans
- [roadmap/FUTURE_ENHANCEMENTS.md](roadmap/FUTURE_ENHANCEMENTS.md) lists likely next steps

## Notes

Generated output folders such as `playwright-report/` and `test-results/` are ignored by Git and should stay out of the first push.