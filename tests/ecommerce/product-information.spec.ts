import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf product information', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-PDP-06-CORE opens one information panel at a time @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await storefront.openFirstProduct();
    await storefront.expectProductDetailLoaded();

    const sections = ['details', 'measurements', 'care', 'shipping'] as const;
    for (const [index, section] of sections.entries()) {
      await storefront.openProductInformation(section);
      await storefront.expectProductInformationOpen(section);
      if (index > 0) await storefront.expectProductInformationClosed(sections[index - 1]);
    }

    expect(attemptedWrites).toEqual([]);
  });
});
