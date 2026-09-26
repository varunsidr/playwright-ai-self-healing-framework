import { expect, test } from '../../fixtures/ecommerce-base';

test.describe('Ecommerce legal pages', { tag: ['@ecommerce', '@regression'] }, () => {
  test('renders the terms of service page', async ({ storefront }) => {
    await storefront.openRoute('/kullanim-kosullari');
    await expect(storefront.termsHeading).toBeVisible();
    await expect(storefront.termsOpenSourceHeading).toBeVisible();
  });
});
