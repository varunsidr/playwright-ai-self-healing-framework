# Remaining browser and local service boundaries

Sources: the reviewed requirements and cases in `requirements/case-catalog.json`; CAT-07's scoped revision in `requirements/requirement-updates.json`; unchanged Zeouf source `843646b7d0c52ef5149f7905b19ec5d87fe5054b`. The user confirmed that no isolated staging environment is available. Preserve expected behavior and report failures; frontend mocks and local denial responses do not establish backend acceptance.

## Browser scenarios

- TC-CAT-02-CORE: Men's New Arrivals, Best Sellers and Collection select the documented tag populations using controlled GET responses.
- TC-CAT-005-02: positive aggregate stock is the fallback when sized stock rows are absent; when rows exist, selected S/M availability controls inclusion.
- TC-CAT-04-CORE: hold the region GET while applying nonzero minimum and restricted maximum INR bounds; release a USD response and require both price bounds to reset and all matching products to return.
- TC-CAT-007-01: after loading all 49 products, changing a brand filter to 30 matches resets the visible first batch to 24, following the reviewed scenario. A separate no-match/clear-all branch restores the initial matching count and actionable Load More control. Record a failure if reset is missing.
- TC-NAV-001-01: use the browser clock to verify visible auto-rotation, pause/resume and offscreen suspension/resumption. Extend reduced-motion coverage across timer advances. These checks do not establish real hidden-tab behavior.
- TC-PDP-001-01: use a mobile context with touch input to verify visible quick-add, guest denial and an empty browser cart.

Automation: [catalog boundaries](../../tests/ecommerce/catalog-boundaries-fixture.spec.ts), [hero](../../tests/ecommerce/home-hero.spec.ts), [cards](../../tests/ecommerce/product-card-fixture.spec.ts).

```powershell
npx playwright test tests/ecommerce/catalog-boundaries-fixture.spec.ts tests/ecommerce/home-hero.spec.ts tests/ecommerce/product-card-fixture.spec.ts --project=ecommerce-chromium --workers=1 --retries=0
```

## Real local production handlers

Automation: [local service boundaries](../../tests/ecommerce/isolated/service-boundaries.spec.ts). Run through the existing isolated wrapper, which clones and builds the clean pinned website with placeholder services, no service-role/mail credentials and a loopback origin:

```powershell
npm run test:ecommerce:isolated -- test-results/coverage-runtime/website test-results/remaining-boundaries-isolated
```

- TC-RST-005-01: real GET and POST unsubscribe handlers reject missing, empty, 63/65-character, nonhex and whitespace tokens with HTTP 400. Valid-shape hex tokens return the documented service-unavailable response without service credentials. No real alert is read or deleted; valid/repeated deletion and RLS still need staging.
- TC-NFR-008-01: actual admin-login, checkout, review, review-upload and restock handlers return their specific HTTP 503 responses when the shared production limiter is unconfigured. Fictional proxy headers do not enable a local fallback. These are single-instance configuration-denial checks; shared counters, fifth/sixth-attempt limits, trusted-proxy deployment, RPC failures and multi-instance enforcement remain unverified.

These APIRequestContext requests bypass browser mocks and are permitted only against the isolated loopback build. The isolated fixture refuses public origins. Preserve the existing check IDs and link every new executable title to its exact case and limited scope.

## Execution

### Latest complete verification after the fix

On 26 October 2026, fresh complete runs against the updated coverage inventory passed **all 289 mapped checks**. Both batches used one worker and zero retries, with no skips, flaky results, failures or runner errors:

| Batch                            | Outcome                                                    | Evidence                                                                     |
| -------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Public-safe storefront suite     | 154 passed                                                 | `test-results/docs-ready-public-2026-10-26/results.json`                     |
| Isolated frontend/local handlers | 135 passed; protected inputs unchanged                     | `test-results/docs-ready-isolated-2026-10-26/result.json` and `results.json` |
| Combined monitoring              | 289 passed; no unmapped tests; both inventory hashes match | `test-results/ecommerce-monitoring.json` and `.md`                           |
| Quality gate                     | Passed, including all 48 script regressions                | `npm run check`                                                              |

The public batch tested the mutable storefront origin. The isolated batch built the unchanged pinned website revision `843646b7d0c52ef5149f7905b19ec5d87fe5054b` with placeholder services; it does not test the newly deployed website's database integration. The public deployment's source identity remains independently unverified. These are local working-tree results, not a new pushed-commit CI result or full acceptance of all requirements. The previous combined failure snapshot is preserved under `test-results/docs-ready-previous-monitoring-2026-10-26/`; its raw reports remain unchanged.

### Initial complete verification before the fix

The initial 26 October complete run covered all **289 individually mapped checks**, with **288 passed and one failed**. Both complete batches used one worker and zero retries, with no skips, flaky results or runner errors:

| Batch                                          | Outcome                                            | Evidence                                                                          |
| ---------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Complete public read-only browser suite        | 153 passed, one failed                             | `test-results/remaining-boundaries-public-final/results.json`                     |
| Complete isolated frontend/local-handler suite | 135 passed                                         | `test-results/remaining-boundaries-isolated-final/result.json` and `results.json` |
| Framework quality gate                         | Passed all checks, including 48 script regressions | `npm run check`                                                                   |
| Mapping validation                             | 289 executable checks, 88/108 mapped cases         | `npm run cases:zeouf:mappings`                                                    |

Of the **29 added checks**, **28 passed and one exposed the filter-reset defect**. The existing reduced-motion check was also strengthened with a browser-clock advance. The isolated wrapper verified unchanged protected framework inputs, and website lint, typecheck and build passed. Its website revision is `843646b7d0c52ef5149f7905b19ec5d87fe5054b`; it used fictional sessions/responses and placeholder services. The public batch tested the mutable public origin and does not prove that deployment's exact source revision. Neither batch establishes staging/database/email acceptance.

The initial targeted public run is preserved under `test-results/remaining-boundaries-public-run1/` (15 passed, one failed). The initial isolated run is preserved under `test-results/remaining-boundaries-isolated-run1/` (135 passed). Those complete runs followed the then-finalized coverage descriptions and catalog hashes; their earlier evidence was not overwritten. Their combined 288-pass/one-failure snapshot is now archived under `test-results/docs-ready-previous-monitoring-2026-10-26/`. The preceding 260-check snapshot was already archived under `test-results/remaining-boundaries-previous-monitoring/`.

### CAT-07 defect and verified fix

The reviewed case explicitly requires filtering to reset the visible first batch. With 49 fictional products, the test loads 24, then 48, then 49, selects Brand A with 30 matches, and expects 24 visible cards plus Load More. The initial targeted and complete runs observed **30 cards**, failing the unchanged `toHaveCount(24)` assertion. This historical failure was not a navigation timeout and was not marked expected, skipped or retried.

The pre-fix reference website's `ProductListing.tsx` initialized `visibleCount` to 24 and incremented it on Load More without a filter-change reset. This source observation was consistent with the public symptom; the public deployment itself was not source-pinned. Later count/button assertions in the failing runs were not reached.

After the developer reported a fix on 26 October 2026, the unchanged regression passed **three repetitions**, followed by **30/30 passing related catalog checks**, all with one worker and zero retries/skips/flaky results. It now verifies 24 of 30 matching products with Load More available, then 30 of 30 with the button absent. Test assertions and expected behavior were unchanged.

Focused fix evidence is retained in `test-results/pagination-fix-check-17dc508f53af48da843f5ac2b2513a0f/` and `test-results/pagination-fix-catalog-2aee786377ae4696a8e515bf3479bddf/`. The repeated report is diagnostic evidence and is not substituted for a primary full-suite report. These results establish the tested frontend behavior with controlled GET fixtures, not live database acceptance or a pinned deployment revision. The earlier 288-pass/one-failure combined snapshot above remains valid for its original run.

The full run's malformed-cart and mobile Men navigation checks passed. Their older failures remain in their separate reports; this pass does not establish that their intermittent causes are resolved. No website code, deployment or GitHub settings changed in this batch.

### Remaining scope

There are **88 mapped and 20 browser-unmapped case records**. Five of the 20 have their separately registered native/manual evidence; 15 still lack browser mappings. All **17 cases needing staging or product decisions remain open for full acceptance**, including the two now receiving narrow local-handler checks. Other mapped cases also retain partial scopes. The user's requested browser/fixture continuation does not provide the separate backend, disposable identities, controlled inboxes, concurrency setup or product decisions needed to close those requirements.
