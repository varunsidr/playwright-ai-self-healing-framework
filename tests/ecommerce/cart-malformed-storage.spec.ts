import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf saved cart recovery', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'TC-CART-004-04 malformed browser cart recovers to empty @negative',
    { annotation: { type: 'zeouf-check', description: 'CHK-CART-MALFORMED-RECOVERY' } },
    async ({ context, storefront }) => {
      const attemptedWrites = await blockEcommerceWrites(context);
      await context.addInitScript(() => {
        window.localStorage.setItem('els-cart', '{not-json');
      });

      await storefront.openHome();
      await storefront.openCart();

      await expect(storefront.emptyCartMessage).toBeVisible();
      await expect(storefront.cartRecoveryNotice).toBeVisible();
      expect(attemptedWrites).toEqual([]);
    },
  );
});
