import { expect, test } from '../../fixtures/ecommerce-base';

test.describe('Ecommerce admin access', { tag: ['@ecommerce', '@regression'] }, () => {
  test('rejects an invalid admin password', { tag: '@negative' }, async ({ storefront }) => {
    await storefront.openRoute('/admin');
    await expect(storefront.adminLoginHeading).toBeVisible();
    await storefront.tryInvalidAdminPassword();
    await expect(storefront.adminLoginError).toBeVisible();
  });
});
