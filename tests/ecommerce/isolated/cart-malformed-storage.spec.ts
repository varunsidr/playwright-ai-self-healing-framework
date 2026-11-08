import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated';
import { seedRawBrowserCart } from '../../../fixtures/ecommerce-browser-cart';

test.describe('Zeouf saved cart recovery', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'TC-CART-004-04 malformed browser cart recovers to empty @negative',
    { annotation: { type: 'zeouf-check', description: 'CHK-CART-MALFORMED-RECOVERY' } },
    async ({ context, storefront }) => {
      await seedRawBrowserCart(context, '{not-json');

      await storefront.openHome();
      await storefront.openCart();

      await expect(storefront.emptyCartMessage).toBeVisible();
      await expect(storefront.cartRecoveryNotice).toBeVisible();
    },
  );
});
