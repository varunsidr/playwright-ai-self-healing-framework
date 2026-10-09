import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf legacy category navigation', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-NAV-006-01 redirects representative legacy category URLs @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);

    await storefront.openRoute('/kadin/elbise');
    await storefront.expectUrl(/\/women\/dress$/);
    await storefront.expectCategoryLoaded('Dress');

    await storefront.openRoute('/erkek/takim');
    await storefront.expectUrl(/\/men\/suits$/);
    await storefront.expectCategoryLoaded('Suit');

    await storefront.openRoute('/parfum');
    await storefront.expectUrl(/\/perfume$/);
    await storefront.expectCategoryLoaded('Perfume');

    expect(attemptedWrites).toEqual([]);
  });
});
