import { expect, test } from '../../fixtures/ecommerce-base';
import { isConfirmedEcommerceStaging } from '../../utils/ecommerce-staging';

test.describe('Ecommerce admin access', { tag: ['@ecommerce', '@regression'] }, () => {
  test.skip(
    ({ baseURL }) => !isConfirmedEcommerceStaging(baseURL),
    'Admin login submits credentials; run only on confirmed isolated Zeouf staging.',
  );

  test('rejects an invalid admin password', { tag: '@negative' }, async ({ storefront }) => {
    await storefront.openRoute('/admin');
    await expect(storefront.adminLoginHeading).toBeVisible();
    await storefront.tryInvalidAdminPassword();
    await expect(storefront.adminLoginError).toBeVisible();
  });
});
