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

### Integrating API and UI Scenarios

- Motivation: combine related API flows (login, register, cart, etc.) with UI scenarios so debugging and verification happen in one end-to-end run when appropriate.
- Description: allow tests to call API helpers from within UI flows (and vice-versa) so a single spec can validate both the backend state and the UI presentation.
- Action items:
	1. Add an `api/` helper collection that exports authenticated request helpers and common endpoints.
	2. Add examples: a combined `login` flow that can either use API login or UI login based on a test flag.
	3. Document when to prefer a combined spec vs. a separate API contract test.

### Flakiness Analysis & Agent Recommendations

- Motivation: use historical CI JSON results and local runs to analyze flaky tests and surface targeted repair suggestions.
- Description: aggregate run artifacts (JSON, traces, screenshots) over time and run simple heuristics (timeout spikes, consistent selectors, environment-only failures) to identify flakiness patterns. Provide actionable recommendations an agent can apply or present to maintainers.
- Action items:
	1. Add a results-collector script to normalize CI JSONs into a simple timeline format.
	2. Implement a small ruleset that detects frequent failure signatures (selector mismatch, network timeouts, auth errors).
	3. Wire an “agent recommendation” output that suggests retries, locator changes, or test isolation as next steps.

### Agentic Mode & Lightweight UI Runner

- Motivation: reduce manual overhead for running and investigating tests by offering an agentic runner and a small UI for testers to run common scenarios.
- Description: a lightweight web UI (or desktop launcher) that lets non-dev testers pick scenarios, view recent reports, and trigger agentic repair or re-run actions without opening code.
- Action items:
	1. Prototype a minimal Electron or static web UI that lists specs, shows the last HTML report, and can trigger `npm test --grep "<spec>"`.
	2. Add an agentic runner mode that attempts simple fixes (clear cache, re-run with `--retries`, toggle API-via-UI flag) and reports outcomes.
	3. Protect agentic actions behind an explicit review step to avoid blind changes in CI.

### Randomized Test Data Utility

- Motivation: avoid brittle tests caused by hard-coded inputs and make tests more realistic by using deterministic randomization constrained by rules.
- Description: provide a small `randomizer` utility for names, emails, phone numbers, and IDs with seeding support so runs are reproducible when needed.
- Action items:
	1. Add `utils/randomizer.ts` with seeded generation and common formats (email, phone, uuid-like strings).
	2. Offer a test-level flag to persist generated values to a local artifact when debugging (so a failing run can be re-created).
	3. Document usage patterns and when deterministic vs. fully-random runs are appropriate.

---

If you want, I can implement any of the above as a follow-up: which one should I start with first? (suggested priority: `API+UI integration` → `randomizer` → `flakiness analysis` → `agentic UI`).