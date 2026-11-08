import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated';

test.describe('Zeouf isolated password recovery', () => {
  test('TC-AUTH-05-CORE mismatched passwords make no provider update', async ({
    storefront,
    shop,
  }) => {
    await storefront.openRoute('/reset-password');
    await storefront.recoveryField('New password').fill('Fictional-password-123!');
    await storefront.recoveryField('Confirm new password').fill('Different-password-123!');
    await storefront.recoveryUpdateButton().click();
    await expect(storefront.alertWithText('Passwords do not match.')).toBeVisible();
    expect(shop.calls).toEqual([]);
  });

  test('TC-AUTH-05-CORE failed update preserves passwords and retry signs out locally', async ({
    page,
    storefront,
    shop,
  }) => {
    shop.passwordUpdateMode = 'error';
    await storefront.openRoute('/reset-password');
    const password = storefront.recoveryField('New password');
    const confirmation = storefront.recoveryField('Confirm new password');
    await password.fill('Fictional-password-123!');
    await confirmation.fill('Fictional-password-123!');
    await storefront.recoveryUpdateButton().click();
    await expect(storefront.alertWithText('Controlled password update rejected')).toBeVisible();
    await expect(password).toHaveValue('Fictional-password-123!');
    await expect(confirmation).toHaveValue('Fictional-password-123!');
    expect(shop.calls.filter((call) => call.path === '/auth/v1/logout')).toEqual([]);
    shop.passwordUpdateMode = 'success';
    await storefront.recoveryUpdateButton().click();
    await expect(storefront.statusWithText('Your password has been updated.')).toBeVisible();
    await expect(password).toHaveCount(0);
    const updates = shop.calls.filter(
      (call) => call.method === 'PUT' && call.path === '/auth/v1/user',
    );
    expect(updates).toHaveLength(2);
    expect(updates[1].body).toEqual({
      password: 'Fictional-password-123!',
      code_challenge: null,
      code_challenge_method: null,
    });
    expect(shop.calls.filter((call) => call.path === '/auth/v1/logout')).toHaveLength(1);
    expect(await page.evaluate(() => localStorage.getItem('sb-supabase-auth-token'))).toBeNull();
  });

  test('TC-AUTH-05-CORE saved password with failed logout asks the customer to sign out', async ({
    storefront,
    shop,
  }) => {
    shop.logoutMode = 'error';
    await storefront.openRoute('/reset-password');
    await storefront.recoveryField('New password').fill('Fictional-password-123!');
    await storefront.recoveryField('Confirm new password').fill('Fictional-password-123!');
    await storefront.recoveryUpdateButton().click();
    await expect(
      storefront.statusWithText('Sign out of this browser before signing in again.'),
    ).toBeVisible();
    await expect(storefront.recoveryUpdateButton()).toHaveCount(0);
    expect(shop.calls.filter((call) => call.method === 'PUT')).toHaveLength(1);
  });

  test('TC-AUTH-05-CORE rejected verified session offers a new recovery link', async ({
    storefront,
    shop,
    baseURL,
  }) => {
    shop.userMode = 'error';
    await storefront.openRoute('/reset-password');
    await expect(storefront.alertWithText('invalid or has expired')).toBeVisible();
    await expect(storefront.recoveryField('New password')).toHaveCount(0);
    await storefront.recoveryField('Email address').fill('recovery@example.invalid');
    await storefront.recoveryLinkButton().click();
    await expect(storefront.statusWithText('If an account exists for this address')).toBeVisible();
    const call = shop.calls.find((call) => call.path === '/auth/v1/recover');
    expect(call?.body).toMatchObject({ email: 'recovery@example.invalid' });
    expect(shop.calls.some((call) => call.method === 'PUT')).toBe(false);
    expect(new URL(baseURL!).pathname).toBe('/');
  });

  test('TC-AUTH-05-CORE expired recovery link removes its error fragment', async ({
    page,
    storefront,
    shop,
  }) => {
    await storefront.openRoute('/reset-password#error=access_denied&error_description=expired');
    await expect(storefront.alertWithText('invalid or has expired')).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password$/);
    await expect(storefront.recoveryLinkButton()).toBeEnabled();
    expect(shop.calls).toEqual([]);
  });
});

test.describe('Zeouf recovery without a session', () => {
  test.use({ signedIn: false });
  test('TC-AUTH-05-CORE missing session never offers password update', async ({
    storefront,
    shop,
  }) => {
    await storefront.openRoute('/reset-password');
    await expect(storefront.alertWithText('invalid or has expired')).toBeVisible();
    await expect(storefront.recoveryField('New password')).toHaveCount(0);
    await expect(storefront.recoveryLinkButton()).toBeEnabled();
    expect(shop.calls).toEqual([]);
  });
});
