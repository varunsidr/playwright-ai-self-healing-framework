import { test, expect } from '../fixtures/base';

// Seed file: navigates to the starting state consumed by the test-generator/healer agents.
test.describe('Web inputs page', { tag: '@regression' }, () => {
  test('seed @smoke @happy', async ({ inputsPage }) => {
    await inputsPage.goto();
    await expect(inputsPage.heading).toBeVisible();
  });
});
