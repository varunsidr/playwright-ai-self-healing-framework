import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface InputsPageValues {
  number: string;
  text: string;
  password: string;
  date: string;
}

export class InputsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly numberInput: Locator;
  readonly textInput: Locator;
  readonly passwordInput: Locator;
  readonly dateInput: Locator;
  readonly displayButton: Locator;
  readonly clearButton: Locator;
  readonly outputValues: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Web inputs page for Automation Testing Practice' });
    this.numberInput = page.getByRole('spinbutton', { name: 'Input: Number' });
    this.textInput = page.getByRole('textbox', { name: 'Input: Text' });
    this.passwordInput = page.getByRole('textbox', { name: 'Input: Password' });
    this.dateInput = page.getByRole('textbox', { name: 'Input: Date' });
    this.displayButton = page.getByRole('button', { name: 'Display Inputs' });
    this.clearButton = page.getByRole('button', { name: 'Clear Inputs' });
    this.outputValues = page.locator('main strong');
  }

  async goto() {
    await this.page.goto('/inputs');
  }

  async fill(values: InputsPageValues) {
    await this.numberInput.fill(values.number);
    await this.textInput.fill(values.text);
    await this.passwordInput.fill(values.password);
    await this.dateInput.fill(values.date);
  }

  async display() {
    await this.displayButton.click();
  }

  async clear() {
    await this.clearButton.click();
  }

  // Output panel only ever renders number/text/password, in that order (date is not echoed).
  async expectOutputValues(values: Pick<InputsPageValues, 'number' | 'text' | 'password'>) {
    await expect(this.outputValues).toHaveCount(4);
    await expect(this.outputValues.nth(0)).toHaveText(values.number);
    await expect(this.outputValues.nth(1)).toHaveText(values.text);
    await expect(this.outputValues.nth(2)).toHaveText(values.password);
  }

  async expectInputsCleared() {
    await expect(this.numberInput).toHaveValue('');
    await expect(this.textInput).toHaveValue('');
    await expect(this.passwordInput).toHaveValue('');
    await expect(this.dateInput).toHaveValue('');
  }
}
