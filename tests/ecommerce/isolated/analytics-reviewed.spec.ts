import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated-admin';

test('TC-ANL-001-01 active order metrics exclude cancelled totals and use the active denominator', async ({
  storefront,
  admin,
}) => {
  expect(admin.orders.map((order) => order.total)).toEqual([1000, 2000, 3000, 4000, 5000, 6000]);
  await storefront.openRoute('/admin/analytics');
  await expect(storefront.adminAnalyticsValue('Active demo order value')).toHaveText('₹16,000');
  await expect(storefront.adminAnalyticsValue('Active orders')).toHaveText('5');
  await expect(storefront.adminAnalyticsValue('Average active order')).toHaveText('₹3,200');
  await expect(storefront.visibleText(/No actual payments are collected/)).toBeVisible();
  await expect(storefront.adminPipelineEntry('cancelled')).toContainText(/1.*17%/);
});

for (const population of ['empty', 'cancelled only']) {
  test(
    'TC-ANL-001-01 ' + population + ' has zero active metrics and no sales',
    async ({ storefront, admin }) => {
      admin.orders = population === 'empty' ? [] : [admin.orders[4]];
      await storefront.openRoute('/admin/analytics');
      await expect(storefront.adminAnalyticsValue('Active demo order value')).toHaveText('₹0');
      await expect(storefront.adminAnalyticsValue('Active orders')).toHaveText('0');
      await expect(storefront.adminAnalyticsValue('Average active order')).toHaveText('₹0');
      await expect(storefront.visibleText('No product sales data yet.')).toBeVisible();
    },
  );
}

test('TC-ANL-001-01 failed order read renders unavailable summaries instead of zero', async ({
  storefront,
  admin,
}) => {
  admin.ordersMode = 'error';
  await storefront.openRoute('/admin/analytics');
  await expect(storefront.visibleText('Could not load orders. Please retry.')).toBeVisible();
  for (const label of ['Active demo order value', 'Active orders', 'Average active order'])
    await expect(storefront.adminAnalyticsValue(label)).toHaveText('—');
});

test('TC-ANL-001-01 top five excludes cancelled and deleted products with stable ties', async ({
  storefront,
  admin,
}) => {
  admin.products = Array.from({ length: 7 }, (_, index) => ({
    ...admin.products[0],
    id: 'rank-' + index,
    name: 'Rank Product ' + index,
  }));
  const active = {
    ...admin.orders[0],
    order_items: [3, 3, 2, 2, 1, 1].map((quantity, index) => ({
      id: 'rank-item-' + index,
      product_id: 'rank-' + index,
      quantity,
      unit_price: 1000,
    })),
  };
  active.order_items.push({
    id: 'deleted-item',
    product_id: 'deleted-product',
    quantity: 99,
    unit_price: 1000,
  });
  admin.orders = [
    active,
    {
      ...admin.orders[4],
      order_items: [{ id: 'cancelled-item', product_id: 'rank-6', quantity: 50, unit_price: 1000 }],
    },
  ];
  await storefront.openRoute('/admin/analytics');
  await expect(storefront.adminTopProductNames()).toHaveText([
    'Rank Product 0',
    'Rank Product 1',
    'Rank Product 2',
    'Rank Product 3',
    'Rank Product 4',
  ]);
  await expect(storefront.adminTopProductUnits()).toHaveText([
    '3 units',
    '3 units',
    '2 units',
    '2 units',
    '1 units',
  ]);
});

for (const population of ['mixed', 'single approved', 'pending only', 'empty', 'unavailable']) {
  test(
    'TC-ANL-05-CORE ' + population + ' uses only approved ratings or explicit unavailable feedback',
    async ({ storefront, admin }) => {
      const approved = { ...admin.reviews[0], rating: 5 };
      const pending = { ...admin.reviews[1], rating: 1 };
      admin.reviews =
        population === 'mixed'
          ? [approved, { ...approved, id: 'second-approved', rating: 3 }, pending]
          : population === 'single approved'
            ? [approved, pending]
            : population === 'pending only'
              ? [pending]
              : [];
      if (population === 'unavailable') admin.reviewsMode = 'error';
      await storefront.openRoute('/admin/analytics');
      await expect(storefront.adminReviewAverage()).toHaveText(
        (population === 'unavailable'
          ? '—'
          : population === 'mixed'
            ? '4.0'
            : population === 'single approved'
              ? '5.0'
              : '0.0') + '/ 5 average',
      );
      await expect(storefront.adminApprovedReviewCount()).toHaveText(
        (population === 'unavailable'
          ? 'Unavailable'
          : population === 'mixed'
            ? '2'
            : population === 'single approved'
              ? '1'
              : '0') + ' approved reviews',
      );
    },
  );
}
