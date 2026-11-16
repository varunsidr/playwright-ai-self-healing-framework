# Agent evidence and interactive inspection

The workflow combines retained CLI evidence with fixture-aware Playwright test MCP exploration. The repair runner supplies bounded artifact contents to diagnosis. Workspace inspection attaches to the actual guarded ecommerce test, records tester interventions, and saves recording drafts. Original expectations and independent automated verification remain authoritative.

## Diagnose a recorded failure

```powershell
npm run repair:ecommerce -- --prepare --report <recorded-playwright-results.json>
```

The failure packet includes excerpts from failed attempts only: inline navigation diagnostics, ARIA JSON, error context, and trace CLI summaries. Trace summaries include failed actions, the first failed action's details, errors, console errors, and failed HTTP requests. Action IDs and original artifact SHA256 values support citations. Missing, unreadable, oversized, and truncated evidence is recorded explicitly; raw reports and attachments remain authoritative.

Only recognized attachment names are ingested. Files must resolve inside the report directory or the checkout's `test-results`; traversal and symlink escapes are rejected. Downloaded CI artifacts rebase old absolute paths at their `test-results` boundary. Excerpts are limited to 16,000 characters each and 96,000 characters per packet. Text inputs are limited to 256 KiB and trace inputs to 32 MiB. Common bearer credentials and token query values are redacted; this is not a general page-data anonymizer. Trace summaries do not automatically include request/response bodies. Their failed-request filter selects HTTP errors; navigation diagnostics cover transport failures.

Trace extraction runs the installed CLI in a private temporary working directory, then removes it. It does not replace an operator's opened trace. Exact-quote diagnosis validation can cite the resulting `browser/<check>/<index>-<attachment>` sources in local and CI preparation. Existing observed-failure, requirement, and implementation evidence gates remain required.

```powershell
npm run trace:inspect -- open <trace.zip>
npm run trace:inspect -- actions --errors-only
npm run trace:inspect -- action <action-id>
npm run trace:inspect -- console --errors-only
npm run trace:inspect -- requests --failed
npm run trace:inspect -- close
```

## Inspect with a tester

Run `npm run workspace:ecommerce`, open its printed local URL, select a public-safe case, and choose **Inspect with browser controls**. Only reviewed files run, in `ecommerce-chromium`, with zero retries, no staging credentials, and the existing write guards.

Playwright initially pauses before test setup. Use **Next test action** to advance toward the page state to inspect. **Resume test** continues until another debugger pause or test completion. A batch with several tests can attach a new session for each test.

**Open browser controls** opens Playwright's local dashboard. Select the attached `tw-...` session to inspect or control mouse and keyboard. **Start recording** and **Save recording draft** retain output under the inspection run, with a content hash and a browser-readable link. Drafts do not overwrite specs or assertions. **End inspection** stops only this inspection process tree. Inspections expire after 15 minutes; attached CLI sessions are detached on completion. The dashboard can also be opened with `npm run browser:dashboard`.

Each requested workspace control and its outcome is retained in `job.json`. Direct dashboard mouse/keyboard actions are captured only while recording is active; the intervention log is not a complete dashboard event log. Use recording when the manual sequence matters.

An interactive job finishes as `inspection-ended`, even if its underlying report is green. Underlying outcomes remain visible, but inspections are excluded from automated acceptance history. **Run fresh automated verification** creates a separate unassisted run linked by `verificationOf`. Runs record the Playwright version and a hash of the case, selected specs, shared fixture, page object, configuration, and lockfile. Verification records whether those inputs match the inspection. This is scoped provenance, not an immutable executable revision or known hosted website revision.

This prototype supports test debugging and recording. Visual test editing, generation-agent takeover, automatic recording-to-spec promotion, and resume after a process restart remain future work.

## Agent hosts and repair boundaries

Custom planner/generator/healer profiles retain `playwright run-test-mcp-server`, the ecommerce project, and its guarded seed. The generic `playwright mcp` server has a different workflow; do not substitute it without validating fixture behavior. Verify profile allowlists against the installed server after upgrades.

Nested repair CLI agents now explicitly disable resolved MCP servers and use supplied recorded evidence. The earlier empty-table override did not guarantee this because configuration merges; actual CLI preflight now verifies the intended boundary. Live exploration uses fixture-aware profiles, an explicitly started inspection, or the opt-in real tri-agent rehearsal. Source/requirement diagnosis gates, permitted diffs, unchanged tests, baseline reproduction, and independent regression verification still decide whether a repair is verified.

## Upgrade and order checks

DOM/ARIA tracing and structured ARIA JSON capture improve failure evidence. Set `ECOMMERCE_TRACE_SCREEN=1` for per-action screen snapshots during a diagnostic run; they add capture overhead and are opt-in. Failure screenshots remain enabled by default. ARIA capture is best effort and must not replace the original test failure. Full JSON reports remain enabled because monitoring and verification require the complete check inventory.

```powershell
# Reproduce the order reported by a previous shuffled run.
npm run test:ecommerce:shuffle -- 271828182
npm run check
npm run test:ecommerce:matrix -- --retries=0
npm run verify:inspection -- <new-inspection-evidence-directory>
```

Use named locks only for checks sharing an external resource within one Playwright invocation. Most isolated tests already have fresh contexts and need no lock. Locks do not coordinate separate CI jobs or independent processes.

References: [trace analysis](https://playwright.dev/docs/release-notes#version-159), [CLI dashboard and recording](https://github.com/microsoft/playwright-cli), [structured snapshots and locks](https://playwright.dev/docs/release-notes#version-163), and [seeded shuffling](https://playwright.dev/docs/release-notes#version-164).

## Local validation on 11 November 2026

Playwright Test and all Playwright Core consumers are pinned to **1.64.1**. The 1.65 trial failed to start Chromium and WebKit on this Windows host, so it was not retained. The 1.64.1 test MCP server advertises 92 tools; none of the three custom profiles' enabled tools are missing.

`npm run check` passed, including the artifact-path/budget/redaction regressions and the inspection-to-verification lifecycle checks. The real inspection rehearsal passed: attach to the guarded newsletter test, advance to the storefront, record a read-only home-link click, save the draft, resume, exclude the inspection from acceptance history, and independently verify in a fresh automated run. Workspace desktop/mobile browser verification and automated accessibility scans also passed.

Browser verification is **not fully green**. Chromium and mobile Chromium passed their ten selected matrix checks. The final separate WebKit batch passed all five with no runner error. Firefox's 1.64.1 binary still fails to launch with `spawn UNKNOWN`, including after reinstallation. The seeded public-safe Chromium run passed 127 of 128 tests with zero retries; the search-with-no-matches check stayed on the homepage after Enter instead of reaching its required search URL. Its assertion and original failure remain intact; the cause is unresolved. Its failure packet successfully supplies inline ARIA JSON, navigation diagnostics, error context, and trace excerpts without ingestion warnings.

Evidence is retained under `test-results/agent-improvements-2026-11-11/`: `mcp-preflight.json`, `recorded-failure-packet.json`, `shuffled-failure-evidence.json`, `inspection-final/result.json`, `workspace-final/result.json`, `webkit-final/results.json`, and `shuffled/results.json`. Earlier failed upgrade and WebKit runs are preserved separately. The new named-lock APIs are available but no unnecessary locks were added to already isolated tests. A real-model held-out repair evaluation and complete planner-to-generator-to-healer execution were not run; the offline benchmark remains separate.

The subsequent [12 November validation](ecommerce-real-agent-validation-2026-11-12.md) completes a real tri-agent rehearsal and a small real-model evaluation, fixes search synchronization, and verifies Firefox through the supported Linux matrix. The original 11 November outcomes above remain historical evidence.
