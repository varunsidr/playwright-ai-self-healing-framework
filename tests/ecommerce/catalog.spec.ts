import { expect, test } from '../../fixtures/ecommerce-base';

test.describe('Ecommerce catalog', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'home page loads with storefront actions @happy',
    { tag: '@smoke' },
    async ({ storefront }) => {
      await storefront.openHome();
      await storefront.expectHomeLoaded();
    },
  );

  test('women collection displays products @happy', { tag: '@smoke' }, async ({ storefront }) => {
    await storefront.openWomenCollection();
    await storefront.expectWomenCollectionLoaded();
    await expect(storefront.productCards).not.toHaveCount(0);
  });

  const collections = [
    { route: '/kadin', heading: 'Women' },
    { route: '/erkek', heading: 'Men' },
    { route: '/parfum', heading: 'Perfume' },
    { route: '/ayakkabi', heading: 'Shoes' },
    { route: '/aksesuar', heading: 'Accessories' },
    { route: '/canta', heading: 'Bags' },
    { route: '/makyaj', heading: 'Makeup' },
  ];

  const subcategories = [
    { route: '/kadin/elbise', heading: 'Dress' },
    { route: '/kadin/bluz', heading: 'Blouse & Shirt' },
    { route: '/kadin/ceket', heading: 'Jacket' },
    { route: '/kadin/etek', heading: 'Skirt' },
    { route: '/kadin/pantolon', heading: 'Trousers' },
    { route: '/kadin/yeni', heading: 'New Arrivals' },
    { route: '/kadin/cok-satan', heading: 'Best Sellers' },
    { route: '/kadin/koleksiyon', heading: 'Collection' },
    { route: '/erkek/takim', heading: 'Suit' },
    { route: '/erkek/gomlek', heading: 'Shirt' },
    { route: '/erkek/pantolon', heading: 'Trousers' },
    { route: '/erkek/ceket', heading: 'Jacket' },
    { route: '/erkek/yeni', heading: 'New Arrivals' },
    { route: '/erkek/cok-satan', heading: 'Best Sellers' },
    { route: '/erkek/koleksiyon', heading: 'Collection' },
  ];

  for (const collection of collections) {
    test(`opens the ${collection.heading.toLowerCase()} collection @happy`, async ({
      storefront,
    }) => {
      await storefront.openRoute(collection.route);
      await storefront.expectCategoryLoaded(collection.heading);
    });
  }

  for (const subcategory of subcategories) {
    test(`opens ${subcategory.route} subcategory @happy`, async ({ storefront }) => {
      await storefront.openRoute(subcategory.route);
      await storefront.expectCategoryLoaded(subcategory.heading);
    });
  }

  test(
    'shows an empty state for a search with no matches',
    { tag: '@negative' },
    async ({ storefront }) => {
      const missingTerm = `missing-${Date.now()}-product`;
      await storefront.openHome();
      await storefront.searchFor(missingTerm);
      await storefront.expectUrl(new RegExp(`/arama\\?q=${missingTerm}`));
      await expect(storefront.searchResultsHeading).toBeVisible();
      await expect(storefront.noSearchResults).toBeVisible();
    },
  );

  test('navigates to a collection from the mobile menu', async ({ storefront }) => {
    await storefront.useMobileViewport();
    await storefront.openHome();
    await storefront.openMobileWomenCollection();
    await storefront.expectUrl(/\/kadin$/);
    await storefront.expectCategoryLoaded('Women');
  });
});
