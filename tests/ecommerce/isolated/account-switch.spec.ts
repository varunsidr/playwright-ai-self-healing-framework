import { expect } from '../../../fixtures/ecommerce-base';
import { fictionalCartVariants, seedBrowserCart } from '../../../fixtures/ecommerce-browser-cart';
import {
  customerId,
  savedBrowserCart,
  secondCustomerId,
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

test('TC-CART-004-01 baseline finding: the browser bag remains shared across fictional accounts', async ({
  context,
  storefront,
  shop,
  page,
}) => {
  await seedBrowserCart(context, [fictionalCartVariants[1]]);
  await storefront.openHome();
  await storefront.openAccountPanel();
  await expect(storefront.accountSignOut()).toBeVisible();
  await storefront.accountSignOut().click();
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
  await expect(storefront.cartLines).toContainText(fictionalCartVariants[1].name);
  expect(await savedBrowserCart(context)).toEqual([fictionalCartVariants[1]]);
  // This observes G-10. A green baseline check does not accept account-separated carts.
});
