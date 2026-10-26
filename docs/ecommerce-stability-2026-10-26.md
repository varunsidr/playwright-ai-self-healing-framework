# Zeouf stability investigation: 26 October 2026

This historical investigation recorded **143 passed and one failed**, with one worker, zero retries, zero skips and no runner errors. The malformed-cart scenario passed; the failure was mobile Men navigation. Later complete runs and the pagination-fix verification are recorded in [plan 26](../specs/ecommerce/26-remaining-browser-and-service-boundaries.md). Separate passes do not rewrite this failed run or establish that intermittent loading causes are resolved.

## Verification

All commands ran from `pw-mcp-demo` against the public read-only origin `https://zeouf-luxury-fashion-ecommerce.vercel.app`. Browser writes stayed blocked. Each browser batch used separate artifact and report directories under `test-results/readiness-2026-10-26/`.

| Batch                                          | Result                                                                                       | Evidence directory    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------- |
| Unchanged malformed-cart test, ten repetitions | 10 passed; zero retries                                                                      | `cart-baseline/`      |
| Complete read-only browser suite               | 143 passed, one failed; zero retries/skips/flaky results                                     | `read-only-baseline/` |
| Mobile Men diagnostic, five repetitions        | 5 passed; zero retries                                                                       | `mobile-recheck/`     |
| Public HTTP/API suite                          | 6 passed; zero retries                                                                       | `public-api/`         |
| `npm run check`                                | Passed formatting, lint, TypeScript, static analysis, mappings and all 48 script regressions | Local command output  |

The checkout was at framework HEAD `2be4a094cace7a7665fa422026209401cb2ea921` with existing uncommitted tester-guide/helper changes. Today's reports describe that working tree, not a clean committed revision. Their embedded website revision is unknown. These checks do not establish authenticated backend or full requirement acceptance.

## Malformed-cart diagnosis

The initial eight-test sample retained under `original-pilot/` had seven passes and one missing recovery notice. The failing trace records `net::ERR_CONNECTION_RESET` for `/_next/static/chunks/0imdp4bp1gxh6.js`. Homepage loading took approximately 20 seconds before the cart assertion. A separate unchanged single-test repeat passed.

A controlled diagnostic in fresh browser contexts compared a normal load with a connection-reset abort of that exact bundle. Both contexts seeded the same malformed `els-cart` value and blocked non-read HTTP requests:

| Load                | Observed cart storage access       | Recovery notice |
| ------------------- | ---------------------------------- | --------------- |
| Normal              | Read `{not-json`, then saved `[]`  | Visible         |
| Navbar bundle reset | No application cart storage access | Missing         |

Evidence and the diagnostic script are archived as `cart-diagnostic-normal.json`, `cart-diagnostic-reset-navbar-once.json`, matching traces, and `diagnose-cart.cjs` in the evidence root. The failed bundle contains the navbar implementation. This reproduces the missing-notice symptom through an interrupted client load; it does not establish why the original connection reset occurred or prove that every future notice failure has that cause. The bundle path belongs to this observed deployment and must be rediscovered after a deployment change.

No locator, expected notice, test timeout or retry policy was changed. The ten normal repetitions and full-run cart pass support the existing scenario. A test-code repair is not justified by the observed failure.

## Remaining mobile navigation failure

`TC-NAV-005-01 mobile men clothing expands and closes after navigation @happy` clicked the visible Suit link but remained at `/` instead of reaching `/men/suits` within the existing five-second URL assertion.

The captured navigation diagnostics record an aborted `/men/suits` React Server Components prefetch followed by another pending prefetch for that route, plus pending Makeup/Bag prefetches at teardown. There was no recorded page exception. This is evidence of incomplete route loading, not a proven server, CDN, application or runner root cause. The failure is distinct from the initial reset of a JavaScript bundle.

All five unchanged targeted repeats passed, including the expected URL, closed menu, loaded category and restored scroll behavior. They do not certify a clean complete suite. Inspect the full-run trace and `navigation-diagnostics` attachment before proposing a source fix; increasing the URL timeout would hide the current symptom without explaining it.

## GitHub Actions and deployment identity

Public GitHub API inspection verified the [successful Playwright Tests run](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/runs/39836915057) for framework commit `2be4a094cace7a7665fa422026209401cb2ea921`. The run started on **23 October 2026 at 00:34 IST** (22 October at 19:04 UTC). Its public job metadata confirms successful public HTTP/API smoke, expanded read-only browser regressions, isolated browser contracts, monitoring generation and artifact upload. The matching [quality-gate run](https://github.com/varunsidr/playwright-ai-self-healing-framework/actions/runs/39836914886) also succeeded. Report and test-result artifacts were listed as unexpired when inspected.

The production deployment-record step and staging suite were skipped in that CI run. Public job success alone does not establish individual test retry/flaky counts. This CI result verifies the committed revision, not today's uncommitted changes, and is separate from the failed local full run.

Running the existing deployment capture command recorded Vercel Production deployment `7336198165`, status `20638384051`, website revision `6153c8ad2d3689ae87440dc757f66a08319b5544`, and immutable origin `https://zeouf-luxury-fashion-ecommerce-il7uds7xu.vercel.app`. Its `/api/health` probe returned **HTTP 302**, so the command correctly failed. The deployment record was retained as `website-deployment.json`; it is not a successful accessibility verification and was not bound retrospectively to the public-alias reports.

No fresh workflow was dispatched. The GitHub CLI and an authenticated GitHub connection/token were unavailable. Repository settings, access protection, publication, and deployments were not changed.

## Next verification boundary

1. Inspect the failing mobile-navigation trace alongside application/CDN logs for the recorded build; reproduce the pending route on an accessible immutable deployment or a controlled checkout of the same website revision. The current evidence cannot identify a valid source repair.
2. Supply approved test-runner access to the immutable deployment. Re-run deployment capture and require its health probe to pass before recording the website revision in fresh reports. Keep public writes blocked.
3. After any verified source/environment correction, run the complete read-only suite once with zero retries, retain its result, and run the quality gate. Keep diagnostic repeats separate.
4. Run CI on the reviewed framework revision with deployment pinning enabled. A prior green run or a mutable-alias pass does not satisfy this build-specific milestone.

Raw reports remain Git-ignored. The earlier October evidence and monitoring snapshot were preserved. Local test assertions, fixtures, runner behavior and website source were unchanged by this investigation.
