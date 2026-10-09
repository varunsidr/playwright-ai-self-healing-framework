import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';
import {
  failBrowserCartStorage,
  fictionalCartVariants,
  seedRawBrowserCart,
  useInrStorefrontRegion,
} from '../../fixtures/ecommerce-browser-cart';

const valid = fictionalCartVariants[0];
const invalidRows = [
  { label: 'null row', value: null },
  { label: 'empty ID', value: { ...valid, id: '' } },
  { label: 'blank name', value: { ...valid, name: '   ' } },
  { label: 'negative price', value: { ...valid, price: -1 } },
  { label: 'nonnumeric price', value: { ...valid, price: '1000' } },
  { label: 'null price', value: { ...valid, price: null } },
  { label: 'zero quantity', value: { ...valid, quantity: 0 } },
  { label: 'fractional quantity', value: { ...valid, quantity: 1.5 } },
  { label: 'unsafe quantity', value: { ...valid, quantity: Number.MAX_SAFE_INTEGER + 1 } },
  { label: 'invalid option', value: { ...valid, size: {} } },
  { label: 'unsupported image protocol', value: { ...valid, image_url: 'javascript:fixture' } },
];

test.describe(
  'Zeouf controlled browser cart storage',
  { tag: ['@ecommerce', '@regression'] },
  () => {
    for (const invalid of invalidRows) {
      test(`TC-CART-004-02 removes ${invalid.label} and persists valid edits @negative`, async ({
        context,
        page,
        storefront,
      }) => {
        const writes = await blockEcommerceWrites(context);
        const pageErrors: string[] = [];
        page.on('pageerror', (error) => pageErrors.push(error.message));
        await useInrStorefrontRegion(context);
        await seedRawBrowserCart(context, JSON.stringify([valid, invalid.value]));
        await storefront.openHome();
        await storefront.openCart();
        await expect(storefront.cartLines).toHaveCount(1);
        await expect(storefront.cartRecoveryNotice).toBeVisible();
        await expect(storefront.cartSubtotal).toContainText('₹2,000');
        await storefront.changeCartQuantity('S', 'Increase');
        await expect(storefront.cartLineQuantity('S')).toHaveText('3');
        await expect
          .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('els-cart') || '[]')))
          .toEqual([{ ...valid, quantity: 3 }]);
        await page.reload();
        await storefront.openCart();
        await expect(storefront.cartLines).toHaveCount(1);
        await expect(storefront.cartLineQuantity('S')).toHaveText('3');
        await expect(storefront.cartSubtotal).toContainText('₹3,000');
        expect(pageErrors).toEqual([]);
        expect(writes).toEqual([]);
      });
    }

    test('TC-CART-004-02 normalizes missing/empty/null colors and merges recovered tuples @happy', async ({
      context,
      page,
      storefront,
    }) => {
      const writes = await blockEcommerceWrites(context);
      await useInrStorefrontRegion(context);
      const missingColor = { ...valid, color: undefined };
      await seedRawBrowserCart(
        context,
        JSON.stringify([
          { ...missingColor, quantity: 1 },
          { ...valid, color: '', quantity: 1 },
          { ...valid, color: null, quantity: 1 },
          fictionalCartVariants[1],
        ]),
      );
      await storefront.openHome();
      await storefront.openCart();
      await expect(storefront.cartLines).toHaveCount(2);
      await expect(storefront.cartLineQuantity('S')).toHaveText('3');
      await expect(storefront.cartLineQuantity('M')).toHaveText('1');
      await expect(storefront.cartSubtotal).toContainText('₹4,000');
      await expect
        .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('els-cart') || '[]')))
        .toEqual([{ ...valid, color: null, quantity: 3 }, fictionalCartVariants[1]]);
      expect(writes).toEqual([]);
    });

    for (const raw of ['null', '{}', '"not an array"']) {
      test(`TC-CART-004-04 nonarray ${raw} recovers to empty @negative`, async ({
        context,
        storefront,
      }) => {
        const writes = await blockEcommerceWrites(context);
        await seedRawBrowserCart(context, raw);
        await storefront.openHome();
        await storefront.openCart();
        await expect(storefront.emptyCartMessage).toBeVisible();
        await expect(storefront.cartRecoveryNotice).toBeVisible();
        expect(writes).toEqual([]);
      });
    }

    test('TC-CART-004-03 blocked reads show a persistence notice and usable empty bag @negative', async ({
      context,
      storefront,
    }) => {
      const writes = await blockEcommerceWrites(context);
      await failBrowserCartStorage(context, 'read');
      await storefront.openHome();
      await storefront.openCart();
      await expect(storefront.emptyCartMessage).toBeVisible();
      await expect(storefront.cartPersistenceNotice).toBeVisible();
      await storefront.startShoppingButton.click();
      await expect(storefront.cartPanel).toHaveAttribute('data-state', 'closed');
      expect(writes).toEqual([]);
    });

    test('TC-CART-004-03 quota failure preserves in-memory quantity and removal @negative', async ({
      context,
      storefront,
    }) => {
      const writes = await blockEcommerceWrites(context);
      await useInrStorefrontRegion(context);
      await failBrowserCartStorage(context, 'write', JSON.stringify([valid]));
      await storefront.openHome();
      await storefront.openCart();
      await expect(storefront.cartLineQuantity('S')).toHaveText('2');
      await expect(storefront.cartPersistenceNotice).toBeVisible();
      await storefront.changeCartQuantity('S', 'Increase');
      await expect(storefront.cartLineQuantity('S')).toHaveText('3');
      await expect(storefront.cartSubtotal).toContainText('₹3,000');
      await storefront.removeCartLine('S');
      await expect(storefront.emptyCartMessage).toBeVisible();
      expect(writes).toEqual([]);
    });
  },
);
