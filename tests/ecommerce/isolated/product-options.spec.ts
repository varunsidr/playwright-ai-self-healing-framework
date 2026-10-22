import { savedBrowserCart, test } from '../../../fixtures/ecommerce-isolated';
import { expect } from '../../../fixtures/ecommerce-base';

test.describe('Zeouf isolated product options', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-PDP-05-CORE static clothing guide shows four reference rows and closes', async ({
    storefront,
    shop,
  }) => {
    await storefront.openProductRoute('/women/' + shop.products.sized.id, shop.products.sized.name);
    await storefront.openSizeGuide();
    await expect(storefront.sizeGuideHeading).toBeVisible();
    const rows = storefront.sizeGuideRows();
    await expect(rows).toHaveCount(5);
    for (const [index, cells] of [
      ['XS', '80-84 cm', '60-64 cm'],
      ['S', '84-88 cm', '64-68 cm'],
      ['M', '88-92 cm', '68-72 cm'],
      ['L', '92-96 cm', '72-76 cm'],
    ].entries())
      await expect(storefront.sizeGuideRowCells(index + 1)).toHaveText(cells);
    await storefront.closeSizeGuide();
    await expect(storefront.sizeGuideHeading).toHaveCount(0);
    await expect(storefront.sizeGuideButton).toBeVisible();
  });

  test('TC-PDP-003-01 unavailable size cannot be selected and available M enters browser bag', async ({
    context,
    storefront,
    shop,
  }) => {
    await storefront.openProductRoute('/women/' + shop.products.sized.id, shop.products.sized.name);
    await expect(storefront.addToCartButton).toBeDisabled();
    await expect(storefront.productSize('S')).toBeDisabled();
    expect(await savedBrowserCart(context)).toEqual([]);
    await storefront.productSize('M').click();
    await expect(storefront.productSize('M')).toHaveAttribute('data-selected', 'true');
    await expect(storefront.addToCartButton).toBeEnabled();
    await storefront.addToCartButton.click();
    await expect(storefront.cartPanel).toHaveAttribute('data-state', 'open');
    await expect
      .poll(() => savedBrowserCart(context))
      .toEqual([expect.objectContaining({ id: shop.products.sized.id, size: 'M', quantity: 1 })]);
  });

  test('TC-PDP-04-CORE quantity clamps to selected size stock and never falls below one', async ({
    storefront,
    shop,
  }) => {
    await storefront.openProductRoute('/women/' + shop.products.sized.id, shop.products.sized.name);
    await storefront.productSize('L').click();
    await expect(storefront.quantity).toHaveText('1');
    await storefront.quantityDecrease.click();
    await expect(storefront.quantity).toHaveText('1');
    for (let index = 1; index < 5; index++) await storefront.quantityIncrease.click();
    await expect(storefront.quantity).toHaveText('5');
    await expect(storefront.quantityIncrease).toBeDisabled();
    await storefront.productSize('M').click();
    await expect(storefront.quantity).toHaveText('4');
    await expect(storefront.quantityIncrease).toBeDisabled();
    for (let index = 4; index > 1; index--) await storefront.quantityDecrease.click();
    await expect(storefront.quantity).toHaveText('1');
    await storefront.quantityDecrease.click();
    await expect(storefront.quantity).toHaveText('1');
  });

  test('TC-PDP-02-CORE demo product hides color controls and extra gallery images', async ({
    storefront,
    shop,
  }) => {
    await storefront.openProductRoute(
      '/women/' + shop.products.soldOut.id,
      shop.products.soldOut.name,
    );
    await expect(storefront.productGalleryThumbnails()).toHaveCount(0);
    await expect(storefront.colorSelectionButtons()).toHaveCount(0);
    const mainImage = storefront.mainProductImages(shop.products.soldOut.name);
    await expect(mainImage).toHaveCount(1);
    await expect(mainImage).toHaveAttribute('src', /demo-products/);
  });

  for (const count of [0, 1, 12]) {
    test('TC-PDP-07-CORE related product boundary ' + count, async ({ storefront, shop }) => {
      shop.related = Array.from({ length: count }, (_, index) => ({
        id: 'related-' + index,
        name: 'Related Dress ' + index,
        category: "Women's Dress",
        price: 1000,
        image_url: '/kadin-product-1.jpg',
      }));
      await storefront.openProductRoute(
        '/women/' + shop.products.sized.id,
        shop.products.sized.name,
      );
      await expect
        .poll(() => shop.reads.some((url) => url.pathname.endsWith('/products')))
        .toBe(true);
      await expect(storefront.relatedProductCards()).toHaveCount(Math.min(count, 8));
      if (count === 0) await expect(storefront.visibleText('Complete Your Look')).toHaveCount(0);
      else {
        await expect(storefront.visibleText('Complete Your Look')).toBeVisible();
        await expect(storefront.relatedProductCards().getByTestId('product-card-name')).toHaveText(
          shop.related.slice(0, 8).map((product) => product.name),
        );
        for (const [index, product] of shop.related.slice(0, 8).entries())
          await expect(
            storefront.relatedProductCards().nth(index).getByTestId('product-card-link'),
          ).toHaveAttribute('href', '/women/' + product.id);
      }
      const query = shop.reads.find((url) => url.pathname.endsWith('/products'))!.searchParams;
      expect(query.get('id')).toBe('neq.' + shop.products.sized.id);
      expect(query.get('category')).toBe('ilike.Women%');
      expect(query.get('limit')).toBe('8');
    });
  }
});
