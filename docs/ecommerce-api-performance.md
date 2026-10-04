# Zeouf API and Performance Checks

These checks target only the zeouf fashion storefront at `ECOMMERCE_BASE_URL` (default `https://zeouf-luxury-fashion-ecommerce.vercel.app`). Override the variable for a local or dedicated test deployment. The initial API expectations were taken from the separate Zeouf source repository; all six read-only API and HTTP checks passed against the deployed site on 2026-10-04.

## Playwright API Project

Run `npm run test:ecommerce:api`. The `ecommerce-api` project uses the existing ecommerce fixture and is separate from `ecommerce-chromium`.

- HTTP smoke requests `/`, `/women`, and `/perfume` and requires HTTP 200, HTML, and a nonempty body. These are the canonical routes; older Turkish paths redirect.
- Public JSON contract checks require `GET /api/health` to return `status: ok` and a timestamp; `GET /api/storefront/region` to return an uncached INR response or a positive USD rate for a US visitor; and `GET /api/reviews` without a product ID to return HTTP 400 and a specific error.
- These checks are read-only. The health endpoint proves application liveness only; it does not establish database readiness.

CI runs the read-only Zeouf API and browser smoke checks against the public deployment by default. When its `ECOMMERCE_BASE_URL` repository variable points to a dedicated test deployment, CI runs both full Zeouf projects instead. The public Notes API remains in the separate `api` project. The perfume checkout browser test registers an account and is skipped on the public deployment; run it only on a dedicated test deployment.

## Browser Navigation Baseline

Run `npm run perf:ecommerce:baseline`. Chromium visits the three canonical routes three times each in fresh contexts. The script records TTFB, DOMContentLoaded, load-event time, and resource count in `test-results/ecommerce-browser-metrics.json`, then prints median TTFB and load time.

These are laboratory navigation timings, not Core Web Vitals or pass/fail budgets. Compare runs only when the app build, host, browser, viewport, and network are comparable. The Zeouf BRD requirement NFR-06 has no current performance SLA. Set performance budgets after a stable baseline, controlled deployment, and agreed workload exist.

## k6 HTTP Smoke

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) separately, then run `npm run perf:ecommerce:smoke`. The script makes one read-only pass over the three pages and the health API with one virtual user. It fails for HTTP errors or missing HTML responses and reports request timings. It has no latency threshold yet and is not a capacity test.

Do not run sustained load against the public practice site or an uncontrolled production environment. Add representative workloads and latency/error budgets when a dedicated Zeouf test deployment exists.

## Next API Contracts

The app also defines checkout, review submission, admin, and test setup endpoints. Their successful paths require configured Supabase credentials, controlled test accounts, and cleanup. In particular, the current reset endpoint is not a guaranteed clean baseline. Add authenticated checkout and ownership checks only after those prerequisites are available; assert exact responses without creating persistent orders on a shared environment.
