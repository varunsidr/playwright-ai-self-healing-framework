import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf registration confirmation', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'AUTH-02 requires a nonblank confirmation @negative',
    { annotation: { type: 'zeouf-check', description: 'CHK-AUTH-CONFIRMATION-BLANK' } },
    async ({ context, storefront }) => {
      const attemptedWrites = await blockEcommerceWrites(context);

      await storefront.openHome();
      await storefront.openRegistrationPanel();
      await storefront.fillRegistration({
        fullName: 'Pilot Test User',
        email: 'pilot-auth-blank@example.com',
        password: 'ExamplePass123!',
        confirmation: '',
      });

      await storefront.submitRegistration();

      await expect(storefront.registerConfirmPassword).toHaveAttribute('required', '');
      await expect(storefront.registerConfirmPassword).toBeFocused();
      await expect(storefront.registerForm).toBeVisible();
      expect(attemptedWrites).toEqual([]);
    },
  );
});
