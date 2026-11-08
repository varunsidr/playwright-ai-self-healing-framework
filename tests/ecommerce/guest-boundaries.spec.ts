import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';
import {
  fictionalCartVariants,
  seedRawBrowserCart,
  useInrStorefrontRegion,
} from '../../fixtures/ecommerce-browser-cart';

test.describe('Zeouf read-only guest boundaries', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-AUTH-05-CORE blank password reset stays local @negative', async ({
    context,
    storefront,
  }) => {
    const writes = await blockEcommerceWrites(context);
    await storefront.openHome();
    await storefront.openAccountPanel();
    await storefront.forgotPasswordButton.click();
    await expect(storefront.resetEmailRequiredMessage).toBeVisible();
    expect(writes).toEqual([]);
  });

  test('TC-CHK-001-01 signed-out checkout discards the unowned legacy bag @negative', async ({
    context,
    page,
    storefront,
  }) => {
    const writes = await blockEcommerceWrites(context);
    await useInrStorefrontRegion(context);
    await seedRawBrowserCart(context, JSON.stringify(fictionalCartVariants), null);
    await storefront.openRoute('/checkout');
    await expect(storefront.checkoutSignInMessage).toBeVisible();
    await expect(storefront.checkoutEmptyMessage).toBeVisible();
    await expect(storefront.simulatePaymentButton).toBeDisabled();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('els-cart'))).toBeNull();
    expect(writes).toEqual([]);
  });

  test('TC-OPS-01-CORE health reports liveness without database readiness claims @happy', async ({
    request,
  }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    const body = await response.json();
    expect(body).toEqual({ status: 'ok', time: expect.any(String) });
    expect(Number.isNaN(Date.parse(body.time))).toBe(false);
  });

  test('TC-OPS-05-CORE schema read reports SQL or an explicit missing file @happy', async ({
    request,
  }) => {
    const response = await request.get('/api/schema');
    const text = await response.text();
    if (response.status() === 404) {
      expect(text).toBe('Schema file not found');
    } else {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toMatch(/text\/plain/i);
      expect(text).toMatch(/create\s+table/i);
    }
  });
});
