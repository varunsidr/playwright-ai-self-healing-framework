// Test layer: only scenario intent + assertions live here — no locators,
// no raw page.goto/click calls (those belong in pages/ and flows/).
import { expect, test } from '../fixtures/base';
import { homePageData } from '../fixtures/test-data';

test.describe('Expand Testing home page', () => {
  test('opens the inputs demo from the homepage', async ({ homePage, homeFlow, inputsPage }) => {
    await homeFlow.open();
    await homePage.expectLoaded();

    await homeFlow.openDemo(homePageData.demoName);
    await expect(inputsPage.heading).toBeVisible();
  });
});