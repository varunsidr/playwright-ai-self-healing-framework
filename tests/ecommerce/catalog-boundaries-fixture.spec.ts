import { expect } from '../../fixtures/ecommerce-base';
import { catalogProducts, test } from '../../fixtures/ecommerce-catalog';

test.describe('Zeouf remaining catalog boundaries', { tag: ['@ecommerce', '@regression'] }, () => {
  for (const route of ['new-arrivals', 'best-sellers', 'collection']) {
    test(`TC-CAT-02-CORE men ${route} follows tag membership @happy`, async ({
      catalog,
      storefront,
    }) => {
      const tags = ['New season', 'BEST', 'Featured', 'Populer', null];
      catalog.products = catalogProducts(5).map((product, index) => ({
        ...product,
        name: `Fixture Suit ${index + 1}`,
        category: "Men's Suit",
        tag: tags[index],
      }));
      await storefront.openRoute(`/men/${route}`);
      await expect(storefront.collectionLoading).toBeHidden();
      const selected =
        route === 'new-arrivals'
          ? catalog.products.slice(0, 1)
          : route === 'best-sellers'
            ? catalog.products.slice(1, 4)
            : catalog.products;
      await expect(storefront.productCardNames()).toHaveText(
        selected.map((product) => product.name),
      );
      await storefront.expectCollectionCount(selected.length, selected.length);
      await expect(storefront.collectionFallback).toBeHidden();
    });
  }

  test('TC-CAT-005-02 absent stock rows fall back while present rows constrain selected size @happy', async ({
    catalog,
    storefront,
  }) => {
    const products = catalogProducts(4);
    catalog.products = products.map((product, index) => ({
      ...product,
      sizes: ['S', 'M'],
      stock: index === 1 ? 0 : 4,
    }));
    catalog.stock = [
      { product_id: products[2].id, size: 'S', stock: 0 },
      { product_id: products[2].id, size: 'M', stock: 4 },
      { product_id: products[3].id, size: 'S', stock: 4 },
    ];
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.inStockFilter.check();
    await expect(storefront.productCardNames()).toHaveText([
      products[0].name,
      products[2].name,
      products[3].name,
    ]);
    await storefront.sizeFilter.selectOption('S');
    await expect(storefront.productCardNames()).toHaveText([products[0].name, products[3].name]);
    await storefront.sizeFilter.selectOption('M');
    await expect(storefront.productCardNames()).toHaveText([products[0].name, products[2].name]);
    await expect(storefront.collectionStockWarning).toBeHidden();
  });

  test('TC-CAT-04-CORE delayed USD detection clears both INR price bounds @happy', async ({
    catalog,
    context,
    storefront,
  }) => {
    catalog.products = catalogProducts(3);
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await context.route(/\/api\/storefront\/region\?/, async (route) => {
      await held;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          country: 'US',
          currency: 'USD',
          rate: 0.025,
          rateDate: '2026-10-26',
        }),
      });
    });
    try {
      await storefront.openWomenCollection();
      await storefront.expectCategoryLoaded('Women');
      await storefront.minimumPrice.press('Home');
      await storefront.minimumPrice.press('ArrowRight');
      await storefront.maximumPrice.press('Home');
      await storefront.maximumPrice.press('ArrowRight');
      await expect(storefront.minimumPrice).toHaveValue('100');
      await expect(storefront.maximumPrice).toHaveValue('200');
      await expect(storefront.productCards).toHaveCount(0);
      release();
      await expect(storefront.productCardPrices).toHaveText(['$25', '$50', '$75']);
      await expect(storefront.minimumPrice).toHaveValue('0');
      await expect(storefront.maximumPrice).toHaveValue('1000');
      await storefront.expectCollectionCount(3, 3);
    } finally {
      release();
    }
  });

  test('TC-CAT-007-01 changing a filter resets a fully revealed collection to its first batch @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(49).map((product, index) => ({
      ...product,
      brand: index < 30 ? 'Brand A' : 'Brand B',
    }));
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.loadMoreProducts.click();
    await expect(storefront.productCards).toHaveCount(48);
    await storefront.loadMoreProducts.click();
    await storefront.expectCollectionCount(49, 49);
    await storefront.brandFilter.selectOption('Brand A');
    await expect(storefront.productCards).toHaveCount(24);
    await storefront.expectCollectionCount(24, 30);
    await expect(storefront.loadMoreProducts).toBeVisible();
    await storefront.loadMoreProducts.click();
    await storefront.expectCollectionCount(30, 30);
    await expect(storefront.loadMoreProducts).toBeHidden();
  });

  test('TC-CAT-007-01 clearing an empty filter result restores the first batch and load more @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(49).map((product) => ({ ...product, stock: 0 }));
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.inStockFilter.check();
    await expect(storefront.productCards).toHaveCount(0);
    await storefront.expectCollectionCount(0, 0);
    await expect(storefront.loadMoreProducts).toBeHidden();
    await expect(storefront.collectionFallback).toBeHidden();
    await storefront.clearFilters.click();
    await expect(storefront.inStockFilter).not.toBeChecked();
    await expect(storefront.productCards).toHaveCount(24);
    await storefront.expectCollectionCount(24, 49);
    await expect(storefront.loadMoreProducts).toBeVisible();
  });
});
