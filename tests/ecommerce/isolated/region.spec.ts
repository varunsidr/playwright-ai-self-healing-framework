import { test } from '../../../fixtures/ecommerce-isolated';
import { expect } from '../../../fixtures/ecommerce-base';

const fallbacks = [
  {
    name: 'India time zone overrides US language',
    timezoneId: 'Asia/Kolkata',
    locale: 'en-US',
    currency: 'INR',
  },
  {
    name: 'America time zone selects USD',
    timezoneId: 'America/New_York',
    locale: 'en-GB',
    currency: 'USD',
  },
  {
    name: 'US language outside India selects USD',
    timezoneId: 'Europe/London',
    locale: 'en-US',
    currency: 'USD',
  },
  {
    name: 'other language and time zone select INR',
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    currency: 'INR',
  },
];

for (const scenario of fallbacks) {
  test.describe('Zeouf isolated region: ' + scenario.name, () => {
    test.use({ timezoneId: scenario.timezoneId, locale: scenario.locale });
    test('TC-CUR-01-CORE ' + scenario.name, async ({ page, storefront, shop }) => {
      expect(shop.calls).toEqual([]);
      const region = page.waitForRequest(
        (request) => new URL(request.url()).pathname === '/api/storefront/region',
      );
      await storefront.openHome();
      expect(new URL((await region).url()).searchParams.get('fallback')).toBe(scenario.currency);
      await storefront.expectHomeLoaded();
    });
  });
}

const headers: { name: string; values: Record<string, string>; country: string }[] = [
  {
    name: 'Vercel India overrides USD fallback',
    values: { 'x-vercel-ip-country': 'IN' },
    country: 'IN',
  },
  {
    name: 'Cloudflare Britain overrides USD fallback',
    values: { 'cf-ipcountry': 'GB' },
    country: 'GB',
  },
  {
    name: 'Vercel France precedes Cloudflare US',
    values: { 'x-vercel-ip-country': 'fr', 'cf-ipcountry': 'US' },
    country: 'FR',
  },
];

for (const scenario of headers) {
  test('TC-CUR-01-CORE ' + scenario.name, async ({ request, shop }) => {
    // Real GET to the isolated region route; these non-US branches never call the rate provider.
    expect(shop.calls).toEqual([]);
    const response = await request.get('/api/storefront/region?fallback=USD', {
      headers: scenario.values,
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');
    expect(await response.json()).toEqual({
      country: scenario.country,
      currency: 'INR',
      rate: 1,
      rateDate: null,
    });
  });
}
