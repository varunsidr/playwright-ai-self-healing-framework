import { expect } from '../../../fixtures/ecommerce-base';
import {
  fictionalCartVariants,
  seedBrowserCart,
  seedRawBrowserCart,
} from '../../../fixtures/ecommerce-browser-cart';
import {
  customerId,
  savedBrowserCart,
  secondCustomerId,
  setFictionalSession,
  test,
} from '../../../fixtures/ecommerce-isolated';

test('TC-FAV-002-01 sign-out clears favorites and a second fictional user reads their own filter', async ({
  storefront,
  shop,
  page,
}) => {
  shop.favorites.add(shop.products.sized.id);
  await storefront.openProductRoute('/women/' + shop.products.sized.id, shop.products.sized.name);
  await expect(storefront.productFavoriteButton()).toHaveAttribute(
    'aria-label',
    'Remove from favorites',
  );
  await storefront.openAccountPanel();
  await storefront.accountSignOut().click();
  await expect(storefront.productFavoriteButton()).toHaveAttribute(
    'aria-label',
    'Add to favorites',
  );
  shop.loginUserId = secondCustomerId;
  await storefront.openAccountPanel();
  await storefront.signIn('second-shopper@example.invalid', 'Fictional-password-123!');
  await expect(storefront.loginPanel).toHaveAttribute('data-state', 'closed');
  await expect
    .poll(() =>
      shop.reads.some(
        (url) =>
          url.pathname.endsWith('/favorites') &&
          url.searchParams.get('user_id') === 'eq.' + secondCustomerId,
      ),
    )
    .toBe(true);
  await expect(storefront.productFavoriteButton()).toHaveAttribute(
    'aria-label',
    'Add to favorites',
  );
  await storefront.productFavoriteButton().click();
  await expect(storefront.productFavoriteButton()).toHaveAttribute(
    'aria-label',
    'Remove from favorites',
  );
  expect(
    shop.calls.find((call) => call.method === 'POST' && call.path.endsWith('/favorites'))?.body,
  ).toMatchObject({
    user_id: secondCustomerId,
    product_id: shop.products.sized.id,
  });
  await page.reload();
  await expect(storefront.productFavoriteButton()).toHaveAttribute(
    'aria-label',
    'Remove from favorites',
  );
  expect(shop.favoritesByUser.get(customerId)).toEqual(new Set([shop.products.sized.id]));
});

test('TC-CART-004-01 sign-out and account switching restore only the current account bag', async ({
  context,
  storefront,
  shop,
  page,
}) => {
  await seedBrowserCart(context, [fictionalCartVariants[1]]);
  const secondBag = [{ ...fictionalCartVariants[0], name: 'Second account bag', quantity: 7 }];
  await seedBrowserCart(context, secondBag, secondCustomerId);
  await seedRawBrowserCart(
    context,
    JSON.stringify([{ ...fictionalCartVariants[1], name: 'Unowned legacy bag' }]),
    null,
  );
  await storefront.openHome();
  await storefront.openCart();
  await expect(storefront.cartLines).toContainText(fictionalCartVariants[1].name);
  await expect(storefront.statusWithText('Bags are now saved per account')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('els-cart'))).toBeNull();
  await storefront.closeCart();
  await storefront.openAccountPanel();
  await expect(storefront.accountSignOut()).toBeVisible();
  await storefront.accountSignOut().click();
  await expect(storefront.cartPanel).toHaveAttribute('data-state', 'closed');
  await storefront.openCart();
  await expect(storefront.emptyCartMessage).toBeVisible();
  await storefront.closeCart();
  shop.loginUserId = secondCustomerId;
  await storefront.openAccountPanel();
  await storefront.signIn('second-shopper@example.invalid', 'Fictional-password-123!');
  await expect(storefront.loginPanel).toHaveAttribute('data-state', 'closed');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('sb-supabase-auth-token') || '{}').user?.id,
    ),
  ).toBe(secondCustomerId);
  await storefront.openCart();
  await expect(storefront.cartLines).toHaveCount(1);
  await expect(storefront.cartLines).toContainText('Second account bag');
  await expect(storefront.cartLineQuantity('S', 'Second account bag')).toHaveText('7');
  await setFictionalSession(context, secondCustomerId, 'TOKEN_REFRESHED');
  await expect(storefront.cartPanel).toHaveAttribute('data-state', 'open');
  await expect(storefront.cartLineQuantity('S', 'Second account bag')).toHaveText('7');
  await storefront.changeCartQuantity('S', 'Increase', 'Second account bag');
  await expect
    .poll(() => savedBrowserCart(context, secondCustomerId))
    .toEqual([{ ...secondBag[0], quantity: 8 }]);
  shop.loginUserId = customerId;
  await setFictionalSession(context, customerId);
  await expect(storefront.cartPanel).toHaveAttribute('data-state', 'closed');
  await storefront.openCart();
  await expect(storefront.cartLines).toContainText(fictionalCartVariants[1].name);
  await expect(storefront.cartLineQuantity('M')).toHaveText('1');
  await page.reload();
  await storefront.openCart();
  await expect(storefront.cartLineQuantity('M')).toHaveText('1');
  expect(await savedBrowserCart(context)).toEqual([fictionalCartVariants[1]]);
  expect(await savedBrowserCart(context, secondCustomerId)).toEqual([
    { ...secondBag[0], quantity: 8 },
  ]);
});
