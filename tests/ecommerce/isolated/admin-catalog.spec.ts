import { expect } from '../../../fixtures/ecommerce-base';
import {
  adminWrites,
  test,
  stockBoundaryProducts,
} from '../../../fixtures/ecommerce-isolated-admin';

for (const name of ['', '   ']) {
  test(
    'TC-PRD-003-01 ' +
      (name ? 'whitespace' : 'blank') +
      ' name disables save and cancel preserves catalog',
    async ({ storefront, admin, shop }) => {
      await storefront.openRoute('/admin/products');
      await storefront.openAdminProductEditor(admin.products[0].name);
      await storefront.adminProductNameInput().fill(name);
      await expect(storefront.adminSaveProduct()).toBeDisabled();
      expect(shop.calls).toEqual([]);
      await storefront.adminCancelProduct().click();
      await expect(storefront.adminProductNames()).toHaveText(
        admin.products.map((product) => product.name),
      );
      expect(shop.calls).toEqual([]);
    },
  );
}

test.describe('Zeouf isolated admin catalog', { tag: ['@ecommerce', '@regression'] }, () => {
  test.beforeEach(async ({ storefront, admin }) => {
    await storefront.openRoute('/admin/products');
    await expect(storefront.adminRows()).toHaveCount(admin.products.length);
  });

  test('TC-PRD-01-CORE name search and exact category combine without changing incoming order', async ({
    storefront,
    admin,
    shop,
  }) => {
    await expect(storefront.adminProductNames()).toHaveText(
      admin.products.map((product) => product.name),
    );
    await storefront.adminProductSearch().fill('sTuDiO');
    await storefront.adminFilter().selectOption("Women's Dress");
    await expect(storefront.adminProductNames()).toHaveText([
      'Studio Dress New',
      'Studio Dress Classic',
    ]);
    await storefront.adminProductSearch().fill('NEW');
    await expect(storefront.adminProductNames()).toHaveText(['Studio Dress New']);
    await storefront.adminFilter().selectOption("Men's Shirt");
    await expect(storefront.adminRows()).toHaveCount(0);
    await expect(storefront.visibleText('No products found.')).toBeVisible();
    await storefront.adminProductSearch().fill('');
    await storefront.adminFilter().selectOption('All');
    await expect(storefront.adminProductNames()).toHaveText(
      admin.products.map((product) => product.name),
    );
    expect(shop.calls).toEqual([]);
  });

  for (const mode of ['error', 'network'] as const) {
    test(
      'TC-PRD-002-01 ' + mode + ' keeps the editor and supports explicit save retry',
      async ({ storefront, admin, shop }) => {
        const product = admin.products[0];
        admin.saveMode = mode;
        await storefront.openAdminProductEditor(product.name);
        await storefront.adminProductNameInput().fill('Fictional Renamed Dress');
        await storefront.adminProductPriceInput().fill('1500');
        await storefront.adminSaveProduct().click();
        await expect(
          storefront.visibleText(
            mode === 'error' ? 'Controlled admin service unavailable' : 'Failed to fetch',
          ),
        ).toBeVisible();
        await expect(storefront.adminFormHeading()).toHaveText('Edit Product');
        await expect(storefront.adminProductNameInput()).toHaveValue('Fictional Renamed Dress');
        await expect(storefront.adminSaveProduct()).toBeEnabled();
        expect(adminWrites(shop, '/api/admin/products/' + product.id)[0].body).toMatchObject({
          name: 'Fictional Renamed Dress',
          price: 1500,
        });
        admin.saveMode = 'success';
        await storefront.adminSaveProduct().click();
        await expect(storefront.adminFormHeading()).toHaveCount(0);
        await expect(storefront.adminRow('Fictional Renamed Dress')).toHaveCount(1);
        expect(adminWrites(shop, '/api/admin/products/' + product.id)).toHaveLength(2);
      },
    );
  }

  test('TC-PRD-06-CORE cancelling deletion sends no request and leaves the product', async ({
    storefront,
    admin,
    shop,
  }) => {
    const product = admin.products[0];
    await storefront.deleteAdminProduct(product.name, false);
    await expect(storefront.adminRow(product.name)).toHaveCount(1);
    expect(adminWrites(shop, '/api/admin/products/' + product.id)).toEqual([]);
  });

  test('TC-PRD-06-CORE failed deletion preserves product and explicit successful retry removes its row', async ({
    storefront,
    admin,
    shop,
  }) => {
    const product = admin.products[0];
    admin.deleteMode = 'error';
    await storefront.deleteAdminProduct(product.name, true);
    await expect(storefront.visibleText('Controlled admin service unavailable')).toBeVisible();
    await expect(storefront.adminRow(product.name)).toHaveCount(1);
    admin.deleteMode = 'success';
    await storefront.deleteAdminProduct(product.name, true);
    await expect(storefront.adminRow(product.name)).toHaveCount(0);
    expect(
      adminWrites(shop, '/api/admin/products/' + product.id).map((call) => call.method),
    ).toEqual(['DELETE', 'DELETE']);
  });

  test('TC-PRD-04-CORE removing main preview promotes the remaining pasted image in save payload', async ({
    storefront,
    admin,
    shop,
  }) => {
    const product = admin.products[0];
    await storefront.openAdminProductEditor(product.name);
    await storefront.appendAdminImage('/kadin-product-2.jpg');
    await expect(storefront.adminProductImages()).toHaveCount(2);
    await storefront.removeAdminImage(0);
    await expect(storefront.adminProductImages()).toHaveCount(1);
    await expect(storefront.adminProductImages()).toHaveAttribute('src', '/kadin-product-2.jpg');
    await storefront.adminSaveProduct().click();
    await expect(storefront.adminFormHeading()).toHaveCount(0);
    expect(adminWrites(shop, '/api/admin/products/' + product.id)[0].body).toMatchObject({
      image_url: '/kadin-product-2.jpg',
      images: ['/kadin-product-2.jpg'],
    });
  });

  test('TC-PRD-05-CORE new sized product serializes selected sizes with zero overall stock', async ({
    storefront,
    shop,
  }) => {
    await storefront.adminAddProduct().click();
    await storefront.adminProductNameInput().fill('Fictional Sized Product');
    await storefront.adminProductPriceInput().fill('1000');
    await storefront.adminProductStockInput().fill('7');
    await storefront.adminSizeOption('S').click();
    await storefront.adminSizeOption('M').click();
    await expect(storefront.adminProductStockInput()).toBeDisabled();
    await expect(storefront.adminProductStockInput()).toHaveValue('0');
    await storefront.appendAdminImage('/kadin-product-1.jpg');
    await storefront.adminSaveProduct().click();
    await expect(storefront.adminRow('Fictional Sized Product')).toHaveCount(1);
    expect(adminWrites(shop, '/api/admin/products')[0].body).toMatchObject({
      sizes: ['S', 'M'],
      stock: 0,
    });
  });
});

test('TC-STK-03-CORE sized stock zero one four five has matching row and dashboard boundaries', async ({
  storefront,
  admin,
  shop,
}) => {
  admin.products = stockBoundaryProducts();
  await storefront.openAdminSidebarSection('Stock Management');
  await expect(storefront.adminRows()).toHaveCount(4);
  for (const [stock, status] of [
    [0, 'Out of stock'],
    [1, 'Low stock'],
    [4, 'Low stock'],
    [5, 'Available'],
  ] as const) {
    await expect(storefront.adminStockInput('Stock Boundary ' + stock)).toHaveValue(String(stock));
    await expect(storefront.adminRowCells('Stock Boundary ' + stock).last()).toHaveText(status);
  }
  await storefront.openRoute('/admin/dashboard');
  await expect(storefront.adminDashboardValue('Total Products')).toHaveText('4');
  await expect(storefront.adminDashboardValue('Total Stock')).toHaveText('10');
  await expect(storefront.adminDashboardValue('Low Stock')).toHaveText('2');
  await expect(storefront.adminDashboardValue('Out of Stock')).toHaveText('1');
  expect(shop.calls).toEqual([]);
});
