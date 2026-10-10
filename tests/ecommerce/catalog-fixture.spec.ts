import { expect } from '../../fixtures/ecommerce-base';
import { catalogProducts, test } from '../../fixtures/ecommerce-catalog';

test.describe('Zeouf controlled catalog acceptance', { tag: ['@ecommerce', '@regression'] }, () => {
  for (const count of [0, 1, 24, 25, 48, 49]) {
    test(`TC-CAT-007-01 pagination boundary ${count} @happy`, async ({ catalog, storefront }) => {
      catalog.products = catalogProducts(count);
      await storefront.openWomenCollection();
      await storefront.expectCategoryLoaded('Women');
      await expect(storefront.productCards).toHaveCount(Math.min(count, 24));
      await storefront.expectCollectionCount(count, count);
      for (let visible = 24; visible < count; visible += 24) {
        await storefront.loadMoreProducts.click();
        await expect(storefront.productCards).toHaveCount(Math.min(count, visible + 24));
      }
      await expect(storefront.loadMoreProducts).toBeHidden();
      await expect(storefront.collectionFallback).toBeHidden();
      await expect(storefront.collectionRetry).toBeHidden();
    });
  }

  test('TC-CAT-003-02 brand and stock filters combine and clear @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(4);
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.brandFilter.selectOption('Brand A');
    await expect(storefront.productCards).toHaveCount(2);
    await storefront.expectCollectionCount(2, 4);
    await storefront.inStockFilter.check();
    await expect(storefront.productCards).toHaveCount(2);
    await storefront.brandFilter.selectOption('Brand B');
    await expect(storefront.productCards).toHaveCount(0);
    await expect(storefront.collectionFallback).toBeHidden();
    await storefront.clearFilters.click();
    await expect(storefront.productCards).toHaveCount(4);
    await expect(storefront.inStockFilter).not.toBeChecked();
  });

  test('TC-CAT-005-02 sized stock respects selected size @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(2).map((product) => ({
      ...product,
      sizes: ['S', 'M'],
      stock: 4,
    }));
    catalog.stock = [
      { product_id: catalog.products[0].id, size: 'S', stock: 0 },
      { product_id: catalog.products[0].id, size: 'M', stock: 4 },
      { product_id: catalog.products[1].id, size: 'S', stock: 1 },
      { product_id: catalog.products[1].id, size: 'M', stock: 0 },
    ];
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.inStockFilter.check();
    await expect(storefront.productCards).toHaveCount(2);
    await storefront.sizeFilter.selectOption('S');
    await expect(storefront.productCards).toHaveCount(1);
    await expect(storefront.productCardByName(catalog.products[1].name)).toBeVisible();
    await storefront.sizeFilter.selectOption('M');
    await expect(storefront.productCards).toHaveCount(1);
    await expect(storefront.productCardByName(catalog.products[0].name)).toBeVisible();
  });

  for (const sort of ['price-low', 'price-high', 'recommended']) {
    test(`TC-CAT-06-CORE ${sort} preserves products and breaks price ties by name @happy`, async ({
      catalog,
      storefront,
    }) => {
      const products = catalogProducts(3);
      catalog.products = [
        { ...products[0], name: 'Zulu', price: 2000 },
        { ...products[1], name: 'Alpha', price: 2000 },
        { ...products[2], name: 'Middle', price: 1000 },
      ];
      await storefront.openWomenCollection();
      await storefront.expectCategoryLoaded('Women');
      await storefront.sortSelect.selectOption(sort);
      const expectedNames =
        sort === 'price-low'
          ? ['Middle', 'Alpha', 'Zulu']
          : sort === 'price-high'
            ? ['Alpha', 'Zulu', 'Middle']
            : ['Zulu', 'Alpha', 'Middle'];
      await expect(storefront.productCards.getByTestId('product-card-name')).toHaveText(
        expectedNames,
      );
      await expect(storefront.productCards).toHaveCount(3);
    });
  }

  for (const resource of ['products', 'stock'] as const) {
    for (const mode of ['error', 'pending'] as const) {
      test(`TC-CAT-08-CORE ${resource} ${mode} and retry recovery @negative`, async ({
        catalog,
        storefront,
      }) => {
        if (resource === 'products') catalog.productMode = mode;
        else catalog.stockMode = mode;
        await storefront.openWomenCollection();
        if (mode === 'pending') await expect(storefront.collectionLoading).toBeVisible();
        await expect(storefront.collectionRetry).toBeVisible({ timeout: 12000 });
        await expect(storefront.collectionLoading).toBeHidden();
        if (resource === 'products') {
          await expect(storefront.collectionFallback).toBeVisible();
          await expect(storefront.productCardByName(catalog.products[0].name)).toHaveCount(0);
        } else {
          await expect(storefront.collectionStockWarning).toBeVisible();
          await expect(storefront.productCards).toHaveCount(4);
          await expect(storefront.productCardByName(catalog.products[0].name)).toBeVisible();
          await expect(storefront.collectionFallback).toBeHidden();
        }
        catalog.productMode = 'success';
        catalog.stockMode = 'success';
        catalog.release();
        await storefront.collectionRetry.click();
        await expect(storefront.collectionRetry).toBeHidden();
        await expect(storefront.collectionFallback).toBeHidden();
        await expect(storefront.collectionStockWarning).toBeHidden();
        await expect(storefront.productCards).toHaveCount(4);
        await expect(storefront.productCardByName(catalog.products[0].name)).toBeVisible();
      });
    }
  }

  test('TC-CAT-08-CORE abandoned product request cancels on navigation @negative', async ({
    catalog,
    storefront,
  }) => {
    catalog.productMode = 'pending';
    await storefront.openWomenCollection();
    await expect(storefront.collectionLoading).toBeVisible();
    await storefront.searchFor('dress');
    await storefront.expectUrl(/\/search\?q=dress$/);
    await expect
      .poll(() => catalog.abortedReads.some((url) => url.includes('/products?')))
      .toBe(true);
    catalog.release();
  });
});
