import { expect, test } from '../../fixtures/ecommerce-base';

test.describe('Ecommerce account and checkout', { tag: ['@ecommerce', '@regression'] }, () => {
  test('shows the guest empty favorites state', { tag: '@negative' }, async ({ storefront }) => {
    await storefront.openRoute('/favorilerim');
    await expect(storefront.favoritesHeading).toBeVisible();
    await expect(storefront.emptyFavoritesMessage).toBeVisible();
    await expect(storefront.discoverCollectionLink).toHaveAttribute('href', '/women');
  });

  test('opens and closes an empty cart @happy', async ({ storefront }) => {
    await storefront.openHome();
    await storefront.openEmptyCart();
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'open');
    await expect(storefront.emptyCartMessage).toBeVisible();
    await storefront.closeCart();
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'closed');
  });

  test(
    'blocks checkout for a signed-out shopper with an empty cart',
    { tag: '@negative' },
    async ({ storefront }) => {
      await storefront.openRoute('/checkout');
      await expect(storefront.checkoutHeading).toBeVisible();
      await expect(storefront.checkoutSignInMessage).toBeVisible();
      await expect(storefront.checkoutEmptyMessage).toBeVisible();
      await expect(storefront.simulatePaymentButton).toBeDisabled();
    },
  );

  test('shows the signed-out order history state', { tag: '@negative' }, async ({ storefront }) => {
    await storefront.openRoute('/orders');
    await expect(storefront.orderHistoryHeading).toBeVisible();
    await expect(storefront.signedOutOrdersHeading).toBeVisible();
  });

  test('opens account registration without submitting data @happy', async ({ storefront }) => {
    await storefront.openHome();
    await storefront.openRegistrationPanel();
    await expect(storefront.loginPanel).toHaveAttribute('data-state', 'open');
    for (const field of storefront.registerFields) await expect(field).toBeVisible();
  });
});
