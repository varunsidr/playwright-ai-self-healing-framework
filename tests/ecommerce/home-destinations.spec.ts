import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

const editorial = [
  { route: '/bags', heading: 'Bags' },
  { route: '/shoes', heading: 'Shoes' },
  { route: '/accessories', heading: 'Accessories' },
  { route: '/women/jacket', heading: 'Jacket' },
  { route: '/perfume', heading: 'Perfume' },
  { route: '/men/suits', heading: 'Suit' },
];

test.describe('Zeouf homepage destinations', { tag: ['@ecommerce', '@regression'] }, () => {
  for (const [index, destination] of editorial.entries()) {
    test(`TC-NAV-001-01 editorial ${destination.route} reaches its collection @happy`, async ({
      context,
      storefront,
    }) => {
      const writes = await blockEcommerceWrites(context);
      await storefront.useReducedMotion();
      await storefront.openHome();
      const link = storefront.homeEditorialLink(index);
      await expect(link).toHaveAttribute('href', destination.route);
      await link.click();
      await storefront.expectCategoryLoaded(destination.heading);
      await expect(storefront.productCards.first()).toBeVisible();
      expect(writes).toEqual([]);
    });
  }

  for (const group of ['women', 'men'] as const) {
    test(`TC-NAV-001-01 ${group} collection panel reaches its destination @happy`, async ({
      context,
      storefront,
    }) => {
      const writes = await blockEcommerceWrites(context);
      await storefront.useReducedMotion();
      await storefront.openHome();
      await storefront.homeCollectionLink(group).click();
      await storefront.expectUrl(group === 'women' ? /\/women$/ : /\/men$/);
      await storefront.expectCategoryLoaded(group === 'women' ? 'Women' : 'Men');
      expect(writes).toEqual([]);
    });
  }

  test('TC-NAV-001-01 blouse edit and all seven category links have intended destinations @happy', async ({
    context,
    storefront,
  }) => {
    const writes = await blockEcommerceWrites(context);
    await storefront.useReducedMotion();
    await storefront.openHome();
    for (const name of ['Women', 'Men', 'Perfume', 'Shoes', 'Accessories', 'Bags', 'Makeup']) {
      await expect(storefront.homeCategoryLink(name)).toHaveAttribute(
        'href',
        `/${name.toLowerCase()}`,
      );
    }
    await storefront.readonlyHomeEditLink().click();
    await storefront.expectUrl(/\/women\/blouse$/);
    await storefront.expectCategoryLoaded('Blouse & Shirt');
    expect(writes).toEqual([]);
  });
});
