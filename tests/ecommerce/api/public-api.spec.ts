import { expect, test } from '../../../fixtures/ecommerce-base';

test.describe('Zeouf public API contracts', { tag: ['@ecommerce', '@api', '@smoke'] }, () => {
  test('health reports application liveness and a timestamp', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok', time: expect.any(String) });
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  test('storefront region returns a valid currency response', async ({ request }) => {
    const response = await request.get('/api/storefront/region?fallback=INR');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    expect(response.headers()['cache-control']).toMatch(/private.*no-store/i);

    const body = await response.json();
    expect(body.country).toMatch(/^[A-Z]{2}$/);
    expect(['INR', 'USD']).toContain(body.currency);
    if (body.currency === 'INR') {
      expect(body.rate).toBe(1);
      expect(body.rateDate).toBeNull();
    } else {
      expect(body.country).toBe('US');
      expect(Number.isFinite(body.rate)).toBe(true);
      expect(body.rate).toBeGreaterThan(0);
      expect(body.rateDate === null || typeof body.rateDate === 'string').toBe(true);
    }
  });

  test('reviews require a product ID', async ({ request }) => {
    const response = await request.get('/api/reviews');

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    expect(await response.json()).toEqual({ error: 'productId required' });
  });
});
