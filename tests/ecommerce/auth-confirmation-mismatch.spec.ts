import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf registration confirmation', { tag: ['@ecommerce', '@regression'] }, () => {
  test('AUTH-02 rejects mismatched confirmation before signup @negative', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);

    await storefront.openHome();
    await storefront.openRegistrationPanel();
    await storefront.fillRegistration({
      fullName: 'Pilot Test User',
      email: 'pilot-auth-mismatch@example.com',
      password: 'ExamplePass123!',
      confirmation: 'DifferentPass123!',
    });

    await storefront.submitRegistration();

    await expect(storefront.registrationMismatchAlert).toBeVisible();
    await expect(storefront.registerForm).toBeVisible();
    expect(attemptedWrites).toEqual([]);
  });
});
