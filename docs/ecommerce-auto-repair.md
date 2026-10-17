# Zeouf failure diagnosis and repair

The repair workflow handles mapped failures from the public, read-only `ecommerce-chromium` suite. It preserves the original failure report, classifies the cause, asks the appropriate agent for a patch, independently verifies the unchanged tests, and can open a draft PR. Production database credentials are never provided to candidate builds.

## Manual pilot before publication

The workflow must be present on the framework repository's default branch. In that repository's **Settings → Secrets and variables → Actions**, configure:

| Setting                       | Kind     | Value or purpose                                                                                                                              |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ECOMMERCE_REPAIR_ENABLED`    | Variable | `true` enables a manually requested repair pilot. Automatic triggers require a separate opt-in.                                               |
| `ECOMMERCE_REPAIR_AUTOMATIC`  | Variable | Leave unset or `false` during the pilot. `true` permits automatic proposals from eligible failed runs; it does not authorize PR publishing.   |
| `ECOMMERCE_PIN_DEPLOYMENT`    | Variable | Leave unset for existing public monitoring. After immutable deployment access works, `true` pins public CI runs to a recorded deployment.     |
| `OPENAI_API_KEY`              | Secret   | OpenAI API key used only by the Codex Action. CI API usage is billed separately from local ChatGPT sign-in.                                   |
| `ECOMMERCE_REPAIR_PUBLISH_PR` | Variable | Leave unset or `false` during the pilot. Publication later requires both `true` and the manual dispatch checkbox `publish_verified_pr`.       |
| `REPAIR_GITHUB_TOKEN`         | Secret   | A fine-grained token restricted to the two repositories below, with Contents and Pull requests write access. Used only in the publishing job. |

Enter credentials directly into GitHub Secrets. Do not paste them into chat, commit them, or copy local Codex authentication files into CI. Keep `ECOMMERCE_STAGING_CONFIRMED` unset or `false` for this first version.

The fixed destinations are `varunsidr/Luxury_fashion_ecommerce` for application repairs and `varunsidr/playwright-ai-self-healing-framework` for locator repairs. The publisher uses each repository's default branch and refuses to publish if that branch advanced after verification.

Start **Playwright Tests** manually on the framework default branch with `pin_deployment` checked. It records a successful Vercel Production deployment from the website's GitHub deployment API and tests its immutable URL with the recorded full website commit, deployment/status IDs and record digest. Then start **Zeouf failure repair** with that failed run ID, leaving `publish_verified_pr` unchecked. Successful runs have no failures to repair.

The initial rollout keeps automatic proposals and publication disabled. Later, `ECOMMERCE_REPAIR_AUTOMATIC=true` permits proposals for eligible failed default-branch push/manual test runs. Publication still requires a separate manual dispatch with `publish_verified_pr=true` and the repository publication variable enabled. Pull request and fork runs are excluded. Unrelated demo/API failures do not authorize ecommerce healing, and confirmed staging runs remain outside this workflow's scope.

Ordinary unpinned public monitoring continues against the configured storefront URL. Its reports are not eligible for repair publication: a declared build variable alone cannot attest to the deployed commit. Pinned runs fail closed if the immutable deployment is inaccessible, the record is missing, the URL/SHA/digest differs, or GitHub no longer confirms the successful record. The repair checkout uses the report's recorded website commit rather than today's default branch.

The current immutable deployment redirects `/api/health` to Vercel authentication (HTTP 302); the public alias responds successfully. Resolve deployment protection access before running a pinned pilot. The implementation does not disable protection, submit Vercel credentials, or switch to the alias after a pinned request fails. This leaves existing public monitoring available without inventing commit-linked evidence.

## What happens to a failure

| Diagnosis                                                                    | Owner and action                                                                                        |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Application violates reviewed requirements                                   | Website developer agent edits only diagnosed website source files and scoped requirement documentation. |
| Website implementation supports the expected behavior but a locator is stale | Playwright healer edits existing `getByTestId` string literals in the storefront page object.           |
| Environment or availability failure                                          | Stop with preserved evidence; no speculative source patch.                                              |
| Unknown, mixed causes, unmapped checks, or missing evidence                  | Stop for review.                                                                                        |

Exact evidence quotes are checked against the recorded sources. All failed check IDs must be accounted for, and the report's case-catalog and check-manifest fingerprints must match the checked-out framework. An actionable diagnosis needs browser failure evidence and relevant source evidence; application repairs also need requirement evidence.

Diagnosis and repair run in isolated checkouts with restricted Codex permissions. The workflow pins the reviewed Codex Action revision and uses its `drop-sudo` strategy on a GitHub-hosted Ubuntu runner. The proposing job has no branch/PR write token. Independent verification runs in a separate job with no API or production service secrets; publishing runs in another job and does not execute candidate application code.

Before a patch is accepted, verification must reproduce the original failed checks against the unpatched website revision, apply the captured patch, build/check the affected repository, and pass every selected regression with one attempt and zero retries. Skips, flaky results, expected failures, runner errors, missing checks, and changed inventory fingerprints invalidate verification. CAT-01 repairs rerun category membership, catalog fixture/refinement checks, and the storefront seed. Other repairs rerun the failed spec files and the seed.

Test files, assertions, fixtures, manifests, requirements, write guards, and framework configuration are protected. The first healer version permits only existing test-ID literal changes; interaction or assertion changes need review. Website documentation can append a source-review note and regression instructions, but cannot rewrite existing requirement, acceptance, or gap table rows. The orchestrator records the explicit documentation review and runs the website's documentation checks.

The publisher rechecks report completeness and patch/report digests, applies the patch to the verified revision, checks changed paths, and opens a draft PR. A deterministic branch name avoids creating another PR when the same repair PR is already open. No automatic merge or deployment is configured.

After the website PR is reviewed, merged, and deployed, rerun the full public read-only suite against that deployment and rebuild monitoring evidence. Local fixture verification does not prove production acceptance. The website deployment does not yet send a webhook to this framework; the post-deployment rerun remains a separate step.

## Connect the website PR check through a reviewed integration PR

The website already has storefront and requirements workflows. This integration adds a separate check without replacing them or modifying the developer's working copy:

```powershell
npm run prepare:website-integration -- C:/path/to/zeouf test-results/website-repair-integration
```

The command snapshots committed website `HEAD`, adds the [workflow template](../templates/ecommerce/website-repair-pr.yml), appends scoped BRD/QA instructions, records a no-functional-change documentation review, checks the documentation and emits `website-integration.patch`. Apply the patch on a website feature branch and open a review PR. If the website advanced, regenerate it from the current committed revision.

After the framework implementation is reviewed and merged, set **the website repository's** `ECOMMERCE_REPAIR_FRAMEWORK_SHA` variable to that full 40-character framework commit. The workflow refuses a missing or branch-name value. It checks out that pinned framework and the website PR's exact head commit, builds an isolated website with placeholder services, and runs all 144 public-safe checks with zero retries. Test files, manifests, fixtures and framework configuration remain frozen. Logs, raw reports and failure artifacts are uploaded on failure as well as success. No API key, publisher token or production database credentials are supplied.

Require **Zeouf unchanged public regressions**, the existing website checks, human review and an up-to-date branch before merging. Apply branch protections to the repair identity as well. These repository settings and Vercel preview settings must be reviewed separately; the local patch generator does not change remote configuration. A branch or draft PR can trigger preview deployment, so inspect preview credentials before publishing any repair branch.

To exercise the PR check locally without editing either working copy:

```powershell
npm run verify:website-pr -- C:/path/to/website-candidate test-results/website-repair-pr
```

For local framework development only, append `--working-tree` to include the framework's current source in its disposable baseline. Website input always uses committed `HEAD`; commit a candidate only in an isolated checkout when rehearsing. This local proof is separate from a required GitHub status check, which is established only after the website integration PR and variable are installed.

## Local commands and evidence

Prepare a packet without running an agent:

```powershell
npm run repair:ecommerce -- --prepare --report test-results/ecommerce-read-only-results.json
```

Diagnose or run the isolated repair loop with the local Zeouf Git checkout:

```powershell
npm run repair:ecommerce -- --diagnose --website C:/path/to/zeouf --report test-results/ecommerce-read-only-results.json
npm run repair:ecommerce -- --run --website C:/path/to/zeouf --report test-results/ecommerce-read-only-results.json
```

Local agent commands use the installed `codex exec` and its existing sign-in. Website snapshots use committed `HEAD`, preserving unrelated uncommitted website work. Framework snapshots capture the current working source for local development. All edits remain in disposable checkouts, and outputs are archived under `test-results/ecommerce-repair-loop/` with a `latest.md` pointer. Temporary checkouts use a short path to avoid Windows build path limits. They are retained for inspection.

A developer agent can also hand a patch to the same independent verifier:

```powershell
npm run repair:ecommerce -- --run --website C:/path/to/zeouf --report test-results/ecommerce-read-only-results.json --diagnosis path/to/diagnosis.json --candidate-patch path/to/candidate.patch --repair-result path/to/repair.json
```

The repair result must match `scripts/ecommerce-repair/repair-result.schema.json`. Reusing a diagnosis still requires its check IDs and evidence quotes to match the current failure packet and sources. External handoffs pass the same scope, baseline reproduction, build, and regression gates; they are labelled separately from nested CLI execution.

CI artifacts are `zeouf-repair-proposal`, `zeouf-repair-verification`, and `zeouf-repair-publication`. They contain failure packets, source quotes, agent outputs, patch metadata, raw browser reports, and verification evidence. Original browser attachment paths remain in the reports; artifact index files identify their archived copies. The active public monitoring report is not overwritten by isolated repair results.

## Validation and current limits

`npm run check` includes 18 repair tests covering routing, grounded evidence, changed-source scope, frozen repositories, stale inventories, complete clean verification, publication digests, documentation acceptance preservation, secret-free build environments, exact deployment/report/source binding, and the actual workflow's manual/publishing/pinning conditions. Mapping validation currently confirms 144 executable public checks linked to 41 of 108 cases; this does not establish full business acceptance.

The real category failure was classified as an application defect and reproduced against the isolated website. Nested repair execution on this Windows machine stopped with `helper_sandbox_lock_failed / SetNamedSecurityInfoW error 5` before editing source. The Ubuntu CI execution and actual PR publication require the settings above and have not yet been exercised. A handoff verification is recorded separately; it must not be reported as a successful nested-agent repair.

The coding-agent handoff subsequently passed independent verification: both original failures reproduced before the patch, then all 40 selected category/catalog/seed checks passed with zero retries. The candidate is archived in `test-results/ecommerce-repair-loop/2026-10-13T17-52-59-972Z-82c89a3b/`. Website lint, type checking, build, and required documentation checks passed. The original website checkout was not edited, and no PR or deployment was created. The public monitoring result still records the original failures.

The first full PR rehearsal ran all 144 checks and correctly held the candidate at 142 passed and two failed. The local catalog exposes sized or unavailable products before eligible unsized products; two guest-cart helpers assumed the first visible page contained a quick-add product, and one selected a hidden add control on a sized card. The helper now loads more within the same Women collection until an actual accessible quick-add action is available. Guest sign-in and empty-cart assertions, test IDs, test files and inventory fingerprints are unchanged. This is a reviewed test-precondition correction, beyond the automatic healer's permitted test-ID-only scope. The original failed PR rehearsal is retained under `test-results/website-repair-pr-pilot/`.

The corrected full PR rehearsal passed all 144 checks with zero retries and no skips, against the isolated website candidate with its category fix. Evidence is in `test-results/website-repair-pr-pilot-confirmed/`. The reviewable website CI integration patch and passing documentation checks are in `test-results/website-repair-integration-pilot/`. Neither result is a deployed website acceptance result or an installed GitHub check.

Rollout order: review and merge the framework implementation through its own PR; configure the website's reviewed framework SHA; regenerate/apply the website integration patch through a website PR; require the successful PR checks and human review; resolve immutable deployment access; run a pinned manual test/repair pilot with publication unchecked. Automatic proposals and publishing remain separate later opt-ins. The live GitHub settings and Vercel protection settings have not been changed.

The older `demo:ecommerce:repair` command is a controlled fault rehearsal with predefined repairs. It is separate from this agent-driven workflow and does not demonstrate autonomous repair accuracy. Stateful cart, checkout, review, and admin repairs remain outside this public read-only workflow until isolated staging accounts, fixtures, and cleanup are available.

Implementation: [workflow](../.github/workflows/ecommerce-auto-repair.yml), [local runner](../scripts/run-ecommerce-repair.js), and [repair gates](../scripts/ecommerce-repair/core.js). Codex integration follows the [official non-interactive CLI documentation](https://developers.openai.com/codex/noninteractive) and the [reviewed Codex Action](https://github.com/openai/codex-action/tree/a8d8be6ee028bea4525bc722d16f36687b408c81).
