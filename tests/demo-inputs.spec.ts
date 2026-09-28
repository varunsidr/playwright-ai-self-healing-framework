// Canonical real test case for the /inputs page — fills every field, verifies
// the echoed output, then clears and verifies the fields are empty again.
import { test, expect } from '../fixtures/base';
import { validInputsData, partialInputsData, numberOnlyInputsData } from '../fixtures/test-data';

test.describe('Expand Testing demo', { tag: '@regression' }, () => {
  test('Inputs page: display a submitted value @happy', async ({ inputsPage, inputsFlow }) => {
    await inputsFlow.open();
    await expect(inputsPage.heading).toBeVisible();

    await inputsFlow.fillAndDisplay(numberOnlyInputsData);
    await inputsPage.expectOutputValues(numberOnlyInputsData);
  });

  test('fills and clears the web inputs page @happy', async ({ inputsPage, inputsFlow }) => {
    await inputsFlow.open();
    await expect(inputsPage.heading).toBeVisible();

    await inputsFlow.fillAndDisplay(validInputsData);
    await inputsPage.expectOutputValues(validInputsData);

    await inputsFlow.clear();
    await inputsPage.expectInputsCleared();
  });

  test('echoes blank output for fields left empty @happy', async ({ inputsPage, inputsFlow }) => {
    await inputsFlow.open();
    await expect(inputsPage.heading).toBeVisible();

    await inputsFlow.fillAndDisplay(partialInputsData);
    await inputsPage.expectOutputValues(partialInputsData);
  });
});
