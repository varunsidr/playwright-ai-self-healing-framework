import { expect } from '../../../fixtures/ecommerce-base';
import {
  adminWrites,
  stockBoundaryProducts,
  test,
} from '../../../fixtures/ecommerce-isolated-admin';

test('TC-AOR-02-CORE mixed case customer search and exact status combine with distinct no-match state', async ({
  storefront,
  admin,
}) => {
  await storefront.openRoute('/admin/orders');
  await expect(storefront.adminRows()).toHaveCount(admin.orders.length);
  await storefront.adminOrderSearch().fill('aLpHa');
  await expect(storefront.adminRows()).toHaveCount(3);
  await storefront.adminFilter().selectOption('shipped');
  await expect(storefront.adminRows()).toHaveCount(1);
  await expect(storefront.adminRowCells('ORDER003').nth(1)).toHaveText('customer-Alpha');
  await storefront.adminOrderSearch().fill('missing-customer');
  await expect(storefront.visibleText('No orders match the current filters.')).toBeVisible();
  await expect(storefront.visibleText('No orders found.')).toHaveCount(0);
  await storefront.adminOrderSearch().fill('order');
  await storefront.adminFilter().selectOption('all');
  await expect(storefront.adminRows()).toHaveCount(6);
});

test('TC-AOR-02-CORE empty order response has the no-orders state', async ({
  storefront,
  admin,
}) => {
  admin.orders = [];
  await storefront.openRoute('/admin/orders');
  await expect(storefront.visibleText('No orders found.')).toBeVisible();
  await expect(storefront.visibleText('No orders match the current filters.')).toHaveCount(0);
});

test('TC-AOR-004-01 five status controls send explicit requests and reflect local successful responses', async ({
  storefront,
  admin,
  shop,
}) => {
  const order = admin.orders[0];
  await storefront.openRoute('/admin/orders');
  await storefront.adminOrderView(order.id.slice(0, 8)).click();
  await expect(storefront.adminOrderStatusOptions()).toHaveText([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]);
  for (const status of ['processing', 'shipped', 'delivered', 'cancelled', 'pending']) {
    await storefront.adminOrderStatus().selectOption(status);
    await expect
      .poll(() => adminWrites(shop, '/api/admin/orders').length)
      .toBe(['processing', 'shipped', 'delivered', 'cancelled', 'pending'].indexOf(status) + 1);
    await expect(storefront.adminOrderStatus()).toHaveValue(status);
    expect(adminWrites(shop, '/api/admin/orders').slice(-1)[0].body).toEqual({
      id: order.id,
      status,
    });
  }
  await storefront.adminOrderClose().click();
  await expect(storefront.adminRowCells(order.id.slice(0, 8)).nth(3)).toHaveText('pending');
});

test('TC-AOR-003-01 failed status response keeps the displayed pending order', async ({
  storefront,
  admin,
  shop,
}) => {
  admin.statusMode = 'error';
  const order = admin.orders[0];
  await storefront.openRoute('/admin/orders');
  await storefront.adminOrderView(order.id.slice(0, 8)).click();
  await storefront.adminOrderStatus().selectOption('processing');
  await expect(storefront.visibleText('Failed to update order status')).toBeVisible();
  await expect(storefront.adminOrderStatus()).toHaveValue('pending');
  expect(adminWrites(shop, '/api/admin/orders')).toHaveLength(1);
  await storefront.adminOrderClose().click();
  await expect(storefront.adminRowCells(order.id.slice(0, 8)).nth(3)).toHaveText('pending');
});

for (const empty of [false, true]) {
  test(
    'TC-ANL-02-CORE pipeline counts and rounded percentages for ' +
      (empty ? 'zero' : 'six') +
      ' orders',
    async ({ storefront, admin }) => {
      if (empty) admin.orders = [];
      await storefront.openRoute('/admin/analytics');
      for (const status of ['pending', 'processing', 'shipped', 'delivered', 'cancelled']) {
        const count = empty ? 0 : status === 'pending' ? 2 : 1;
        const percentage = empty ? 0 : status === 'pending' ? 33 : 17;
        await expect(storefront.adminPipelineEntry(status)).toContainText(
          new RegExp(String(count) + '.*' + percentage + '%'),
        );
      }
    },
  );
}

test('TC-ANL-03-CORE inventory health uses sized rows and unsized overall stock', async ({
  storefront,
  admin,
}) => {
  admin.products = stockBoundaryProducts();
  admin.products.push({
    ...admin.products[0],
    id: 'healthy-unsized',
    name: 'Healthy Unsized',
    sizes: [],
    product_size_stock: [],
    stock: 10,
  });
  await storefront.openRoute('/admin/analytics');
  await expect(storefront.adminInventoryValue('Healthy products')).toHaveText('2');
  await expect(storefront.adminInventoryValue('Low stock')).toHaveText('2');
  await expect(storefront.adminInventoryValue('Out of stock')).toHaveText('1');
  await expect(storefront.adminAnalyticsValue('Units in stock')).toHaveText('20');
});

test('TC-SET-01-CORE settings render identity and catalog counts without save controls', async ({
  storefront,
  admin,
  shop,
}) => {
  await storefront.openRoute('/admin/settings');
  await expect(storefront.visibleText('zeouf Luxury Fashion & Lifestyle')).toBeVisible();
  await expect(storefront.visibleText('3 products across 2 categories')).toBeVisible();
  await expect(storefront.visibleText('Supabase connection configured')).toBeVisible();
  await expect(storefront.adminMainButtons()).toHaveCount(0);
  expect(admin.reads.some((url) => url.pathname === '/api/admin/products')).toBe(true);
  expect(shop.calls).toEqual([]);
});

test('TC-USR-01-CORE user response renders identity and missing-field placeholders in supplied order', async ({
  storefront,
  admin,
  shop,
}) => {
  await storefront.openRoute('/admin/users');
  await expect(storefront.adminRows()).toHaveCount(2);
  await expect(storefront.adminRowCells('profile-new').nth(1)).toHaveText('Fictional New Shopper');
  await expect(storefront.adminRowCells('profile-no-name').nth(1)).toHaveText('-');
  await expect(storefront.adminRowCells('profile-no-name').nth(2)).toHaveText('-');
  expect(admin.reads.some((url) => url.pathname === '/api/admin/users')).toBe(true);
  expect(shop.calls).toEqual([]);
});
