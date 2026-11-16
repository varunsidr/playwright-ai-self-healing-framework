# Search, browser execution, and real agent validation — 12 November 2026

The guarded Zeouf workflow has now been exercised with actual planner, generator, and healer model runs, real Playwright test MCP calls, controlled fault injection, and independent browser verification. Search navigation synchronization is corrected. Firefox is verified in a supported Linux environment while the Windows Application Control policy remains intact. These results are a small controlled rehearsal, not general autonomous repair reliability or production release acceptance.

## Results

| Check                                | Observed result                                                                                                                                                                                                                                   | Evidence under `test-results/next-stage-2026-11-11/`                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Original search, ordinary network    | 10/10 fresh contexts passed before the fix; the earlier failure was intermittent                                                                                                                                                                  | `search-reproduction/results.json`                                                      |
| Controlled search latency            | Original helper passes normally, fails its URL assertion when a real search RSC response is held for 6.5 seconds, and the corrected helper passes with the same delayed response and unchanged page-content assertions                            | `search-latency-verification/result.json`                                               |
| Browser matrix                       | 20/20 passed: Chromium, Firefox, WebKit, and mobile Chromium; no retries                                                                                                                                                                          | `linux-matrix-node24/result.json`, `artifacts/results.json`                             |
| Real tri-agent rehearsal             | Generated test passes; injected locator fault fails; the actual healer repairs the locator; unchanged test passes independently                                                                                                                   | `tri-agent-configured/result.json`                                                      |
| Generated code quality               | Initial direct selectors were detected. A scoped agent refactor added three locator getters in the disposable POM and preserved all existing members and spec assertions. Static analysis, typechecking, formatting and fresh verification passed | `tri-agent-configured/generation-quality-*.log`, `generated-reviewed-formatted.spec.ts` |
| Real model held-out evaluation       | Eight new controlled faults: 8/8 classifications correct, two locator proposals, 2/2 independently verified, zero unsafe proposals                                                                                                                | `real-agent-held-out-states/result.json`                                                |
| Full shuffled public-safe regression | 127 passed, one failed, zero skips/flaky outcomes/retries. The repaired search passed; the failing navigation check encountered `net::ERR_CONNECTION_RESET` during `openHome()`                                                                   | `shuffled-after/results.json`                                                           |
| Separate focused verification        | Search and the connection-reset navigation case both passed, without retries                                                                                                                                                                      | `focused-final/results.json`                                                            |

Repository checks also passed: `npm run check` completed with exit code zero, including formatting, lint, typechecking, static analysis, mappings, unit tests and policy checks. The saved evidence is `full-check.log` and `full-check-result.json` in the same directory.

The full shuffled run remains a failed run. A later focused pass does not rewrite it or prove permanent network stability. No assertion, expected route, retry count, or timeout was weakened to obtain a passing result.

## Search cause and repair

The original trace shows a non-prefetch RSC request for `/search` beginning before the URL assertion; it was still pending when the five-second assertion deadline expired. Enter was handled. The source contract and navbar handler trim and encode the query at `/search?q=...`.

`EcommerceStorefrontPage.submitOpenSearch()` now waits for the exact decoded search query and `/search` route using Playwright's navigation deadline, together with the Enter action. Blank input still takes the original no-navigation path. Existing URL, results-heading, no-results, focus and encoding assertions remain intact. There is no fixed sleep or timeout increase in the page object. The 6.5-second timer belongs solely to the controlled response-delay verification harness.

## Firefox and reproducible Linux execution

Windows reported native error **4551**, “An Application Control policy has blocked this file,” for the installed Firefox executable. The Windows policy was not changed, and browser executables were not renamed or substituted.

`test:ecommerce:linux-matrix` snapshots tracked and untracked framework source while excluding environment files and host dependencies. It mounts that snapshot read-only into a uniquely named disposable container and writes reports to a separate artifact mount. Host credentials and database settings are not forwarded. The browser image is pinned to the installed Playwright version; its image ID and source hashes are recorded.

The pulled Playwright image used Node 26, so the runner builds a disposable wrapper containing the official Node **24.19.0** runtime to satisfy this repository's Node 24 policy. All twenty matrix checks ran with Playwright **1.64.1** on Linux. The container was removed and cleanup verified. Shared downloaded base images remain available for subsequent runs.

## Actual MCP execution and a configuration correction

An empty `mcp_servers={}` override merges configuration; it does not reliably remove project servers. The old flag therefore did not establish the recorded-only behavior previously intended by the nested repair runner.

The runner now explicitly disables every resolved server using named TOML entries. The actual CLI was checked with both recorded mode disabled and rehearsal mode enabled; dotted server names are supported through quoted keys inside the TOML value. Local capability metadata is saved alongside agent logs. The CI action steps explicitly disable the project `playwright-test` server through `codex-args`; that workflow edit is locally policy-tested but has not been executed remotely.

For the live rehearsal, only the `playwright-test` server is enabled with the role's tool allowlist. Required setup, generation-log, save, run and debug calls are verified from completed JSONL protocol events rather than from the agent's narrative. User-selected CLI model and reasoning settings are inherited.

| Completed role                        | MCP calls, including failed attempts | Agent wall time | Reported input tokens | Cached input tokens | Output tokens |
| ------------------------------------- | -----------------------------------: | --------------: | --------------------: | ------------------: | ------------: |
| Planner                               |                                   14 |       166.878 s |               569,276 |             514,176 |         4,063 |
| Generator                             |                                   12 |       216.338 s |               927,365 |             857,088 |         5,316 |
| Healer                                |                                    6 |       135.030 s |               318,768 |             280,576 |         1,580 |
| Subsequent generator quality refactor |                                    0 |        51.404 s |               157,557 |             125,952 |         1,030 |
| Corrected held-out packet evaluation  |                                    0 |        16.595 s |                18,319 |                   0 |           623 |

Of the initial thirty-two MCP calls, twenty-eight completed successfully and four failed; the agents recovered before completing their required workflows. These are tool attempts, not Playwright test retries. The quality refactor used source-editing tools; the packet evaluator used no MCP, shell, file-change, or web-search tools. Token figures are reported usage for those completed stages, not dollar-cost estimates or an account-wide bill. A failed initial bootstrap and the earlier evaluation are retained separately and are not included in this table.

The large repeated context in the first three stages identifies an efficiency opportunity: read matching requirement/case sections and relevant POM members, and request focused snapshots. No token-reduction claim has yet been measured.

## Quality and evaluation boundaries

The rehearsal is an explicitly authorized disposable duplicate of CNT-01 / TC-CNT-001-01. It does not add a new acceptance claim or update the real case catalog. Generated plans, specs, the fault source, repair diff, reviewed source, JSONL calls, responses and stage metrics remain in the evidence directory. The real framework's newsletter implementation was not deliberately broken.

The recorded rehearsal completed its functional pass/fail/pass sequence before the subsequent generation-quality review and independently verified refactor. The updated controller now runs generation-quality checks before baseline verification in future rehearsals.

The controller checks the exact newsletter notice and the actual write-attempt array assertion. Additive generation refactors must preserve existing POM members, and selector extraction must preserve the complete remaining spec AST. The repository's static analysis, formatting and type checks gate generation before baseline verification. A fault must fail on its injected locator, and healing may change only existing test-ID literals while preserving the generated test and plan. All positive verification runs require one clean test, without retries, skips, expected failures or runner errors.

The held-out corpus contains two test faults, two application-output faults, two environment faults and two ambiguous/incomplete observations, with randomized identifiers and ordering. Labels and fault definitions are withheld from the packet-only agent. It receives observed control metadata, failure messages, the relevant POM calls, and functional-probe results; this measures diagnosis and proposals from supplied evidence, not autonomous evidence collection. Proposals pass the existing literal-only change gate and must succeed against the complete original expectation in fresh browser contexts. The original POM's hash remains unchanged.

The first evaluation classified 8/8 but proposed zero repairs because its post-probe snapshot had replaced the controls from the failed state. That evidence-format defect was corrected by retaining failed-state and post-probe observations separately. A fresh randomized eight-case trial then produced the results above. Both trials are retained; they are not combined into a larger accuracy sample. Broader applications, failure families, deployment environments and larger held-out sets remain unmeasured.

## Run the capabilities

The evaluation entry point now runs the [expanded forty-case corpus and acceptance gate](ecommerce-expanded-agent-evaluation.md). The eight-case results above remain the historical baseline and are not pooled with subsequent runs.

Run from `pw-mcp-demo` using Node 24. Each evidence directory must be new.

```powershell
# Read-only cross-browser execution in a version-matched Docker environment.
npm run test:ecommerce:linux-matrix -- test-results/my-linux-matrix

# Actual signed-in Codex CLI stages and model usage; keeps generated code in a disposable checkout.
npm run rehearse:ecommerce:agents -- test-results/my-tri-agent-rehearsal

# Separate opt-in real-model evaluation. The offline benchmark command remains offline.
npm run evaluate:ecommerce:real-agent -- test-results/my-real-agent-evaluation

# Compare a preserved original POM with the current helper under controlled navigation latency.
npm run verify:search-navigation -- <original-page-object.ts> test-results/my-search-verification

# Repository checks include the protocol-metric and generation-quality regression tests.
npm run check
```

Source references: [Playwright Docker/version matching](https://playwright.dev/docs/docker), [Codex JSONL output and usage](https://learn.chatgpt.com/docs/non-interactive-mode), and [Codex action configuration](https://learn.chatgpt.com/docs/github-action).
