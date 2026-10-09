import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';
import {
  fictionalCartVariants,
  seedBrowserCart,
  useInrStorefrontRegion,
} from '../../fixtures/ecommerce-browser-cart';

test.describe('Zeouf browser-local cart controls', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-CART-03-CORE shows variants and updates quantity, line totals and subtotal @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await useInrStorefrontRegion(context);
    await seedBrowserCart(context, fictionalCartVariants);

    await storefront.openHome();
    await storefront.openCart();

    const small = storefront.cartLineForSize('S');
    const medium = storefront.cartLineForSize('M');
    await expect(storefront.cartLines).toHaveCount(2);
    await expect(storefront.cartLineImage('S')).toBeVisible();
    await expect(small).toContainText('Playwright Browser Cart Item');
    await expect(small).toContainText('Color: Blue');
    await expect(storefront.cartLineQuantity('S')).toHaveText('2');
    await expect(small).toContainText('₹2,000');
    await expect(medium).toContainText('₹1,000');
    await expect(storefront.cartSubtotal).toContainText('₹3,000');

    await storefront.changeCartQuantity('S', 'Increase');
    await expect(storefront.cartLineQuantity('S')).toHaveText('3');
    await expect(small).toContainText('₹3,000');
    await expect(storefront.cartSubtotal).toContainText('₹4,000');
    await storefront.changeCartQuantity('S', 'Decrease');
    await expect(storefront.cartLineQuantity('S')).toHaveText('2');
    await expect(small).toContainText('₹2,000');
    await storefront.changeCartQuantity('S', 'Decrease');
    await expect(storefront.cartLineQuantity('S')).toHaveText('1');
    await expect(small).toContainText('₹1,000');
    await storefront.changeCartQuantity('S', 'Decrease');
    await expect(small).toHaveCount(0);
    await expect(medium).toHaveCount(1);
    await storefront.removeCartLine('M');
    await expect(storefront.emptyCartMessage).toBeVisible();
    expect(attemptedWrites).toEqual([]);
  });

  test('TC-CART-06-CORE empty bag closes with Start Shopping @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await storefront.openHome();
    await storefront.openCart();
    await expect(storefront.emptyCartMessage).toBeVisible();
    await expect(storefront.startShoppingButton).toBeVisible();
    await expect(storefront.proceedToCheckoutButton).toHaveCount(0);
    await storefront.startShoppingButton.click();
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'closed');
    await storefront.expectUrl(/\/$/);
    expect(attemptedWrites).toEqual([]);
  });

  test('TC-CART-06-CORE nonempty bag closes and navigates to checkout @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await useInrStorefrontRegion(context);
    await seedBrowserCart(context, fictionalCartVariants.slice(0, 1));
    await storefront.openHome();
    await storefront.openCart();
    await expect(storefront.proceedToCheckoutButton).toBeVisible();
    await expect(storefront.startShoppingButton).toHaveCount(0);
    await storefront.proceedToCheckoutButton.click();
    await storefront.expectUrl(/\/checkout$/);
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'closed');
    await expect(storefront.checkoutHeading).toBeVisible();
    await expect(storefront.checkoutSignInMessage).toBeVisible();
    expect(attemptedWrites).toEqual([]);
  });
});
