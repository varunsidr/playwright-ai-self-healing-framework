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
    { route: '/kadin', canonical: '/women', heading: 'Women' },
    { route: '/erkek', canonical: '/men', heading: 'Men' },
    { route: '/parfum', canonical: '/perfume', heading: 'Perfume' },
    { route: '/ayakkabi', canonical: '/shoes', heading: 'Shoes' },
    { route: '/aksesuar', canonical: '/accessories', heading: 'Accessories' },
    { route: '/canta', canonical: '/bags', heading: 'Bags' },
    { route: '/makyaj', canonical: '/makeup', heading: 'Makeup' },
  ];

  const subcategories = [
    { route: '/kadin/elbise', canonical: '/women/dress', heading: 'Dress' },
    { route: '/kadin/bluz', canonical: '/women/blouse', heading: 'Blouse & Shirt' },
    { route: '/kadin/ceket', canonical: '/women/jacket', heading: 'Jacket' },
    { route: '/kadin/etek', canonical: '/women/skirt', heading: 'Skirt' },
    { route: '/kadin/pantolon', canonical: '/women/trousers', heading: 'Trousers' },
    { route: '/kadin/yeni', canonical: '/women/new-arrivals', heading: 'New Arrivals' },
    { route: '/kadin/cok-satan', canonical: '/women/best-sellers', heading: 'Best Sellers' },
    { route: '/kadin/koleksiyon', canonical: '/women/collection', heading: 'Collection' },
    { route: '/erkek/takim', canonical: '/men/suits', heading: 'Suit' },
    { route: '/erkek/gomlek', canonical: '/men/shirts', heading: 'Shirt' },
    { route: '/erkek/pantolon', canonical: '/men/trousers', heading: 'Trousers' },
    { route: '/erkek/ceket', canonical: '/men/jacket', heading: 'Jacket' },
    { route: '/erkek/yeni', canonical: '/men/new-arrivals', heading: 'New Arrivals' },
    { route: '/erkek/cok-satan', canonical: '/men/best-sellers', heading: 'Best Sellers' },
    { route: '/erkek/koleksiyon', canonical: '/men/collection', heading: 'Collection' },
  ];

  for (const collection of collections) {
    test(`opens the ${collection.heading.toLowerCase()} collection @happy`, async ({
      storefront,
    }) => {
      await storefront.openRoute(collection.route);
      await storefront.expectUrl(new RegExp(`${collection.canonical}$`));
      await storefront.expectCategoryLoaded(collection.heading);
    });
  }

  for (const subcategory of subcategories) {
    test(`opens ${subcategory.route} subcategory @happy`, async ({ storefront }) => {
      await storefront.openRoute(subcategory.route);
      await storefront.expectUrl(new RegExp(`${subcategory.canonical}$`));
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
      await storefront.expectUrl(new RegExp(`/search\\?q=${missingTerm}`));
      await expect(storefront.searchResultsHeading).toBeVisible();
      await expect(storefront.noSearchResults).toBeVisible();
    },
  );

  test('navigates to a collection from the mobile menu', async ({ storefront }) => {
    await storefront.useMobileViewport();
    await storefront.openHome();
    await storefront.openMobileWomenCollection();
    await storefront.expectUrl(/\/women$/);
    await storefront.expectCategoryLoaded('Women');
  });
});
