# Future Enhancements

This file captures planned or likely improvements for the framework. Keep it practical: only document changes that would genuinely improve maintainability, reliability, or industry-standard alignment.

## Guiding Rule

Do not copy enterprise patterns blindly. Add structure only when the framework size, test volume, or maintenance burden justifies it.

## Potential Enhancements

### Framework Structure

- Expand the `flows/` layer when a scenario needs multi-step orchestration that is awkward inside a single page object.
- Add more page objects as the application grows beyond the inputs page.
- Introduce module-specific fixtures only when more than one test file needs the same setup.
- Keep shared helpers small and feature-focused instead of creating a large catch-all utilities folder.

### Coverage Growth

- Add more scenario specs for different pages and user journeys.
- Add negative and boundary-value coverage to complement the current happy-path input test.
- Add assertion coverage for error states, validation messages, and alternate UI states.
- Convert repeated setup patterns into reusable flow or fixture helpers once they appear in multiple tests.

### Stability and Maintainability

- Keep locator strategy aligned with Playwright best practices: prefer role, label, and user-facing attributes.
- Review whether any helper should become a fixture instead of a utility function if it is reused across files.
- Add or refine failure evidence and reporting only when the test suite grows enough to benefit from it.
- Revisit the `expect` timeout, retries, and browser matrix if the suite becomes larger or more flaky.

### Self-Healing Direction

- Treat self-healing as a disciplined locator and recovery strategy first, not as a replacement for good page objects.
- If locator repair becomes a real need, document the recovery workflow clearly before automating it.
- Prefer agent-assisted maintenance for broken locators over hidden magic that makes failures harder to reason about.

### Documentation

- Keep [ARCHITECTURE.md](../ARCHITECTURE.md) current whenever the folder structure or execution flow changes.
- Record newly adopted patterns here when they become part of the standard framework shape.
- If a feature becomes a stable convention, move it from this file into the architecture document.

## Decision Filter

Before adding a new layer or folder, ask:

1. Does this solve a repeated problem?
2. Will this reduce duplication or confusion?
3. Does it improve maintainability enough to justify one more abstraction?
4. Can the same outcome be achieved by a smaller change?

If the answer is not clearly yes, keep the framework smaller.