import { savedBrowserCart, test } from '../../../fixtures/ecommerce-isolated';
import { expect } from '../../../fixtures/ecommerce-base';
import { fictionalCartVariants, seedBrowserCart } from '../../../fixtures/ecommerce-browser-cart';

test('TC-CHK-005-01 forged browser prices are omitted from the checkout request', async ({
  context,
  storefront,
  shop,
}) => {
  await seedBrowserCart(context, [{ ...fictionalCartVariants[1], price: 1, quantity: 2 }]);
  await storefront.openRoute('/checkout');
  await expect(storefront.simulatePaymentButton).toBeEnabled();
  await storefront.fillFictionalShippingAddress();
  await storefront.simulatePaymentButton.click();
  await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
  const call = shop.calls.find((item) => item.path === '/api/checkout');
  expect(call?.body).toMatchObject({
    items: [
      {
        id: fictionalCartVariants[1].id,
        quantity: 2,
        size: 'M',
        color: 'Blue',
      },
    ],
  });
  const body = call?.body as { items: unknown[]; price?: unknown; total?: unknown };
  expect(Object.keys(body.items[0] as object).sort()).toEqual(['color', 'id', 'quantity', 'size']);
  expect(body).not.toHaveProperty('price');
  expect(body).not.toHaveProperty('total');
  // The controlled response cannot prove server price recomputation or stored order values.
});

test.describe('Zeouf isolated checkout UI', { tag: ['@ecommerce', '@regression'] }, () => {
  test.beforeEach(async ({ context, shop, storefront }) => {
    // Explicit fixture dependency installs the fake session before first navigation.
    expect(shop.calls).toEqual([]);
    await seedBrowserCart(context, [fictionalCartVariants[1]]);
    await storefront.openRoute('/checkout');
    await expect(storefront.simulatePaymentButton).toBeEnabled();
  });

  for (const name of ['Full name', 'Phone', 'Address', 'City', 'Postal code']) {
    test(
      'TC-CHK-02-CORE blank ' + name + ' prevents a checkout request',
      async ({ storefront, shop }) => {
        await storefront.fillFictionalShippingAddress();
        const field = storefront.checkoutShippingField(name);
        await field.fill('');
        await storefront.simulatePaymentButton.click();
        await expect(field).toBeFocused();
        expect(
          await field.evaluate((element) => (element as HTMLInputElement).validity.valueMissing),
        ).toBe(true);
        expect(shop.calls.filter((call) => call.path === '/api/checkout')).toEqual([]);
      },
    );
  }

  for (const method of ['card_demo', 'cash_on_delivery']) {
    test(
      'TC-CHK-04-CORE ' + method + ' is a simulation and successful response clears bag',
      async ({ context, storefront, shop }) => {
        await storefront.fillFictionalShippingAddress();
        await expect(
          storefront.visibleText(/no payment is charged and no order is shipped/i),
        ).toBeVisible();
        await expect(storefront.cardNumberFields()).toHaveCount(0);
        if (method === 'cash_on_delivery')
          await storefront.visibleText('Simulated cash on delivery').click();
        else
          await expect(
            storefront.visibleText(/No card details are needed, stored, or sent/),
          ).toBeVisible();
        await storefront.checkoutPaymentButton(method).click();
        await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
        await expect(
          storefront.visibleText(/No payment was charged, no delivery is arranged/),
        ).toBeVisible();
        const calls = shop.calls.filter((call) => call.path === '/api/checkout');
        expect(calls).toHaveLength(1);
        expect(calls[0].body).toMatchObject({
          paymentMethod: method,
          shippingAddress: { fullName: 'Fictional Shopper' },
        });
        await expect.poll(() => savedBrowserCart(context)).toEqual([]);
        await storefront.continueShoppingLink().click();
        await storefront.expectHomeLoaded();
      },
    );
  }

  for (const mode of ['error', 'network'] as const) {
    test(
      'TC-CHK-08-CORE ' + mode + ' preserves cart and permits explicit retry',
      async ({ context, storefront, shop }) => {
        shop.checkoutMode = mode;
        await storefront.fillFictionalShippingAddress();
        await storefront.simulatePaymentButton.click();
        await expect(
          storefront.visibleText(
            mode === 'error'
              ? 'Controlled fixture unavailable'
              : /Could not confirm your demo order/,
          ),
        ).toBeVisible();
        await expect(storefront.simulatePaymentButton).toBeEnabled();
        expect(await savedBrowserCart(context)).toEqual([fictionalCartVariants[1]]);
        await expect(storefront.checkoutShippingField('Full name')).toHaveValue(
          'Fictional Shopper',
        );
        await expect(storefront.visibleText(/Order ID:/)).toHaveCount(0);
        shop.checkoutMode = 'success';
        await storefront.simulatePaymentButton.click();
        await expect(storefront.visibleText('Order ID: isolated-order-001')).toBeVisible();
        expect(shop.calls.filter((call) => call.path === '/api/checkout')).toHaveLength(2);
        await expect.poll(() => savedBrowserCart(context)).toEqual([]);
      },
    );
  }
});
