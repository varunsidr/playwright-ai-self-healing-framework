import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';
import { fictionalCartVariants, seedBrowserCart } from '../../fixtures/ecommerce-browser-cart';

const cases = [
  {
    name: 'valid USD rate',
    status: 200,
    response: { country: 'US', currency: 'USD', rate: 0.025, rateDate: '2026-10-07' },
    expectedSubtotal: '$25',
  },
  {
    name: 'zero USD rate',
    status: 200,
    response: { country: 'US', currency: 'USD', rate: 0, rateDate: null },
    expectedSubtotal: '₹1,000',
  },
  {
    name: 'invalid USD rate',
    status: 200,
    response: { country: 'US', currency: 'USD', rate: 'invalid', rateDate: null },
    expectedSubtotal: '₹1,000',
  },
  {
    name: 'failed region request',
    status: 503,
    response: { error: 'Fixture service unavailable' },
    expectedSubtotal: '₹1,000',
  },
];

test.describe('Zeouf browser currency fallback', { tag: ['@ecommerce', '@regression'] }, () => {
  for (const scenario of cases) {
    test(`TC-CUR-02-CORE ${scenario.name} formats the browser cart subtotal @negative`, async ({
      context,
      storefront,
    }) => {
      const attemptedWrites = await blockEcommerceWrites(context);
      await context.route(/\/api\/storefront\/region\?/, (route) =>
        route.fulfill({
          status: scenario.status,
          contentType: 'application/json',
          body: JSON.stringify(scenario.response),
        }),
      );
      await seedBrowserCart(context, [fictionalCartVariants[1]]);

      await storefront.openHome();
      await storefront.openCart();
      await expect(storefront.cartSubtotal).toContainText(scenario.expectedSubtotal);
      expect(attemptedWrites).toEqual([]);
    });
  }
});
