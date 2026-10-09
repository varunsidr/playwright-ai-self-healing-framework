import { expect } from '../../fixtures/ecommerce-base';
import { catalogProducts, test } from '../../fixtures/ecommerce-catalog';

test.describe('Zeouf controlled search acceptance', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-SEA-002-01 unions name/category matches and deduplicates product IDs @happy', async ({
    catalog,
    storefront,
  }) => {
    const products = catalogProducts(4);
    catalog.products = [
      { ...products[0], name: 'Dress Both Match' },
      { ...products[1], name: 'Dress Name Match', category: "Women's Blouse & Shirt" },
      { ...products[2], name: 'Category Match' },
      { ...products[3], name: 'Unrelated', category: "Women's Blouse & Shirt" },
    ];
    await storefront.openRoute('/search?q=dReSs');
    await expect(storefront.searchResultsHeading).toBeVisible();
    await expect(storefront.productCards).toHaveCount(3);
    for (const product of catalog.products.slice(0, 3)) {
      await expect(storefront.productCardByName(product.name)).toHaveCount(1);
    }
    await expect(storefront.productCardByName('Unrelated')).toHaveCount(0);
    expect(catalog.queries.map((query) => query.get('name')).filter(Boolean)).toContain(
      'ilike.%dReSs%',
    );
    expect(catalog.queries.map((query) => query.get('category')).filter(Boolean)).toContain(
      'ilike.%dReSs%',
    );
  });

  test('TC-SEA-03-CORE successful empty search shows no results without demo substitution @negative', async ({
    catalog,
    storefront,
  }) => {
    catalog.products = [];
    await storefront.openRoute('/search?q=missing');
    await expect(storefront.noSearchResults).toBeVisible();
    await expect(storefront.productCards).toHaveCount(0);
    await expect(storefront.collectionFallback).toBeHidden();
  });
});
