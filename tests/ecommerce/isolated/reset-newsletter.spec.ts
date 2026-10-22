import { expect } from '../../../fixtures/ecommerce-base';
import { test } from '../../../fixtures/ecommerce-isolated';

test.use({ signedIn: false });

for (const rejected of [false, true]) {
  test(
    'TC-AUTH-05-CORE controlled reset ' +
      (rejected ? 'denial retains email and permits retry' : 'success sends email and return URL'),
    async ({ storefront, shop, page, baseURL }) => {
      shop.resetMode = rejected ? 'error' : 'success';
      await storefront.openHome();
      await storefront.openAccountPanel();
      await storefront.loginEmail.fill('reset-fixture@example.invalid');
      const requested = page.waitForRequest(
        (request) => new URL(request.url()).pathname === '/auth/v1/recover',
      );
      await storefront.forgotPasswordButton.click();
      const request = await requested;
      expect(new URL(request.url()).searchParams.get('redirect_to')).toBe(
        new URL(baseURL!).origin + '/',
      );
      expect(request.postDataJSON()).toMatchObject({ email: 'reset-fixture@example.invalid' });
      if (rejected) {
        await expect(storefront.visibleText('Controlled reset rejected')).toBeVisible();
        await expect(storefront.loginEmail).toHaveValue('reset-fixture@example.invalid');
        await expect(
          storefront.visibleText('Password reset instructions sent. Check your inbox.'),
        ).toHaveCount(0);
        shop.resetMode = 'success';
        await storefront.forgotPasswordButton.click();
      }
      await expect(
        storefront.visibleText('Password reset instructions sent. Check your inbox.'),
      ).toBeVisible();
      await expect(storefront.loginSubmit).toBeEnabled();
      expect(shop.calls.filter((call) => call.path === '/auth/v1/recover')).toHaveLength(
        rejected ? 2 : 1,
      );
      expect(shop.calls.filter((call) => call.path === '/auth/v1/token')).toEqual([]);
      // Provider responses are fictional: no mailbox delivery or reset-link completion claim.
    },
  );
}

for (const email of ['', 'not-an-email']) {
  test(
    'TC-CNT-001-01 ' +
      (email ? 'malformed' : 'blank') +
      ' newsletter email prevents preview success',
    async ({ storefront, shop }) => {
      await storefront.openHome();
      await storefront.submitNewsletterPreview(email);
      await expect(storefront.newsletterEmail()).toBeFocused();
      expect(
        await storefront
          .newsletterEmail()
          .evaluate((input) => (input as HTMLInputElement).validity.valid),
      ).toBe(false);
      await expect(storefront.newsletterPreviewNotice).toHaveCount(0);
      expect(shop.calls).toEqual([]);
    },
  );
}
