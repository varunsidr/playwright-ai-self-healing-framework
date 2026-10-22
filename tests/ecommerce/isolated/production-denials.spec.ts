import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated';

// APIRequestContext bypasses browser mocks. The runner builds a fresh loopback production
// server without backend credentials; reviewed routes deny before parsing or database access.
for (const [route, status] of [
  ['/api/test/reset', 404],
  ['/api/test/seed-user', 404],
  ['/api/dev/create-user', 403],
] as const) {
  test(
    'TC-OPS-002-01 real local production ' + route + ' denies helper access',
    async ({ request, shop }) => {
      expect(shop.calls).toEqual([]);
      const response = await request.post(route, { data: {} });
      expect(response.status()).toBe(status);
    },
  );
}

for (const credential of ['customer bearer', 'legacy dev key']) {
  test(
    'TC-ADM-002-02 real local review delete denies ' + credential + ' without signed admin cookie',
    async ({ request, shop }) => {
      expect(shop.calls).toEqual([]);
      const response = await request.delete(
        '/api/admin/reviews/10000000-0000-4000-8000-000000000001',
        {
          headers:
            credential === 'customer bearer'
              ? { Authorization: 'Bearer isolated-browser-access-token' }
              : { 'x-dev-key': 'fictional-retired-development-key' },
        },
      );
      expect(response.status()).toBe(401);
    },
  );
}
