import http from 'k6/http';
import { check } from 'k6';

const baseURL = (__ENV.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app').replace(/\/$/, '');
const routes = ['/', '/women', '/perfume', '/api/health'];

export const options = {
  scenarios: {
    storefront_smoke: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '1m',
    },
  },
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  for (const route of routes) {
    const response = http.get(`${baseURL}${route}`, {
      tags: { route },
      timeout: '10s',
    });
    const expectedContentType = route.startsWith('/api/') ? /application\/json/i : /text\/html/i;

    check(response, {
      [`${route} returns HTTP 200`]: (result) => result.status === 200,
      [`${route} serves the expected content type`]: (result) =>
        expectedContentType.test(result.headers['Content-Type'] || ''),
    });
  }
}
