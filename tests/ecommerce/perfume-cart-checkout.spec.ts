import { expect, test } from '../../fixtures/ecommerce-base';

const shopperPassword = 'PerfumePass123!';

test.describe('Perfume cart checkout', { tag: ['@ecommerce', '@regression'] }, () => {
  test.skip(
    ({ baseURL }) =>
      baseURL ? new URL(baseURL).hostname === 'zeouf-luxury-fashion-ecommerce.vercel.app' : false,
    'Account registration requires a dedicated Zeouf test deployment.',
  );

  test('Add multiple perfumes to the cart and continue to checkout @happy', async ({
    storefront,
  }) => {
    const shopper = {
      fullName: 'Playwright Perfume Shopper',
      email: `playwright.perfume.${Date.now()}@example.com`,
      password: shopperPassword,
    };
    const selectedPerfumes = ['My Way', 'Chance Eau Tendre'];

    // Start from the fresh zeouf homepage using the storefront seed.
    await storefront.openHome();
    await storefront.expectHomeLoaded();
    await expect(storefront.perfumeNavLink).toBeVisible();

    // Open the account panel, choose Register, and submit a fresh shopper using a unique realistic email address.
    await storefront.registerNewShopper(shopper);
    await storefront.signIn(shopper.email, shopper.password);
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
