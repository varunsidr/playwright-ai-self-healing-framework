import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf route fallbacks', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-NAV-07-CORE unknown routes show not-found and admin omits storefront chrome @negative', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);

    await storefront.openRoute('/women/not-a-real-product-2026');
    await storefront.expectNotFound();

    await storefront.openRoute('/women/no-such-category-2026');
    await storefront.expectNotFound();

    await storefront.openRoute('/admin');
    await storefront.expectAdminWithoutStorefrontChrome();
    expect(attemptedWrites).toEqual([]);
  });
});
