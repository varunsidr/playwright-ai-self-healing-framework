import { expect } from '../../../fixtures/ecommerce-base';
import { adminProducts, adminWrites, test } from '../../../fixtures/ecommerce-isolated-admin';

test.beforeEach(async ({ admin }) => {
  const product = { ...adminProducts()[0], stock: 9, sizes: ['S', 'M', 'L'] };
  product.product_size_stock = [0, 4, 5].map((stock, index) => ({
    id: product.id + '-' + product.sizes[index],
    product_id: product.id,
    size: product.sizes[index],
    stock,
  }));
  admin.products = [product];
});

test('TC-STK-002-01 controlled M edit updates the displayed size and aggregate after reload', async ({
  storefront,
  admin,
  shop,
  page,
}) => {
  await storefront.openAdminSidebarSection('Stock Management');
  const input = storefront.adminStockInput(admin.products[0].name).nth(1);
  await expect(input).toHaveValue('4');
  await input.fill('2');
  await input.press('Tab');
  await expect.poll(() => adminWrites(shop, '/api/admin/restock-alerts/notify').length).toBe(1);
  expect(adminWrites(shop, '/api/admin/stock')[0].body).toEqual({
    productId: admin.products[0].id,
    size: 'M',
    stock: 2,
  });
  expect(adminWrites(shop, '/api/admin/restock-alerts/notify')[0].body).toEqual({
    productId: admin.products[0].id,
    size: 'M',
  });
  await page.reload();
  await storefront.openAdminSidebarSection('Stock Management');
  await expect(storefront.adminStockInput(admin.products[0].name).nth(1)).toHaveValue('2');
  await storefront.openRoute('/admin/dashboard');
  await expect(storefront.adminDashboardValue('Total Stock')).toHaveText('7');
});

for (const mode of ['error', 'network'] as const) {
  test(
    'TC-STK-002-01 ' + mode + ' keeps the aggregate unchanged until explicit retry succeeds',
    async ({ storefront, admin, shop }) => {
      admin.stockMode = mode;
      await storefront.openAdminSidebarSection('Stock Management');
      const input = storefront.adminStockInput(admin.products[0].name).nth(1);
      await input.fill('2');
      await input.press('Tab');
      await expect(
        storefront.visibleText(
          mode === 'error' ? 'Controlled admin service unavailable' : 'Failed to fetch',
        ),
      ).toBeVisible();
      expect(adminWrites(shop, '/api/admin/restock-alerts/notify')).toEqual([]);
      await storefront.openRoute('/admin/dashboard');
      await expect(storefront.adminDashboardValue('Total Stock')).toHaveText('9');
      admin.stockMode = 'success';
      await storefront.openAdminSidebarSection('Stock Management');
      await storefront.adminStockInput(admin.products[0].name).nth(1).fill('2');
      await storefront.adminStockInput(admin.products[0].name).nth(1).press('Tab');
      await expect.poll(() => adminWrites(shop, '/api/admin/restock-alerts/notify').length).toBe(1);
      expect(adminWrites(shop, '/api/admin/stock')).toHaveLength(2);
      await storefront.openRoute('/admin/dashboard');
      await expect(storefront.adminDashboardValue('Total Stock')).toHaveText('7');
    },
  );
}

for (const invalid of ['-1', '1.5', '2147483648']) {
  test(
    'TC-STK-002-01 stock ' + invalid + ' is rejected before any request',
    async ({ storefront, admin, shop }) => {
      await storefront.openAdminSidebarSection('Stock Management');
      const input = storefront.adminStockInput(admin.products[0].name).nth(1);
      await input.fill(invalid);
      await input.press('Tab');
      await expect(
        storefront.visibleText('Stock must be a nonnegative whole number.'),
      ).toBeVisible();
      expect(shop.calls).toEqual([]);
      await storefront.openRoute('/admin/dashboard');
      await expect(storefront.adminDashboardValue('Total Stock')).toHaveText('9');
    },
  );
}
