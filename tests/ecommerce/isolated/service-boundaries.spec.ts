import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated';

// Requests bypass browser mocks. The fixture requires the isolated loopback build,
// whose shared limiter and service-role credentials are deliberately absent.
const deniedServices = [
  { path: '/api/admin/login', error: 'Admin sign in is temporarily unavailable.' },
  { path: '/api/checkout', error: 'Checkout is temporarily unavailable.' },
  { path: '/api/reviews', error: 'Reviews are temporarily unavailable.' },
  { path: '/api/reviews/upload', error: 'Uploads are temporarily unavailable.' },
  { path: '/api/restock-notifications', error: 'Restock alerts are temporarily unavailable.' },
];

for (const service of deniedServices) {
  test(`TC-NFR-008-01 unconfigured production limiter denies ${service.path}`, async ({
    request,
    shop,
  }) => {
    const response = await request.post(service.path, {
      headers: { 'x-forwarded-for': '198.51.100.10, 203.0.113.20' },
      data: {},
    });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ error: service.error });
    expect(response.headers()['set-cookie']).toBeUndefined();
    expect(shop.calls).toEqual([]);
  });
}

const invalidTokens = [
  { label: 'missing', query: '' },
  { label: 'empty', query: '?token=' },
  { label: 'short', query: '?token=' + 'a'.repeat(63) },
  { label: 'long', query: '?token=' + 'a'.repeat(65) },
  { label: 'nonhex', query: '?token=' + 'g'.repeat(64) },
  { label: 'whitespace', query: '?token=' + encodeURIComponent(' ' + 'a'.repeat(64)) },
];

for (const method of ['GET', 'POST'] as const) {
  for (const token of invalidTokens) {
    test(`TC-RST-005-01 ${method} rejects ${token.label} unsubscribe token before service access`, async ({
      request,
      shop,
    }) => {
      const response = await request.fetch('/api/restock-notifications/unsubscribe' + token.query, {
        method,
      });
      expect(response.status()).toBe(400);
      expect(response.headers()['content-type']).toContain('application/json');
      expect(await response.json()).toEqual({ error: 'This unsubscribe link is invalid.' });
      expect(shop.calls).toEqual([]);
    });
  }

  test(`TC-RST-005-01 ${method} valid-shape token fails closed without service credentials`, async ({
    request,
    shop,
  }) => {
    const response = await request.fetch(
      '/api/restock-notifications/unsubscribe?token=' + 'AB'.repeat(32),
      { method },
    );
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ error: 'Unsubscribe is temporarily unavailable.' });
    expect(shop.calls).toEqual([]);
  });
}
