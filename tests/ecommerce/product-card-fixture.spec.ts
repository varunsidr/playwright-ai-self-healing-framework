import { expect } from '../../fixtures/ecommerce-base';
import { catalogProducts, test } from '../../fixtures/ecommerce-catalog';

test.describe('Zeouf product card fixtures', { tag: ['@ecommerce', '@regression'] }, () => {
  for (const viewport of [375, 1440]) {
    test(`TC-PDP-001-01 sized/unsized/unavailable actions at ${viewport}px @happy`, async ({
      catalog,
      page,
      storefront,
    }) => {
      await page.setViewportSize({ width: viewport, height: 900 });
      const products = catalogProducts(3);
      catalog.products = [
        { ...products[0], name: 'Available Unsized', stock: 1 },
        { ...products[1], name: 'Available Sized', sizes: ['S', 'M'], stock: 4 },
        { ...products[2], name: 'Unavailable Product', stock: 0 },
      ];
      catalog.stock = [{ product_id: products[1].id, size: 'M', stock: 4 }];
      await storefront.openWomenCollection();
      await storefront.expectCategoryLoaded('Women');
      await expect(storefront.productCards).toHaveCount(3);
      const add = storefront.cardAddAction('Available Unsized');
      const chooseSize = storefront.cardSizeAction('Available Sized');
      if (viewport === 1440) {
        await storefront.productCardByName('Available Unsized').hover();
        await expect(add).toHaveCSS('opacity', '1');
        await page.mouse.move(0, 0);
        await storefront.cardFavorite('Available Unsized').focus();
        await expect(add).toHaveCSS('opacity', '1');
        await chooseSize.focus();
      } else {
        await expect(add).toHaveCSS('opacity', '1');
      }
      await expect(chooseSize).toHaveCSS('opacity', '1');
      await expect(chooseSize).toHaveAttribute('href', `/women/${products[1].id}`);
      await expect(storefront.cardAddAction('Available Sized')).toBeHidden();
      await expect(storefront.cardAddAction('Unavailable Product')).toHaveCount(0);
      await expect(storefront.cardSizeAction('Unavailable Product')).toHaveCount(0);
      await expect(storefront.cardUnavailable('Unavailable Product')).toBeVisible();
      await expect(storefront.cardFavorite('Available Unsized')).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      await add.click();
      await storefront.expectGuestSignInRequired();
      await storefront.closeAccountPanel();
      await storefront.openCart();
      await expect(storefront.emptyCartMessage).toBeVisible();
    });
  }

  test('TC-PDP-001-01 image failure retains readable name/price/link and guest action @negative', async ({
    catalog,
    context,
    storefront,
  }) => {
    catalog.products = [{ ...catalogProducts(1)[0], name: 'Image Failure Fixture', price: 1200 }];
    let failedImages = 0;
    await context.route('**/_next/image?*', (route) => {
      failedImages += 1;
      return route.abort('failed');
    });
    await storefront.openWomenCollection();
    await storefront.expectCategoryLoaded('Women');
    const card = storefront.productCardByName('Image Failure Fixture');
    await card.scrollIntoViewIfNeeded();
    await expect(storefront.cardImageFailure('Image Failure Fixture')).toBeVisible();
    expect(failedImages).toBeGreaterThan(0);
    await expect(card).toContainText('Image Failure Fixture');
    await expect(card.getByTestId('product-card-price')).toHaveText('₹1,200');
    await expect(storefront.cardImageLink('Image Failure Fixture')).toHaveAttribute(
      'href',
      `/women/${catalog.products[0].id}`,
    );
    await card.hover();
    await storefront.cardAddAction('Image Failure Fixture').click();
    await storefront.expectGuestSignInRequired();
  });
});
