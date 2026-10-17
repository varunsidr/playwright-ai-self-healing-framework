import { expect } from '../../fixtures/ecommerce-base';
import { catalogProducts, test } from '../../fixtures/ecommerce-catalog';

const categories = [
  "Women's Dress",
  "Women's Blouse & Shirt",
  "Women's Jacket",
  "Women's Skirt",
  "Women's Trousers",
  "Men's Suit",
  "Men's Shirt",
  "Men's Trousers",
  "Men's Jacket",
  'Shoes',
  'Bags',
  'Accessories',
  'Perfume',
  'Makeup',
];
const routes = [
  { route: '/women', heading: 'Women', indices: [0, 1, 2, 3, 4] },
  { route: '/men', heading: 'Men', indices: [5, 6, 7, 8] },
  { route: '/shoes', heading: 'Shoes', indices: [9] },
  { route: '/bags', heading: 'Bags', indices: [10] },
  { route: '/accessories', heading: 'Accessories', indices: [11] },
  { route: '/perfume', heading: 'Perfume', indices: [12] },
  { route: '/makeup', heading: 'Makeup', indices: [13] },
  { route: '/women/dress', heading: 'Dress', indices: [0] },
  { route: '/women/blouse', heading: 'Blouse & Shirt', indices: [1] },
  { route: '/women/jacket', heading: 'Jacket', indices: [2] },
  { route: '/women/skirt', heading: 'Skirt', indices: [3] },
  { route: '/women/trousers', heading: 'Trousers', indices: [4] },
  { route: '/men/suits', heading: 'Suit', indices: [5] },
  { route: '/men/shirts', heading: 'Shirt', indices: [6] },
  { route: '/men/trousers', heading: 'Trousers', indices: [7] },
  { route: '/men/jacket', heading: 'Jacket', indices: [8] },
];

test.describe(
  'Zeouf controlled category membership',
  { tag: ['@ecommerce', '@regression'] },
  () => {
    for (const { route, heading, indices } of routes) {
      test(`TC-CAT-01-CORE ${route} includes only matching categories @happy`, async ({
        catalog,
        storefront,
      }) => {
        catalog.products = catalogProducts(categories.length).map((product, index) => ({
          ...product,
          name: `Category Fixture ${index + 1}`,
          category: index % 2 ? categories[index].toUpperCase() : categories[index],
        }));
        await storefront.openRoute(route);
        await storefront.expectCategoryLoaded(heading);
        await expect(storefront.productCardNames()).toHaveText(
          indices.map((index) => catalog.products[index].name),
        );
        await storefront.expectCollectionCount(indices.length, indices.length);
        await expect(storefront.collectionFallback).toBeHidden();
        expect(catalog.queries.length).toBeGreaterThan(0);
      });
    }
  },
);
