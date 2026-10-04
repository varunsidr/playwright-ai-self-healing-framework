import { expect, test } from '../../../fixtures/ecommerce-base';

const storefrontRoutes = [
  { path: '/', name: 'home' },
  { path: '/women', name: 'women collection' },
  { path: '/perfume', name: 'perfume collection' },
] as const;

test.describe('Zeouf storefront HTTP smoke', { tag: ['@ecommerce', '@api', '@smoke'] }, () => {
  for (const route of storefrontRoutes) {
    test(`serves the ${route.name} page`, async ({ request }) => {
      const response = await request.get(route.path);

      expect(response.status(), `${route.path} should return HTTP 200`).toBe(200);
      expect(response.headers()['content-type']).toMatch(/text\/html/i);
      expect((await response.body()).length).toBeGreaterThan(0);
    });
  }
});
