import { expect } from '../../../fixtures/ecommerce-base';
import { fictionalCartVariants, seedBrowserCart } from '../../../fixtures/ecommerce-browser-cart';
import {
  deferBrowserResponse,
  savedBrowserCart,
  test,
  type IsolatedShop,
} from '../../../fixtures/ecommerce-isolated';

const checkoutCalls = (shop: IsolatedShop) =>
  shop.calls.filter((call) => call.path === '/api/checkout');

test.beforeEach(async ({ context, shop, storefront }) => {
  expect(shop.calls).toEqual([]);
  await seedBrowserCart(context, [fictionalCartVariants[1]]);
  await storefront.openRoute('/checkout');
  await expect(storefront.simulatePaymentButton).toBeEnabled();
  await storefront.fillFictionalShippingAddress();
});

for (const method of ['card_demo', 'cash_on_delivery']) {
  test(
    'TC-CHK-08-CORE ' + method + ' locks pending checkout and suppresses repeated form submissions',
    async ({ storefront, shop, context }) => {
      const held = deferBrowserResponse();
      shop.checkoutGate = held.response;
      if (method === 'cash_on_delivery')
        await storefront.visibleText('Simulated cash on delivery').click();
      try {
        await storefront.submitCheckoutTwice(method);
        await expect(storefront.checkoutPaymentButton(method)).toBeDisabled();
        await expect.poll(() => checkoutCalls(shop).length).toBe(1);
        expect(checkoutCalls(shop)[0].idempotencyKey).toMatch(
          /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/,
        );
        await expect(storefront.visibleText('Order ID: isolated-order-001')).toHaveCount(0);
        expect(await savedBrowserCart(context)).toEqual([fictionalCartVariants[1]]);
        held.release();
        await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
        expect(checkoutCalls(shop)).toHaveLength(1);
      } finally {
        held.release();
      }
    },
  );
}

test('TC-CHK-08-CORE unchanged retry after reload reuses client key and changed details get a new key', async ({
  storefront,
  shop,
  page,
}) => {
  shop.checkoutMode = 'error';
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Controlled fixture unavailable')).toBeVisible();
  const firstKey = checkoutCalls(shop)[0].idempotencyKey;
  const stored = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('zeouf-checkout-attempt') || '{}'),
  );
  expect(stored.key).toBe(firstKey);
  expect(stored.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  expect(Object.keys(stored).sort()).toEqual(['fingerprint', 'key']);
  await page.reload();
  await storefront.fillFictionalShippingAddress();
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Controlled fixture unavailable')).toBeVisible();
  expect(checkoutCalls(shop)[1].idempotencyKey).toBe(firstKey);
  await storefront.checkoutShippingField('City').fill('Different fictional city');
  shop.checkoutMode = 'success';
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
  expect(checkoutCalls(shop)[2].idempotencyKey).not.toBe(firstKey);
  expect(await page.evaluate(() => sessionStorage.getItem('zeouf-checkout-attempt'))).toBeNull();
  // Client key stability cannot certify backend replay safety or unique stored orders.
});

test('TC-CHK-08-CORE unavailable attempt storage retains the in-memory key for explicit retry', async ({
  storefront,
  shop,
  page,
}) => {
  await page.evaluate(() => {
    for (const method of ['getItem', 'setItem'] as const) {
      const original = Storage.prototype[method];
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value: function (this: Storage, key: string, value?: string) {
          if (this === sessionStorage && key === 'zeouf-checkout-attempt')
            throw new DOMException('Controlled attempt-storage denial', 'SecurityError');
          return Reflect.apply(original, this, method === 'getItem' ? [key] : [key, value]);
        },
      });
    }
  });
  shop.checkoutMode = 'error';
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Controlled fixture unavailable')).toBeVisible();
  const key = checkoutCalls(shop)[0].idempotencyKey;
  shop.checkoutMode = 'success';
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
  expect(checkoutCalls(shop)[1].idempotencyKey).toBe(key);
});

test('TC-CHK-08-CORE successful HTTP response without order ID preserves cart and attempt for retry', async ({
  storefront,
  shop,
  context,
}) => {
  shop.checkoutOrderId = null;
  await storefront.simulatePaymentButton.click();
  await expect(
    storefront.visibleText('We could not create your order. Please try again.'),
  ).toBeVisible();
  await expect(storefront.simulatePaymentButton).toBeEnabled();
  expect(await savedBrowserCart(context)).toEqual([fictionalCartVariants[1]]);
  shop.checkoutOrderId = 'isolated-order-001';
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
  expect(checkoutCalls(shop)[1].idempotencyKey).toBe(checkoutCalls(shop)[0].idempotencyKey);
});
