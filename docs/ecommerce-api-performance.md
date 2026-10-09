# Zeouf API and Performance Checks

These checks target only the zeouf fashion storefront at `ECOMMERCE_BASE_URL` (default `https://zeouf-luxury-fashion-ecommerce.vercel.app`). Override the variable for a local or dedicated test deployment. The initial API expectations were taken from the separate Zeouf source repository; all six read-only API and HTTP checks passed against the deployed site on 2026-10-04.

## Playwright API Project

Run `npm run test:ecommerce:api`. The `ecommerce-api` project uses the existing ecommerce fixture and is separate from `ecommerce-chromium`.

- HTTP smoke requests `/`, `/women`, and `/perfume` and requires HTTP 200, HTML, and a nonempty body. These are the canonical routes; older Turkish paths redirect.
- Public JSON contract checks require `GET /api/health` to return `status: ok` and a timestamp; `GET /api/storefront/region` to return an uncached INR response or a positive USD rate for a US visitor; and `GET /api/reviews` without a product ID to return HTTP 400 and a specific error.
- These checks are read-only. The health endpoint proves application liveness only; it does not establish database readiness.

CI runs the read-only Zeouf API and browser smoke checks against the public deployment by default. When its `ECOMMERCE_BASE_URL` repository variable points to a dedicated test deployment, CI runs both full Zeouf projects instead. The public Notes API remains in the separate `api` project. The perfume checkout browser test registers an account and is skipped on the public deployment; run it only on a dedicated test deployment.

## Browser Shopper Experience

Run `npm run perf:ecommerce:baseline`. Chromium measures six read-only shopper states on desktop (1365 × 768) and a mobile viewport (390 × 844), with three fresh browser contexts per state:

| State                | Why it matters                             | Ready signal                                     |
| -------------------- | ------------------------------------------ | ------------------------------------------------ |
| Home                 | First storefront impression and cart entry | Hero heading and poster image are ready          |
| Women collection     | High-volume catalog browsing               | First product card is present                    |
| Perfume collection   | Featured shopping journey                  | First product card is present                    |
| Search for "perfume" | Client-fetched discovery results           | First matching product card is present           |
| Perfume product      | Product decision page                      | Add-to-cart control is present                   |
| Guest checkout       | Checkout entry and sign-in gate            | Checkout heading and sign-in message are present |

The product route is discovered from the first visible perfume card at the start of each baseline run, so the report records its actual path without pinning an inventory ID. The home sample also measures how long the empty cart takes to open. No account, order, review, or payment is created.

The JSON report at `test-results/ecommerce-browser-metrics.json` includes every sample and per-state medians for TTFB, DOMContentLoaded, load, content readiness, FCP, LCP, load-window CLS, long-task blocking time, resource count, and same-origin transferred bytes. It also retains the worst TTFB, content-readiness, and LCP values so a slow run cannot disappear behind a median. Navigation waits for DOMContentLoaded and the scenario's ready signal; `loadMs` is null if the load event has not fired by the end of observation. Non-200 page responses, missing ready signals, and same-origin HTTP 5xx responses are recorded as failures. The script continues measuring other states, saves the report, and exits with an error when any sample fails.

`ECOMMERCE_PERF_RUNS` sets 1–5 runs per state (default 3). Set `ECOMMERCE_PERF_PROFILE=desktop` or `mobile` to measure one layout. An optional JSON budget file can turn selected medians or worst values into pass/fail gates. Create the file before running this command:

```powershell
$env:ECOMMERCE_PERF_BUDGET_FILE = 'performance/ecommerce/budgets.json'
npm run perf:ecommerce:baseline
```

To change a budget without sending another round of requests, run `npm run perf:ecommerce:check` against the last saved report with the same budget variable set.

The file uses scenario keys such as `desktop.home` and metric names from the report:

```json
{
  "desktop.home": { "contentReadyMs": 3000, "lcpMs": 3000 },
  "mobile.search": { "contentReadyMs": 5000, "loadCls": 0.25 }
}
```

These values illustrate the format; they are not an agreed Zeouf service goal. Establish budgets from repeated runs on a controlled build and runner. Compare measurements only when the app build, host, browser, viewport, and network are comparable. This script does not throttle the network. LCP and CLS cover page load plus a 1.5-second observation window after content is ready; they are synthetic partial measurements, not field Core Web Vitals. Cart-opening time includes browser automation overhead and is not INP. The Zeouf BRD requirement NFR-06 has no current performance SLA.

The `Zeouf Performance Baseline` GitHub workflow can be started manually to save the JSON report as an artifact. It uses the repository `ECOMMERCE_BASE_URL` variable when set; otherwise it uses the public Zeouf URL. It is a diagnostic run, not a required PR performance gate.

In a 2026-10-04 run with three samples per state, desktop search had a load-window CLS of 0.335 in all three samples. One desktop home sample had a 19.1-second TTFB, while the other two were 107 ms and 81 ms. These are investigation leads, not a service-level conclusion; repeat them on a controlled runner and inspect the app's loading behavior and hosting logs.

## k6 HTTP Smoke

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) separately, then run `npm run perf:ecommerce:smoke`. One virtual user makes three sequential read-only passes over home, women, perfume, search, guest checkout, health, and region endpoints (21 GET requests total). It checks HTTP 200 and content type, prints per-route waiting and duration, and fails on HTTP errors. This remains an HTTP availability and latency smoke, not a browser or capacity test.

Set `ECOMMERCE_HTTP_P95_MS` to add an optional overall p95 request-duration threshold. Use a value based on repeated runs and the intended environment; three iterations are too few for a reliable service-level percentile. k6's request duration excludes initial DNS and connection time.

Do not run sustained load against the public practice site or an uncontrolled production environment. Add representative workloads and latency/error budgets when a dedicated Zeouf test deployment exists.

## Next API Contracts

The app also defines checkout, review submission, admin, and test setup endpoints. Their successful paths require configured Supabase credentials, controlled test accounts, and cleanup. In particular, the current reset endpoint is not a guaranteed clean baseline. Add authenticated checkout and ownership checks only after those prerequisites are available; assert exact responses without creating persistent orders on a shared environment.
