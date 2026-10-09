import { expect, test } from '../../fixtures/ecommerce-base';

test.describe('Ecommerce product details', { tag: ['@ecommerce', '@regression'] }, () => {
  test('opens a product and checks quantity and review form @happy', async ({ storefront }) => {
    await storefront.openFirstProduct();
    await storefront.expectProductDetailLoaded();

    await expect(storefront.quantity).toHaveText('1');
    await storefront.quantityIncrease.click();
    await expect(storefront.quantity).toHaveText('2');
    await storefront.quantityDecrease.click();
    await expect(storefront.quantity).toHaveText('1');

    await expect(storefront.reviewSubmitButton).toBeDisabled();
  });

  test(
    'requires sign in before adding a product to the cart',
    { tag: '@negative' },
    async ({ storefront }) => {
      await storefront.openFirstProduct();
      await storefront.addToCartButton.click();
      await storefront.expectGuestSignInRequired();
    },
  );
});
