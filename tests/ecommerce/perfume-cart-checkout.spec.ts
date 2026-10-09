import { expect, test } from '../../fixtures/ecommerce-base';
import { isConfirmedEcommerceStaging } from '../../utils/ecommerce-staging';

test.describe('Perfume cart checkout', { tag: ['@ecommerce', '@regression'] }, () => {
  test.skip(
    ({ baseURL }) =>
      !isConfirmedEcommerceStaging(baseURL) ||
      !process.env.ECOMMERCE_TEST_USER_EMAIL ||
      !process.env.ECOMMERCE_TEST_USER_PASSWORD,
    'Requires confirmed isolated staging and a disposable, already confirmed test user.',
  );

  test('Add multiple perfumes to the cart and continue to checkout @happy', async ({
    storefront,
  }) => {
    const selectedPerfumes = ['My Way', 'Chance Eau Tendre'];

    // Start from the fresh zeouf homepage using the storefront seed.
    await storefront.openHome();
    await storefront.expectHomeLoaded();
    await expect(storefront.perfumeNavLink).toBeVisible();

    // Use a disposable confirmed fixture account. Registration/email delivery is tested separately.
    await storefront.openAccountPanel();
    await storefront.signIn(
      process.env.ECOMMERCE_TEST_USER_EMAIL!,
      process.env.ECOMMERCE_TEST_USER_PASSWORD!,
    );
    await expect(storefront.loginPanel).toHaveAttribute('data-state', 'closed');

    // From the homepage navigation, open the Perfume collection.
    await storefront.openPerfumeCollectionFromNav();
    await storefront.expectUrl(/\/perfume$/);
    await storefront.expectCategoryLoaded('Perfume');
    await expect(storefront.productCards.first()).toBeVisible();

    // Add two distinct in-stock perfume products from the visible catalog cards.
    await storefront.addCatalogProductsToCart(selectedPerfumes);

    // Open My Cart from the navbar.
    await storefront.openCart();
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'open');
    await expect(storefront.emptyCartMessage).toBeHidden();
    for (const perfumeName of selectedPerfumes) {
      await expect(storefront.cartItemByName(perfumeName)).toBeVisible();
    }
    await expect(storefront.checkoutFromCartLink).toBeVisible();

    // Continue from the cart to checkout.
    await storefront.continueToCheckoutFromCart();
    await storefront.expectUrl(/\/checkout$/);
    await expect(storefront.checkoutHeading).toBeVisible();
    for (const perfumeName of selectedPerfumes) {
      await expect(storefront.checkoutItemByName(perfumeName)).toBeVisible();
    }
    await expect(storefront.simulatePaymentButton).toBeEnabled();
  });
});
