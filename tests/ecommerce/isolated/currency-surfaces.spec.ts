import { expect } from '../../../fixtures/ecommerce-base';
import { fictionalCartVariants, seedBrowserCart } from '../../../fixtures/ecommerce-browser-cart';
import { test } from '../../../fixtures/ecommerce-isolated-admin';

test('TC-CUR-003-01 controlled USD detail bag and order displays leave admin response values in INR', async ({
  context,
  storefront,
  shop,
  admin,
}) => {
  await context.route(/\/api\/storefront\/region\?/, (route) =>
    route.fulfill({
      json: {
        country: 'US',
        currency: 'USD',
        rate: 0.025,
        rateDate: '2026-10-07',
      },
    }),
  );
  await seedBrowserCart(context, [fictionalCartVariants[1]]);
  shop.orders = [
    {
      id: 'CURRENCY-order-001',
      total: 2000,
      status: 'pending',
      payment_method: 'card_demo',
      placed_at: '2026-10-20T12:00:00Z',
      order_items: [
        {
          id: 'currency-item',
          product_id: shop.products.sized.id,
          quantity: 2,
          unit_price: 1000,
          products: { name: 'Currency Fixture Product', image_url: '/kadin-product-1.jpg' },
        },
      ],
    },
  ];
  admin.orders = [{ ...admin.orders[0], total: 2000 }];
  expect(shop.products.sized.price).toBe(8900);
  await storefront.openProductRoute('/women/' + shop.products.sized.id, shop.products.sized.name);
  await expect(storefront.productDetailPrice()).toHaveText('$223');
  await storefront.openCart();
  await expect(storefront.cartSubtotal).toContainText('$25');
  await storefront.openRoute('/orders');
  await expect(storefront.customerOrder('CURRENCY')).toContainText('$50');
  await storefront.customerOrder('CURRENCY').click();
  await expect(storefront.visibleText('Currency Fixture Product × 2')).toBeVisible();
  await expect(storefront.visibleText('$50')).toHaveCount(2);
  await storefront.openRoute('/admin/orders');
  await expect(storefront.adminRowCells(admin.orders[0].id.slice(0, 8)).nth(2)).toHaveText(
    '₹2,000',
  );
  expect(shop.calls).toEqual([]);
});
