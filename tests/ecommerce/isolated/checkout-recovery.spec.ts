import { expect } from '../../../fixtures/ecommerce-base';
import {
  test,
  customerId,
  secondCustomerId,
  savedBrowserCart,
  setFictionalSession,
} from '../../../fixtures/ecommerce-isolated';
import { fictionalCartVariants, seedBrowserCart } from '../../../fixtures/ecommerce-browser-cart';

test.beforeEach(async ({ context, storefront, shop }) => {
  shop.checkoutMode = 'network';
  await seedBrowserCart(context, [fictionalCartVariants[1]], customerId);
  await seedBrowserCart(context, [fictionalCartVariants[1]], secondCustomerId);
  await storefront.openRoute('/checkout');
  await storefront.fillFictionalShippingAddress();
});

for (const method of ['card_demo', 'cash_on_delivery']) {
  test(`TC-CHK-010-01 ${method} lost response survives reload with the same attempt key`, async ({
    storefront,
    shop,
    page,
    context,
  }) => {
    if (method === 'cash_on_delivery')
      await storefront.visibleText('Simulated cash on delivery').click();
    await storefront.checkoutPaymentButton(method).click();
    await expect(
      storefront.visibleText(
        'Could not confirm your demo order. Retry with the same details to safely check this attempt.',
      ),
    ).toBeVisible();
    await expect(storefront.checkoutPaymentButton(method)).toBeEnabled();
    expect(await savedBrowserCart(context)).toEqual([fictionalCartVariants[1]]);
    const calls = () => shop.calls.filter((call) => call.path === '/api/checkout');
    const firstKey = calls()[0].idempotencyKey;
    expect(firstKey).toMatch(/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
    const stored = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('zeouf-checkout-attempt') || '{}'),
    );
    expect(Object.keys(stored).sort()).toEqual(['fingerprint', 'key']);
    expect(stored.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.key).toBe(firstKey);
    await page.reload();
    await storefront.fillFictionalShippingAddress();
    if (method === 'cash_on_delivery')
      await storefront.visibleText('Simulated cash on delivery').click();
    shop.checkoutMode = 'success';
    await storefront.checkoutPaymentButton(method).click();
    await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
    expect(calls()).toHaveLength(2);
    expect(calls()[1].idempotencyKey).toBe(firstKey);
    expect(calls()[1].body).toEqual(calls()[0].body);
    expect(await savedBrowserCart(context)).toEqual([]);
    expect(await page.evaluate(() => sessionStorage.getItem('zeouf-checkout-attempt'))).toBeNull();
    await expect(
      storefront.visibleText(/No payment was charged, no delivery is arranged/),
    ).toBeVisible();
  });
}

for (const change of ['address', 'method', 'items', 'customer']) {
  test(`TC-CHK-010-02 changed ${change} creates a different attempt key`, async ({
    storefront,
    shop,
    page,
    context,
  }) => {
    await storefront.simulatePaymentButton.click();
    await expect(storefront.visibleText(/Could not confirm your demo order/)).toBeVisible();
    const firstKey = shop.calls.find((call) => call.path === '/api/checkout')!.idempotencyKey;
    if (change === 'address') await storefront.checkoutShippingField('City').fill('Different city');
    if (change === 'method') await storefront.visibleText('Simulated cash on delivery').click();
    if (change === 'items') {
      await storefront.openCart();
      await storefront.changeCartQuantity('M', 'Increase');
      await storefront.closeCart();
    }
    if (change === 'customer') {
      shop.loginUserId = secondCustomerId;
      await setFictionalSession(context, secondCustomerId);
      await expect(storefront.checkoutShippingField('Full name')).toHaveValue('');
      await storefront.fillFictionalShippingAddress();
    }
    shop.checkoutMode = 'success';
    await storefront
      .checkoutPaymentButton(change === 'method' ? 'cash_on_delivery' : 'card_demo')
      .click();
    await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
    const calls = shop.calls.filter((call) => call.path === '/api/checkout');
    expect(calls).toHaveLength(2);
    expect(calls[1].idempotencyKey).not.toBe(firstKey);
    expect(await page.evaluate(() => sessionStorage.getItem('zeouf-checkout-attempt'))).toBeNull();
    if (change === 'customer')
      expect(await savedBrowserCart(context, customerId)).toEqual([fictionalCartVariants[1]]);
  });
}

for (const [label, value] of [
  ['invalid JSON', '{bad'],
  ['invalid record', '{"fingerprint":"bad","key":7}'],
]) {
  test(`TC-CHK-010-02 ${label} attempt storage recovers with a UUID key`, async ({
    page,
    storefront,
    shop,
  }) => {
    await page.evaluate((value) => sessionStorage.setItem('zeouf-checkout-attempt', value), value);
    shop.checkoutMode = 'success';
    await storefront.simulatePaymentButton.click();
    await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
    expect(shop.calls.find((call) => call.path === '/api/checkout')!.idempotencyKey).toMatch(
      /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/,
    );
  });
}
