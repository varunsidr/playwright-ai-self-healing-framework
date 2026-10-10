import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf guest cart gate', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'TC-CART-001-01 guest add prompts for account and leaves cart empty @negative',
    { annotation: { type: 'zeouf-check', description: 'CHK-CART-GUEST-DENIAL' } },
    async ({ context, storefront }) => {
      const attemptedWrites = await blockEcommerceWrites(context);

      await storefront.openWomenCollection();
      await storefront.expectWomenCollectionLoaded();
      await storefront.addFirstCatalogProductToCart();
      await storefront.expectGuestSignInRequired();
      await storefront.closeAccountPanel();
      await storefront.openCart();

      await expect(storefront.emptyCartMessage).toBeVisible();
      expect(attemptedWrites).toEqual([]);
    },
  );
});
