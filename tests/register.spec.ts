// Register page scenario: fills the form via the homepage "Try it out" link
// and verifies the flash error message that the site shows on failure --
// verify/adjust the exact wording once confirmed against the live site.
import { test, expect } from '../fixtures/base';
import { registerData } from '../fixtures/test-data';

test.describe('Expand Testing register page', () => {
  test('shows a flash error when registration fails', async ({ registerFlow, registerPage }) => {
    await registerFlow.openViaHomepage();
    await expect(registerPage.usernameInput).toBeVisible();

    await registerFlow.fillAndSubmit(registerData);

    await registerPage.expectFlashMessageVisible();
  });
});
