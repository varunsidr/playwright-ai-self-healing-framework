import { expect } from '../../../fixtures/ecommerce-base';
import { test, savedBrowserCart } from '../../../fixtures/ecommerce-isolated';
import {
  fictionalCartVariants,
  seedBrowserCart,
  useInrStorefrontRegion,
} from '../../../fixtures/ecommerce-browser-cart';
test('TC-CART-002-01 restored duplicate variants merge by size and color @happy', async ({
  context,
  storefront,
}) => {
  await useInrStorefrontRegion(context);
  const redM = { ...fictionalCartVariants[0], size: 'M', color: 'Red', quantity: 1 };
  const redL = { ...redM, size: 'L' };
  const blueM = { ...redM, color: 'Blue' };
  await seedBrowserCart(context, [redM, redM, redL, blueM]);
  await storefront.openHome();
  await storefront.openCart();
  await expect(storefront.cartLines).toHaveCount(3);
  await expect(storefront.cartSubtotal).toContainText('₹4,000');
  await expect(storefront.cartLineQuantity('L')).toHaveText('1');
  await expect(storefront.cartVariantQuantity('M', 'Red')).toHaveText('2');
  await storefront.increaseCartVariant('M', 'Red');
  await expect
    .poll(() => savedBrowserCart(context))
    .toEqual([{ ...redM, quantity: 3 }, redL, blueM]);
});
