import { expect } from '../../../fixtures/ecommerce-base';
import { deferBrowserResponse } from '../../../fixtures/ecommerce-isolated';
import { test } from '../../../fixtures/ecommerce-isolated-admin';

for (const resource of ['orders', 'reviews', 'products'] as const) {
  const caseId =
    resource === 'reviews'
      ? 'TC-ANL-05-CORE'
      : resource === 'products'
        ? 'TC-ANL-03-CORE'
        : 'TC-ANL-001-01';
  test(
    caseId + ' held ' + resource + ' response keeps dependent summary unavailable until loaded',
    async ({ storefront, admin }) => {
      const held = deferBrowserResponse();
      admin.readGates[resource] = held.response;
      try {
        await storefront.openRoute('/admin/analytics');
        await expect
          .poll(() => admin.reads.some((url) => url.pathname === '/api/admin/' + resource))
          .toBe(true);
        if (resource === 'reviews') {
          await expect(storefront.adminReviewAverage()).toHaveText('—/ 5 average');
          await expect(storefront.adminApprovedReviewCount()).toHaveText(
            'Unavailable approved reviews',
          );
        } else {
          for (const label of resource === 'orders'
            ? ['Active demo order value', 'Active orders', 'Average active order']
            : ['Units in stock'])
            await expect(storefront.adminAnalyticsValue(label)).toHaveText('—');
        }
        held.release();
        if (resource === 'reviews') {
          await expect(storefront.adminReviewAverage()).toHaveText('4.0/ 5 average');
          await expect(storefront.adminApprovedReviewCount()).toHaveText('1 approved reviews');
        } else if (resource === 'products') {
          await expect(storefront.adminAnalyticsValue('Units in stock')).toHaveText('15');
        } else {
          await expect(storefront.adminAnalyticsValue('Active demo order value')).toHaveText(
            '₹16,000',
          );
          await expect(storefront.adminAnalyticsValue('Active orders')).toHaveText('5');
          await expect(storefront.adminAnalyticsValue('Average active order')).toHaveText('₹3,200');
        }
      } finally {
        held.release();
      }
    },
  );
}

test('TC-ANL-001-01 failed order metrics recover only after explicit loading retry', async ({
  storefront,
  admin,
}) => {
  admin.ordersMode = 'error';
  await storefront.openRoute('/admin/analytics');
  await expect(storefront.visibleText('Could not load orders. Please retry.')).toBeVisible();
  await expect(storefront.adminAnalyticsValue('Active demo order value')).toHaveText('—');
  const held = deferBrowserResponse();
  admin.readGates.orders = held.response;
  admin.ordersMode = 'success';
  try {
    const before = admin.reads.filter((url) => url.pathname === '/api/admin/orders').length;
    await storefront.adminRetryLoading().click();
    await expect
      .poll(() => admin.reads.filter((url) => url.pathname === '/api/admin/orders').length)
      .toBeGreaterThan(before);
    await expect(storefront.adminAnalyticsValue('Active demo order value')).toHaveText('—');
    held.release();
    await expect(storefront.adminAnalyticsValue('Active demo order value')).toHaveText('₹16,000');
    await expect(storefront.visibleText('Could not load orders. Please retry.')).toHaveCount(0);
  } finally {
    held.release();
  }
});
