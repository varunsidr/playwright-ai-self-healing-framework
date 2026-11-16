# Subscription-based CI observation pilot

The pilot uses **GitHub Actions for tests and evidence collection**, then **local Codex signed in with ChatGPT for diagnosis and guarded repair proposals**. It does not require `OPENAI_API_KEY`. Codex usage consumes the applicable ChatGPT plan allowance; GitHub Actions compute and artifact limits still apply. The older API-based repair workflow is a separate opt-in and remains disabled by default.

The pilot creates no branch, PR, merge or deployment. Candidate verification runs without a model in fresh local checkouts. It is independent of the agent's edited checkout, but it is not verification on a separate CI runner.

## Start a pilot

1. Review and merge this framework change onto the default branch so GitHub offers the manual workflow.
2. Run **Playwright Tests** on that revision with `pin_deployment` checked and confirmed staging disabled. The immutable deployment must pass its health probe. A public-alias run cannot authorize repair.
3. If mapped browser checks fail, dispatch **Zeouf CI observation evidence** on the same revision with that failed run's numeric ID. It accepts only completed, failed, first-attempt, same-repository default-branch push/manual runs. It freezes `source-run.json` and the original `playwright-test-results` artifact, validates immutable deployment binding, and retains `zeouf-observation-input` even after failure. No model runs in this workflow.
4. Download and extract `zeouf-observation-input` into a new directory. Its root must contain `source-run.json` and `original/`.
5. Use a clean framework checkout at the tested revision and a local Zeouf Git checkout at the recorded website revision. Install Node 24, locked dependencies and Chromium. Sign in locally with `codex login` and select ChatGPT. `codex login status` must report ChatGPT authentication. Never upload the local Codex login to GitHub.
6. Run the local handoff below with a fresh output directory.

```powershell
npm ci
npx playwright install chromium
codex login status

npm run observe:ecommerce:local -- --input test-results/downloaded-observation --website ../Luxury_fashion_ecommerce --output test-results/my-local-observation
```

The public repository's run identity is rechecked against the GitHub API. If needed for rate limits, set `GITHUB_TOKEN` locally; it is excluded from agent and verification child environments. The website checkout must be at the exact revision in `original/website-deployment.json`. Original downloaded evidence is copied, not edited, and an existing output directory is rejected.

The runner checks deployment identity and current health before invoking a model. Missing reports, unpinned metadata, dirty or mismatched framework source, inaccessible deployments and unmapped failures block execution. A blocked run retains its report and returns a nonzero exit code. It never disables deployment protection or falls back to the mutable public URL.

## Local diagnosis and verification

The local runner reuses the CI preparation, diagnosis grounding, proposal guards and verification stages. It explicitly requires ChatGPT authentication, removes inherited API keys, forces `forced_login_method="chatgpt"` and disables every resolved MCP server. A missing login, API-key login or exhausted allowance leaves a blocked run; there is no automatic API-key fallback.

Diagnosis receives bounded, redacted, hash-linked trace/ARIA evidence and exact source quotes. Environment and unknown diagnoses do not invoke repair. Framework proposals can change only existing storefront POM test-ID literals. Tests, assertions, fixtures, requirements and configuration stay protected. Website proposals are limited to diagnosed source paths and scoped documentation under existing gates.

After proposal capture, model-free verification creates fresh framework and website checkouts, reproduces the unpatched failure, applies the guarded patch and runs affected checks and unchanged regressions with zero retries. It receives no model credentials. Original test outcomes remain failed even if a candidate verifies.

`execution.json` records **local** stage timing and ChatGPT authentication. Usage comes from JSONL protocol events, not agent narrative. Missing/failed stage measurements remain unavailable or partial, never synthetic zero. Token counts are not dollar-cost estimates. Local verification is labeled as local in both machine-readable and Markdown reports.

## Retained evidence and human review

The output contains original downloaded artifacts, failure packet, evidence sources, prompts/schemas, agent JSONL logs, diagnosis, proposal, `candidate.patch`, independent baseline/candidate reports and browser artifacts when available. Final files are `observation.json`, `observation.md`, `execution.json`, `agent-events.jsonl` and `review-template.json`.

Read the complete evidence before reviewing. Copy `review-template.json` to `review.json`, retain the exact observation digest, and fill reviewer, rationale, expected category (`test`, `application`, `environment`, `unknown`) and proposal safety (`safe`, `unsafe`, or `not-proposed`). Mixed causes require `unknown`. Diagnosis accuracy and unsafe-proposal ground truth remain unscored without human review.

```powershell
# Rebuild from retained evidence without a model; regenerating requires fresh review.
npm run observe:ecommerce -- report test-results/my-local-observation

# Aggregate distinct source-run attempts with digest-bound human reviews.
npm run observe:ecommerce -- aggregate test-results/my-pilot-rollup test-results/observation-1 test-results/observation-2
```

Aggregation revalidates evidence, rejects duplicate original source-run attempts and leaves rates without reviewed denominators as `null`. Controlled evaluations and archived failure replays are separate from real CI pilot measurements.

## Readiness on 17 November 2026

Local `codex login status` confirms ChatGPT authentication. The immutable deployment discovered through the successful Vercel production record returns **HTTP 302** from `/api/health` with redirects disabled. This remains an environment blocker. Resolve deployment access through the website's normal hosting settings, then run fresh pinned tests. No model call, live observation or production repair is claimed by this preflight.

Authentication and plan references: [Codex with ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan), [Codex authentication](https://learn.chatgpt.com/docs/auth), [separate ChatGPT/API billing](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform).
