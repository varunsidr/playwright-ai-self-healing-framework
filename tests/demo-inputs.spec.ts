// Canonical real test case for the /inputs page — fills every field, verifies
// the echoed output, then clears and verifies the fields are empty again.
import { test, expect } from '../fixtures/base';
import { validInputsData, partialInputsData } from '../fixtures/test-data';

test.describe('Expand Testing demo', () => {
  test('fills and clears the web inputs page', async ({ inputsPage, inputsFlow }) => {
    await inputsFlow.open();
    await expect(inputsPage.heading).toBeVisible();

    await inputsFlow.fillAndDisplay(validInputsData);
    await inputsPage.expectOutputValues(validInputsData);

    await inputsFlow.clear();
    await inputsPage.expectInputsCleared();
  });

  test('echoes blank output for fields left empty', async ({ inputsPage, inputsFlow }) => {
    await inputsFlow.open();
    await expect(inputsPage.heading).toBeVisible();

    await inputsFlow.fillAndDisplay(partialInputsData);
    await inputsPage.expectOutputValues(partialInputsData);
  });
});
