# Expanded real-model evaluation

The opt-in real-model evaluation now exercises forty controlled faults across newsletter preview, shopping bag, account, search dialog and registration form interactions. It measures classification and constrained locator proposals from supplied browser evidence. It does not measure autonomous evidence collection, arbitrary source repair or production reliability.

## Observed result: 12 November 2026

The completed run passed every predefined acceptance check. Evidence is retained under `test-results/expanded-evaluation-structural-2026-11-12/`.

| Measurement                                      | Observed result                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| Unmodified flow baselines                        | 5/5 passed                                                        |
| Validated faults                                 | 40/40; eight per flow, ten per classification                     |
| Correct classifications                          | 40/40; 100% recall in each classification                         |
| Locator repair proposals                         | 10; all ten passed full-contract verification in fresh contexts   |
| Verified repair recall / proposal precision      | 100% / 100%                                                       |
| Unsafe proposals / availability repair proposals | Zero / zero                                                       |
| Server write attempts                            | Zero                                                              |
| Original POM                                     | Hash unchanged                                                    |
| Packet-only model execution                      | Four completed calls; zero MCP, shell, file-edit or web calls     |
| Model wall time                                  | 81.011 seconds summed across four sequential calls                |
| Reported model usage                             | 82,680 input tokens, including 14,592 cached; 3,017 output tokens |
| Repository checks                                | `npm run check` passed with exit code zero                        |

The artifact audit rechecked input and evaluator-source hashes, each injected failure's provenance, exact batch prompts and prediction coverage, resolved disabled MCP servers, tool-use metrics and the acceptance decision. Its reproducible script and result are `audit.cjs` and `audit.json`; run the script from the repository root. Repository-check evidence is `repository-checks.json` with the hashed log at `test-results/expanded-evaluation-final-check-2026-11-12.log`.

Two earlier collection attempts remain separate. `test-results/expanded-evaluation-2026-11-12/` stopped after 26 valid observations because a later document returned HTTP 200 but timed out waiting for full load. `test-results/expanded-evaluation-dom-ready-2026-11-12/` stopped at the cart baseline because DOM readiness preceded stable drawer behavior. Neither attempt called the model. The final structural profile waits for scripts/styles while omitting visual resources, with all five baselines passing before collection. These attempts were not relabeled or included in the forty-case score.

This is one controlled run on the mutable public Zeouf origin with supplied diagnostic probes, repeated fault mechanisms and no visual-resource coverage. It qualifies for a reviewed observation pilot under the project's engineering gate; CI was not remotely enabled and no automatic source changes were applied. The earlier full shuffled regression still stands at 127/128 with a separately recorded connection reset.

## Acceptance policy

The runner saves its policy before collecting observations and freezes a hashed manifest before calling the model. These thresholds were selected before seeing predictions:

| Requirement                          | Threshold                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Corpus size                          | At least 40 cases                                                                             |
| Class coverage                       | At least 10 each: test, application, environment, unknown                                     |
| Flow coverage                        | At least 6 cases in each of the five flows                                                    |
| Classification accuracy              | At least 90%                                                                                  |
| Recall within every classification   | At least 80%                                                                                  |
| Independently verified repair recall | At least 80% of repair-eligible faults                                                        |
| Proposal precision                   | 100% of proposals independently verified                                                      |
| Unsafe proposals                     | Zero, including proposals rejected by safety gates                                            |
| Environment repair proposals         | Zero                                                                                          |
| Server write attempts                | Zero                                                                                          |
| Integrity                            | All faults validated, original POM unchanged, exact prediction coverage and no model tool use |

Passing means eligible for a reviewed observation pilot. It does not enable automatic changes or remotely configure CI. Failing any check returns a nonzero exit code and retains the complete result. A model that abstains from everything cannot pass the repair-recall threshold.

The policy is implemented in `scripts/ecommerce-agents/evaluation.js`; policy and provenance regression tests run through the existing `npm run test:agents` and `npm run check` commands without calling a model.

## Corpus and verification

Each run has ten unique locator-drift targets, ten application regressions, ten availability faults and ten ambiguous, incomplete or mixed observations. Each flow contributes eight cases. Identifiers, input strings and case ordering are randomized. Repeated failure mechanisms across a single application remain correlated; forty cases are not forty independently sampled production incidents.

Availability cases include connection reset, connection refusal, disconnected network, name-resolution failure, timeout and HTTP 503. The connection-reset case tests diagnosis and abstention for the error observed in the earlier shuffled regression; it does not establish the root cause of that original network incident.

Application cases disable an expected action or violate an existing output/modal contract. Unknown cases contain indistinguishable controls, deliberately missing evidence, or both locator drift and a behavior regression. Injected changes exist only in disposable browser contexts. No production DOM or source is persisted, and registration is never submitted.

Unmodified baselines must pass before injection. Every injected UI fault must reach the contract stage and fail on the intended control or behavior. Injected availability failures must match the recorded document error. A network outage during a UI case blocks collection instead of acquiring that case's intended truth label. A controller-operated probe establishes whether the complete flow still works using the known replacement; that probe is supplied evidence, not an agent accomplishment.

This structural corpus loads scripts and styles and waits for the document load event, while omitting image, video and font requests. Those omissions and their counts are recorded in the evidence. This profile covers input/dialog behavior, not visual rendering or media availability, and does not change ordinary test configuration.

The evaluator receives matching POM members, before/failure control observations, the unchanged intent, network evidence and probe results. Labels and injection definitions remain outside model inputs. Four independent model calls each receive ten shuffled cases without class proportions. They inherit the user's CLI model settings. Any observed MCP, shell, web or file-edit tool use invalidates packet-only evaluation.

Proposed patches must pass the existing test-ID-literal-only AST gate and identify one observed element. The controller rejects proposals for non-repairable cases, counts them as unsafe and never executes them. Eligible proposals must pass the entire original flow contract in a fresh context with the same fault injected. No assertion or production source is changed.

## Running and reading evidence

```powershell
npm run evaluate:ecommerce:real-agent -- test-results/my-new-expanded-evaluation
```

Use Node 24 and a new evidence directory. This command performs actual signed-in Codex CLI calls and public read-only browser interactions. The offline benchmark remains separate.

The directory contains the frozen `acceptance-policy.json`, `evaluation-manifest.json`, private scenario definitions and labels, `observations/`, model-visible `observed-packets.json`, per-batch prompts/events/usage, predictions and final `result.json`. Source, packet, policy and scenario hashes identify the inputs. Original blocked or failed runs must remain separate from subsequent runs.

The [earlier validation report](ecommerce-real-agent-validation-2026-11-12.md) preserves the eight-case baseline and real tri-agent rehearsal. They are not pooled with this expanded corpus. [OpenAI's evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) supports defining measurable criteria and expanding representative cases; the numerical thresholds above are this project's engineering choices.
