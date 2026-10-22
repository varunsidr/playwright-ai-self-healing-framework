# Remaining browser-only coverage

This is the first browser-only batch. Continue with [admin and guest coverage](22-browser-only-admin-and-guest.md), [accounts, stock and reviewed analytics](23-browser-only-accounts-stock-analytics.md), [recovery and loading](24-browser-only-recovery-and-loading.md), and the latest [native checks and staging handoff](25-native-and-staging-completion.md). Current browser case/check counts and observed results are in `test-results/ecommerce-monitoring.md`; native evidence is separate. The validation below is retained historical evidence.

Target: the real Zeouf frontend, project `ecommerce-chromium`, seed `tests/ecommerce/seed.spec.ts`, existing storefront page object and `fixtures/ecommerce-base`. Source acceptance remains the reviewed BRD v1.5 snapshot plus the scoped CAT-07 update. Isolated validation uses website revision `843646b7d0c52ef5149f7905b19ec5d87fe5054b`; this is a separate source identity, not a requirements-baseline refresh or deployed revision claim.

No staging environment is available. Build a clean disposable website checkout with placeholder services using `test:ecommerce:isolated`. Never supply production credentials. Mock only backend contracts, retain actual React/UI behavior, and block all unhandled writes and fixture-host requests. A mocked session is frontend evidence; it does not establish real authentication, authorization, persistence, inventory transactions, email delivery or RLS.

## Product options

- TC-PDP-05-CORE: open a sized clothing fixture, assert all XS/S/M/L chest and waist values, close the guide and retain the trigger.
- TC-PDP-003-01: without a selected size Add is disabled and browser bag is empty; S stock zero is disabled; choose M stock four and explicitly add one M line.
- TC-PDP-04-CORE: quantity starts at one, cannot decrease below one, stops at L stock five, and clamps to four when M is chosen.
- TC-PDP-02-CORE: demo photograph product exposes one main image without gallery thumbnails or color controls. Named colors, color/photo correspondence and authenticated real additions remain open.
- TC-PDP-07-CORE: controlled zero, one and twelve related candidates; require zero/one/eight cards, correct links, and query category prefix, current-ID exclusion and limit eight. This does not test live database filtering.

## Checkout

- TC-CHK-02-CORE: each of the five blank shipping inputs blocks submission before any checkout request. Whitespace and server limits remain open.
- TC-CHK-04-CORE: both methods are labelled simulations; no card-number field; selected method reaches the local mock with fictional shipping details.
- TC-CHK-08-CORE: a successful mocked order response shows its ID, clears browser bag and offers Continue shopping. HTTP failure and network failure retain cart and form, expose error and permit an explicit successful retry. Actual saved orders and stock changes remain unverified.

## Account and favorites

- TC-AUTH-01-CORE: required name/email/password block requests; helper denial falls back to signup with full-name metadata and confirmation guidance. Actual provider policy and delivery remain open.
- TC-AUTH-07-CORE: controlled helper success avoids signup; controlled helper denial uses normal signup. This checks UI branching, not production helper authorization.
- TC-AUTH-003-01: controlled login denial keeps the panel and input intact; success closes it and a fake session survives reload. Real credential validation remains open.
- TC-FAV-01-CORE: local successful favorite insert/delete toggles detail icon; failed insert/delete preserves state. Database uniqueness, card behavior and ownership remain open.

## Reviews and restock

- TC-REV-003-01: image-upload failure, review HTTP failure and network failure keep form/preview; successful pending responses with/without image clear form/preview and show approval feedback without adding public reviews. Assert approved-only read query. No real upload or review is saved.
- TC-REV-002-01: an image over 2 MiB is rejected before upload. File signatures, private storage, authorization and server size/count rules remain open.
- TC-RST-01-CORE: invalid email blocks requests; controlled HTTP/network failure preserves email for explicit retry; outgoing product/options match selected browser fixture. API validation and storage remain open.
- TC-RST-03-CORE: controlled configured/unconfigured email responses produce different truthful feedback and clear email on success; mail delivery and persistence remain open.

## Region

TC-CUR-01-CORE: exercise India time-zone precedence, America time zones, US language and other locale fallback through the browser's actual region request. Call the real isolated region GET for non-US Vercel/Cloudflare country headers conflicting with USD fallback, including Vercel precedence. US server exchange-provider handling remains open; no exchange-rate SLA is invented.

## Execution and evidence

Run `npm run test:ecommerce:isolated -- <clean-Zeouf-checkout> <new-evidence-directory>`. The runner copies the exact website commit, rejects environment files, installs/builds with placeholder services, starts a new loopback server, and runs only `tests/ecommerce/isolated/` with one worker and zero retries. The seed was used for live discovery; all new specs use its ecommerce fixture and page-object conventions.

These specs are excluded from ordinary public test runs. Mapping discovery includes them without executing them. Retain raw JSON/HTML, browser-contract attachments, build logs and source identity separately from public evidence. Generate monitoring from reports produced with the same inventory hashes. Missing checks remain not-run; partial frontend coverage never promotes full case acceptance.

Validation on 21 October 2026: **43 isolated checks passed, zero failures/skips/flaky results and zero retries** against the pinned website revision. The runner verified unchanged framework inputs and all expected mappings. Evidence is in `test-results/isolated-coverage-2026-10-21-verified/`. Initial test-development runs remain separate: a Windows path-length build error, an unsupported assumption that the minimum-quantity button is disabled, and an overly broad color locator were corrected without changing the actual size/quantity/color expectations. The minimum is tested by clicking minus at one and asserting it remains one.

The public read-only regression batch recorded **142 passes and two navigation connection-reset failures** with three workers and zero retries. Both failed checks passed a separate one-worker, zero-retry recheck. Combined monitoring retains the original failures: **185 passing checks, two failed checks**, 57 mapped cases and 51 unlinked cases; this is not a clean full-suite pass. Public reports are in `test-results/browser-coverage-public-2026-10-21/` and `test-results/browser-coverage-navigation-recheck-2026-10-21/`. `npm run check` passed, and default test discovery was verified to exclude isolated specs.
