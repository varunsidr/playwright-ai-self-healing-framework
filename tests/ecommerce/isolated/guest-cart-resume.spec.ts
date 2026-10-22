import { expect } from '../../../fixtures/ecommerce-base';
import { savedBrowserCart, test } from '../../../fixtures/ecommerce-isolated';

test.describe('Zeouf isolated interrupted guest add', () => {
  test.use({ signedIn: false });
  test('TC-CART-001-02 sign-in does not replay a guest add and explicit add creates one browser line', async ({
    storefront,
    shop,
    context,
  }) => {
    await storefront.openProductRoute(
      '/women/' + shop.products.unsized.id,
      shop.products.unsized.name,
    );
    await storefront.addToCartButton.click();
    await storefront.expectGuestSignInRequired();
    expect(await savedBrowserCart(context)).toEqual([]);
    await storefront.loginTab.click();
    await storefront.signIn('browser-fixture@example.invalid', 'Fictional-password-123!');
    await expect(storefront.loginPanel).toHaveAttribute('data-state', 'closed');
    await storefront.openCart();
    await expect(storefront.emptyCartMessage).toBeVisible();
    expect(await savedBrowserCart(context)).toEqual([]);
    await storefront.startShoppingButton.click();
    await storefront.addToCartButton.click();
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'open');
    await expect
      .poll(() => savedBrowserCart(context))
      .toEqual([expect.objectContaining({ id: shop.products.unsized.id, quantity: 1 })]);
  });
});
