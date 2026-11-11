# Framework improvements — 10 November 2026

Self-healing exists as guarded diagnosis, proposal and independent verification. It does not silently rewrite a running test. This increment closes several concrete research findings and adds an offline benchmark, real local backend integration and a small local tester workspace. Changes are local; new GitHub workflows still need a committed/pushed CI run.

## Delivered and verified locally

| Area                           | Result                                                                                                                                                                                                                                                                      | Evidence                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Offline repair evaluation      | 14/14 controlled classifications; eight locator proposals independently passed fresh browser contexts; zero unsafe proposals; protected POM unchanged. External-model mode was removed from this benchmark command.                                                         | `test-results/framework-completion-2026-11-09/offline-benchmark-verified/result.json` |
| Real local service integration | 11/11 passed against a unique disposable Supabase project: actual Auth, PostgREST/RLS, checkout transactions and races, private Storage and local signup email confirmation. Ten website migrations applied; own backend stopped successfully.                              | `integration-initial/result.json` under the same evidence root                        |
| Handler/SQL contracts          | 66/66 passed. Eight new limiter cases preserve `null` as unavailable and exercise unavailable/limited/allowed/default outcomes before backend access.                                                                                                                       | `contracts/result.json` and `isolated-final/contracts/result.json`                    |
| Isolated browser regression    | 176/176 passed, zero retries/skips/flaky results, unchanged framework inputs. Website install/lint/typecheck/build and the 66-check contract stage passed.                                                                                                                  | `isolated-final/result.json`                                                          |
| Selected browser/device matrix | 20/20 passed in Chromium, Firefox, WebKit and mobile Chromium. Fixed account-panel navigation to use the mobile menu when the desktop button is hidden.                                                                                                                     | `matrix-verified/results.json`                                                        |
| Tester workspace               | Browse/search 140 cases, inspect scoped checks, launch reviewed public-safe file batches and inspect original outcomes/logs. One real newsletter batch passed through the UI; desktop/mobile automated axe scans had zero violations and mobile had no horizontal overflow. | `workspace-final/result.json`, `desktop.png`, `mobile.png`                            |
| Reporting                      | Publication consumes artifacts from the original default-branch test run, preserves its conclusion and SHA, and rejects PR/fork/stale sources. Three local regressions passed. Patched Allure dependencies generated a real report successfully.                            | `scripts/ci-report.test.js`, `allure-verified/index.html`                             |
| History                        | Immutable report-hash records preserve first attempts and retry outcomes. CI restores/saves trusted branch history; original artifacts retain each run. Unknown builds remain visible but are excluded from comparable rates.                                               | `scripts/ecommerce-history.test.js`; main CI workflow                                 |
| Maintenance                    | Node 24 policy is shared by workflows and package engines. Website repository/revision are centralized and validated against the reviewed source baseline. Root dependency audit reports zero known vulnerabilities after compatible updates and scoped overrides.          | `.nvmrc`, `config/ecommerce-project.json`, `package-lock.json`                        |

The offline benchmark uses deterministic semantic control matching and synthetic browser faults. It is **not an AI-model accuracy measurement or evidence of general autonomous healing**. No selector excerpts or observations were sent to an external model. Application/environment/mixed or insufficient-evidence failures do not authorize a locator repair. The existing separate opt-in agent repair workflow remains available, but was not exercised in this benchmark.

The local integration tier drives real backend services through real HTTP sessions and independent database connections. It does not yet prove browser login → persisted checkout, hosted staging acceptance, production infrastructure, distributed limiter behavior, external email delivery or an AI-provider round trip. The pinned website's browser configuration rejects loopback Supabase URLs; extending that website behavior needs its own reviewed change and browser integration verification.

## Run the new capabilities

Use Node 24 and `npm ci`. Browser binaries are installed with `npx playwright install chromium firefox webkit`.

```powershell
# Local tester screen. Open the printed loopback URL. Ctrl+C stops the server.
npm run workspace:ecommerce

# Reviewed read-only smoke journeys across four browser/device projects.
npm run test:ecommerce:matrix

# Docker must be running. Source must be a clean checkout of the reviewed SHA.
npm run test:ecommerce:integration -- <clean-pinned-website> <new-evidence-directory>

# Use websiteWorkspace from a successful isolated runner result (built local app).
npm run benchmark:ecommerce:offline -- <clean-built-isolated-website> <new-evidence-directory>

# Complete framework checks, including workspace restrictions.
npm run check

# Optional repeat of the workspace's actual browser workflow and automated axe scans.
npm run verify:workspace -- <new-evidence-directory>
```

The integration runner creates its own uniquely named Docker project and network, applies migrations only there, and removes only its own backend resources. It never accepts a public database target. Local connection keys stay outside uploaded evidence. Inspect `backendStopped` after every run; failed cleanup makes the command fail. Existing unrelated Docker projects are left alone.

The workspace listens only on `127.0.0.1`, validates host/origin plus a session token, accepts catalog case IDs rather than commands, and permits only files in the existing reviewed public-safe runner. Runs use no inherited backend/customer secrets and use zero retries. A batch runs all tests in selected files and can include other cases; this is shown in the UI. Isolated/native-only cases are displayed with their scopes and cannot be launched as public runs. Saved jobs, reports and logs are under `test-results/workspace/`; history is local and is not uploaded by the workspace. It is a local case/run/evidence interface, not a record/edit/takeover platform.

## Remaining work and prerequisites

- **Hosted acceptance:** only the main website is available. Staging UI/API acceptance still needs an isolated website/database, disposable customer/admin accounts, reset/cleanup and controlled inbox. The new local backend tier reduces this gap but does not close it.
- **Website change integration:** install the prepared cross-repository verification workflow in the website repository after committing the framework and pinning its new SHA. The template is updated; remote installation, repository variables and a real website PR have not been verified.
- **Quality:** known website contrast defects remain open. The workspace's clean scans apply only to the new framework screen. Website screenshot baselines, human accessibility evaluation and broader journey/browser coverage remain separate work.
- **Performance and scope:** approve budgets and workload conditions before enforcing performance acceptance. Countdown remains excluded. Live assistant-provider smoke remains opt-in and unconfigured.
- **Repair reliability/product:** real-agent held-out evaluation remains unmeasured under the offline preference. Generic second-app onboarding, visual recording/editing, takeover/resume, immutable editable test revisions and domain-focused POM decomposition remain roadmap work. Shared project configuration and a local workspace are foundations, not completion of that product.

Scoped executable linkage is now **137/140 cases (97.9%)**, up from 135, because real local concurrency checks map the two race cases. Requirements with some executable linkage remain **135/137 (98.5%)**. The three unmapped cases are real-provider smoke, excluded countdown and performance acceptance without budgets. These are inventory percentages, not project completion or release approval.

Earlier failed runs remain retained. The initial matrix exposed three mobile account failures before the fix. The workspace verification exposed a footer contrast issue before its color was corrected; its failed evidence remains separate. Passing verification does not erase those observations. CI cache history is subject to GitHub cache retention/eviction; retain downloaded artifacts or local history for a longer audit period.
