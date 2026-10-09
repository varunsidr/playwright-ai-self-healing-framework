import http from 'k6/http';
import { check, sleep } from 'k6';

const baseURL = (
  __ENV.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app'
).replace(/\/$/, '');
const p95BudgetMs = __ENV.ECOMMERCE_HTTP_P95_MS ? Number(__ENV.ECOMMERCE_HTTP_P95_MS) : null;
if (p95BudgetMs !== null && (!Number.isFinite(p95BudgetMs) || p95BudgetMs <= 0)) {
  throw new Error('ECOMMERCE_HTTP_P95_MS must be a positive number.');
}
const routes = [
  { name: 'home', path: '/', type: 'html' },
  { name: 'women', path: '/women', type: 'html' },
  { name: 'perfume', path: '/perfume', type: 'html' },
  { name: 'search', path: '/arama?q=perfume', type: 'html' },
  { name: 'checkout-guest', path: '/checkout', type: 'html' },
  { name: 'health', path: '/api/health', type: 'json' },
  { name: 'region', path: '/api/storefront/region?fallback=INR', type: 'json' },
];
const thresholds = {
  checks: ['rate==1'],
  http_req_failed: ['rate==0'],
};
if (p95BudgetMs !== null) {
  thresholds.http_req_duration = ['p(95)<' + p95BudgetMs];
}

export const options = {
  scenarios: {
    storefront_smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '2m',
    },
  },
  thresholds,
};

export default function () {
  for (const route of routes) {
    const response = http.get(baseURL + route.path, {
      tags: { route: route.name },
      timeout: '10s',
    });
    const expectedContentType = route.type === 'json' ? /application\/json/i : /text\/html/i;
    check(response, {
      [route.name + ' returns HTTP 200']: (result) => result.status === 200,
      [route.name + ' serves the expected content type']: (result) =>
        expectedContentType.test(result.headers['Content-Type'] || ''),
    });
    const waiting = Number.isFinite(response.timings?.waiting)
      ? response.timings.waiting.toFixed(0)
      : 'n/a';
    const duration = Number.isFinite(response.timings?.duration)
      ? response.timings.duration.toFixed(0)
      : 'n/a';
    console.log(
      route.name +
        ': HTTP ' +
        response.status +
        ', waiting ' +
        waiting +
        ' ms, duration ' +
        duration +
        ' ms',
    );
  }
  sleep(1);
}
