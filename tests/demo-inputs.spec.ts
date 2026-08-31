import { test, expect } from '../fixtures/base';
import { validInputsData } from '../fixtures/test-data';

test.describe('Expand Testing demo', () => {
  test('fills and clears the web inputs page', async ({ inputsPage, inputsFlow }) => {
    await inputsFlow.open();
    await expect(inputsPage.heading).toBeVisible();

    await inputsFlow.fillAndDisplay(validInputsData);
    await inputsPage.expectOutputValues(validInputsData);

    await inputsFlow.clear();
    await inputsPage.expectInputsCleared();
  });
});
