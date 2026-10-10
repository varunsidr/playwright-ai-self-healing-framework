import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf account input state', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'TC-AUTH-04-CORE password visibility and tabs preserve entered value @happy',
    { annotation: { type: 'zeouf-check', description: 'CHK-AUTH-PASSWORD-VISIBILITY' } },
    async ({ context, storefront }) => {
      const attemptedWrites = await blockEcommerceWrites(context);
      const fictionalPassword = 'FictionalOnly!234';
      await storefront.openHome();
      await storefront.openAccountPanel();
      await expect(storefront.loginPassword).toHaveAttribute('type', 'password');
      await storefront.loginPassword.fill(fictionalPassword);
      await storefront.toggleLoginPasswordVisibility();
      await expect(storefront.loginPassword).toHaveAttribute('type', 'text');
      await expect(storefront.loginPassword).toHaveValue(fictionalPassword);

      await storefront.switchToRegister();
      await expect(storefront.registerForm).toBeVisible();
      await expect(storefront.registerPassword).toHaveAttribute('type', 'text');
      await expect(storefront.registerPassword).toHaveValue(fictionalPassword);
      await expect(storefront.registerConfirmPassword).toHaveValue('');
      await storefront.toggleRegisterPasswordVisibility();
      await expect(storefront.registerPassword).toHaveAttribute('type', 'password');
      await expect(storefront.registerPassword).toHaveValue(fictionalPassword);

      await storefront.switchToSignIn();
      await expect(storefront.loginPassword).toHaveValue(fictionalPassword);
      expect(attemptedWrites).toEqual([]);
    },
  );
});
