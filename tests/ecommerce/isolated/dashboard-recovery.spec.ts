import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated-admin';

test('TC-ADM-005-01 dashboard refresh failure shows unavailable values and explicit retry restores summaries', async ({
  storefront,
  admin,
  shop,
}) => {
  admin.products[0].stock = 1;
  admin.orders = [admin.orders[0], { ...admin.orders[1], status: 'cancelled' }];
  await storefront.openRoute('/admin/dashboard');
  await expect(storefront.adminDashboardValue('Low Stock')).toHaveText('1');
  const activeValue = storefront.adminActiveOrderValue();
  await expect(activeValue).toContainText('1,000');
  const before = admin.reads.length;
  admin.catalogMode = 'error';
  admin.ordersMode = 'error';
  await storefront.adminAction('Refresh dashboard').click();
  await expect(storefront.adminAlerts()).toContainText('Controlled admin service unavailable');
  await expect(storefront.adminDashboardValue('Total Products')).toHaveText('—');
  await expect(activeValue).toContainText('—');
  expect(admin.reads.length).toBeGreaterThan(before);
  admin.catalogMode = 'success';
  admin.ordersMode = 'success';
  await storefront.adminAction('Retry loading data').click();
  await expect(storefront.adminDashboardValue('Total Products')).toHaveText('3');
  await expect(activeValue).toContainText('1,000');
  await expect(storefront.adminAlerts()).toHaveCount(0);
  await storefront.adminAction(/Pending orders/).click();
  await expect(storefront.adminHeading('Orders')).toBeVisible();
  await expect(storefront.adminFilter()).toHaveValue('pending');
  await expect(storefront.adminRows()).toHaveCount(1);
  await storefront.openRoute('/admin/dashboard');
  await storefront.adminAction('Add a product').click();
  await expect(storefront.adminFormHeading()).toBeVisible();
  expect(shop.calls).toEqual([]);
});
