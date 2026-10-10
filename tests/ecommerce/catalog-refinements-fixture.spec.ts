import { expect } from '../../fixtures/ecommerce-base';
import { catalogProducts, test } from '../../fixtures/ecommerce-catalog';

test.describe('Zeouf catalog refinements', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-CAT-04-CORE keyboard price bounds are inclusive and cannot cross @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(4).map((product, i) => ({ ...product, price: i * 100 }));
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.minimumPrice.press('Home');
    await storefront.minimumPrice.press('ArrowRight');
    await storefront.maximumPrice.press('Home');
    await expect(storefront.maximumPrice).toHaveValue('100');
    await storefront.maximumPrice.press('ArrowRight');
    await expect(storefront.minimumPrice).toHaveValue('100');
    await expect(storefront.maximumPrice).toHaveValue('200');
    await expect(storefront.productCardNames()).toHaveText([
      catalog.products[1].name,
      catalog.products[2].name,
    ]);
    await storefront.expectCollectionCount(2, 4);
    await storefront.minimumPrice.press('End');
    await expect(storefront.minimumPrice).toHaveValue('200');
    await expect(storefront.productCardNames()).toHaveText([catalog.products[2].name]);
    await storefront.maximumPrice.press('Home');
    await expect(storefront.maximumPrice).toHaveValue('200');
  });

  test('TC-CAT-04-CORE Under tier includes its exact price and excludes the next price @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(3).map((product, i) => ({
      ...product,
      price: [2499, 2500, 2501][i],
    }));
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.underPriceTier('₹2,500').click();
    await expect(storefront.productCardNames()).toHaveText([
      catalog.products[0].name,
      catalog.products[1].name,
    ]);
    await storefront.maximumPrice.press('End');
    await expect(storefront.productCards).toHaveCount(3);
  });

  test('TC-CAT-003-02 missing brand/size metadata omits unusable selectors @happy', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = catalogProducts(2).map((product) => ({
      ...product,
      brand: null,
      sizes: [],
    }));
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await expect(storefront.brandFilter).toHaveCount(0);
    await expect(storefront.sizeFilter).toHaveCount(0);
    await expect(storefront.productCards).toHaveCount(2);
  });

  for (const route of ['new-arrivals', 'best-sellers', 'collection']) {
    test(`TC-CAT-02-CORE ${route} uses tag membership rather than sales ranking @happy`, async ({
      catalog,
      storefront,
    }) => {
      const tags = ['New season', 'BEST', 'Featured', 'Populer', null];
      catalog.products = catalogProducts(5).map((product, i) => ({ ...product, tag: tags[i] }));
      await storefront.openRoute(`/women/${route}`);
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
    });
  }

  test('TC-CAT-06-CORE New Arrivals orders new tags before date and name ties @happy', async ({
    catalog,
    storefront,
  }) => {
    const products = catalogProducts(4);
    catalog.products = [
      { ...products[0], name: 'Zulu New', tag: 'New', created_at: '2026-10-01T00:00:00Z' },
      { ...products[1], name: 'Recent Ordinary', tag: null, created_at: '2026-10-09T00:00:00Z' },
      { ...products[2], name: 'Alpha New', tag: 'New', created_at: '2026-10-01T00:00:00Z' },
      { ...products[3], name: 'Recent New', tag: 'New', created_at: '2026-10-08T00:00:00Z' },
    ];
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    await storefront.sortSelect.selectOption('newest');
    await expect(storefront.productCardNames()).toHaveText([
      'Recent New',
      'Alpha New',
      'Zulu New',
      'Recent Ordinary',
    ]);
    await expect(storefront.productCards).toHaveCount(4);
  });
});
