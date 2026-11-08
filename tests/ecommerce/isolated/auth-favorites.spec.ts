import { test } from '../../../fixtures/ecommerce-isolated';
import { expect } from '../../../fixtures/ecommerce-base';

test.describe(
  'Zeouf isolated registration and sign-in',
  { tag: ['@ecommerce', '@regression'] },
  () => {
    test.use({ signedIn: false });

    test.beforeEach(async ({ storefront, shop }) => {
      expect(shop.calls).toEqual([]);
      await storefront.openHome();
      await storefront.openAccountPanel();
    });

    for (const field of ['fullName', 'email', 'password'] as const) {
      test(
        'TC-AUTH-01-CORE required registration ' + field + ' blocks requests',
        async ({ storefront, shop }) => {
          await storefront.registerTab.click();
          await storefront.registerFullName.fill('Fictional Shopper');
          await storefront.registerEmail.fill('browser-fixture@example.invalid');
          await storefront.registerPassword.fill('Fictional-password-123!');
          await storefront.registerConfirmPassword.fill('Fictional-password-123!');
          const input = {
            fullName: storefront.registerFullName,
            email: storefront.registerEmail,
            password: storefront.registerPassword,
          }[field];
          await input.fill('');
          await storefront.registerSubmit.click();
          await expect(input).toBeFocused();
          expect(
            await input.evaluate((element) => (element as HTMLInputElement).validity.valueMissing),
          ).toBe(true);
          expect(shop.calls).toEqual([]);
        },
      );
    }

    for (const signupFailure of [false, true]) {
      test(
        'TC-AUTH-07-CORE registration uses only signup ' +
          (signupFailure ? 'after explicit retry' : 'on success'),
        async ({ storefront, shop }) => {
          shop.signupMode = signupFailure ? 'error' : 'success';
          await storefront.registerTab.click();
          await storefront.registerFullName.fill('Fictional Shopper');
          await storefront.registerEmail.fill('browser-fixture@example.invalid');
          await storefront.registerPassword.fill('Fictional-password-123!');
          await storefront.registerConfirmPassword.fill('Fictional-password-123!');
          await storefront.registerSubmit.click();
          if (signupFailure) {
            await expect(storefront.visibleText('Controlled fixture unavailable')).toBeVisible();
            await expect(storefront.registerEmail).toHaveValue('browser-fixture@example.invalid');
            shop.signupMode = 'success';
            await storefront.registerSubmit.click();
          }
          await expect(storefront.visibleText(/Please verify your email/)).toBeVisible();
          await expect(storefront.loginSubmit).toBeVisible();
          const helper = shop.calls.filter((call) => call.path === '/api/dev/create-user');
          expect(helper).toEqual([]);
          const signup = shop.calls.filter((call) => call.path === '/auth/v1/signup');
          expect(signup).toHaveLength(signupFailure ? 2 : 1);
          expect(signup[0].body).toMatchObject({
            email: 'browser-fixture@example.invalid',
            data: { full_name: 'Fictional Shopper' },
          });
        },
      );
    }

    test('TC-AUTH-003-01 login error retains form and success survives reload', async ({
      storefront,
      shop,
      page,
    }) => {
      shop.loginFailure = true;
      await storefront.loginEmail.fill('browser-fixture@example.invalid');
      await storefront.loginPassword.fill('Fictional-password-123!');
      await storefront.loginSubmit.click();
      await expect(storefront.visibleText('Invalid login credentials')).toBeVisible();
      await expect(storefront.loginPanel).toHaveAttribute('data-state', 'open');
      await expect(storefront.loginEmail).toHaveValue('browser-fixture@example.invalid');
      expect(await page.evaluate(() => localStorage.getItem('sb-supabase-auth-token'))).toBeNull();
      shop.loginFailure = false;
      await storefront.loginSubmit.click();
      await expect(storefront.loginPanel).toHaveAttribute('data-state', 'closed');
      await page.reload();
      await storefront.openRoute('/checkout');
      await expect(storefront.checkoutSignInMessage).toHaveCount(0);
      expect(
        await page.evaluate(
          () => JSON.parse(localStorage.getItem('sb-supabase-auth-token') || '{}').user?.id,
        ),
      ).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    });
  },
);

test.describe('Zeouf isolated favorite feedback', { tag: ['@ecommerce', '@regression'] }, () => {
  for (const failure of ['none', 'insert', 'delete']) {
    test(
      'TC-FAV-01-CORE favorite ' + failure + ' response updates only on success',
      async ({ storefront, shop }) => {
        if (failure === 'delete') shop.favorites.add(shop.products.sized.id);
        await storefront.openProductRoute(
          '/women/' + shop.products.sized.id,
          shop.products.sized.name,
        );
        const button = storefront.productFavoriteButton();
        await expect(button).toHaveAttribute(
          'aria-label',
          failure === 'delete' ? 'Remove from favorites' : 'Add to favorites',
        );
        shop.favoriteMode = failure === 'none' ? 'success' : 'error';
        await button.click();
        await expect
          .poll(() => shop.calls.filter((call) => call.path === '/rest/v1/favorites').length)
          .toBe(1);
        await expect(button).toHaveAttribute(
          'aria-label',
          failure === 'insert' ? 'Add to favorites' : 'Remove from favorites',
        );
        if (failure === 'none') {
          await button.click();
          await expect(button).toHaveAttribute('aria-label', 'Add to favorites');
          expect(
            shop.calls
              .filter((call) => call.path === '/rest/v1/favorites')
              .map((call) => call.method),
          ).toEqual(['POST', 'DELETE']);
        }
      },
    );
  }
});
