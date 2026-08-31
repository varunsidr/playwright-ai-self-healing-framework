import { test as base } from '@playwright/test';
import { InputsPage } from '../pages/inputs-page';
import { InputsFlow } from '../flows/inputs-flow';

export const test = base.extend<{ inputsPage: InputsPage; inputsFlow: InputsFlow }>({
  inputsPage: async ({ page }, use) => {
    await use(new InputsPage(page));
  },

  inputsFlow: async ({ inputsPage }, use) => {
    await use(new InputsFlow(inputsPage));
  },
});

export { expect } from '@playwright/test';
