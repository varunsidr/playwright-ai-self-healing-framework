// Page Object Model (POM) for the practice site's small demo pages -- one
// class per page, grouped in a single file since each page is only a
// handful of locators/actions. Split a class out into its own file only
// once it grows past ~50-60 lines or gets its own dedicated flow.
import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base-page';

export interface HomePageValues {
  demoName: string;
}

export class HomePage extends BasePage {
  // Locators only — no assertions or business logic here.
  readonly heroHeading: Locator;
  readonly heroSubheading: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly sampleApplicationsHeading: Locator;
  readonly registerTryItOutLink: Locator;

  constructor(page: Page) {
    super(page);
    // Prefer role/label-based locators (accessibility tree) over CSS/XPath --
    // they're less brittle than Selenium-style id/class selectors.
    this.heroHeading = page.getByRole('heading', { name: 'Automation Testing Practice WebSite for QA and Developers' });
    this.heroSubheading = page.getByRole('heading', {
      name: 'Free Test Automation Practice Website for Selenium, Playwright, Cypress, WebdriverIO, and Postman | Web UI and REST API Testing Example',
    });
    this.searchInput = page.getByRole('textbox', { name: 'Search an example...' });
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.sampleApplicationsHeading = page.getByRole('heading', { name: 'Sample applications for practice test automation' });
    // Every card has its own "Try it out" link, so disambiguate by href
    // (equivalent to //a[@href='/register' and contains(text(), 'Try it out')]).
    this.registerTryItOutLink = page.locator('a[href="/register"]', { hasText: 'Try it out' });
  }

  // Navigates relative to baseURL (set in playwright.config.ts).
  async goto() {
    await this.gotoPath('/');
  }

  // Reusable "page has loaded" check — no explicit waits needed, locators auto-retry.
  async expectLoaded() {
    await expect(this.heroHeading).toBeVisible();
    await expect(this.heroSubheading).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.sampleApplicationsHeading).toBeVisible();
  }

  async searchForExample(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }

  async openDemo(demoName: string) {
    await this.page.getByRole('link', { name: demoName }).click();
  }

  async openRegisterDemo() {
    await this.registerTryItOutLink.click();
  }
}

// Shape of the four fields on the /inputs page -- shared between fill() and test data.
export interface InputsPageValues {
  number: string;
  text: string;
  password: string;
  date: string;
}

export class InputsPage extends BasePage {
  readonly heading: Locator;
  readonly numberInput: Locator;
  readonly textInput: Locator;
  readonly passwordInput: Locator;
  readonly dateInput: Locator;
  readonly displayButton: Locator;
  readonly clearButton: Locator;
  readonly outputValues: Locator;

  constructor(page: Page) {
    super(page);
    // getByRole targets the accessibility tree, not CSS/XPath, so it survives
    // most markup/styling changes (this is the self-healing-friendly strategy).
    this.heading = page.getByRole('heading', { name: 'Web inputs page for Automation Testing Practice' });
    this.numberInput = page.getByRole('spinbutton', { name: 'Input: Number' });
    this.textInput = page.getByRole('textbox', { name: 'Input: Text' });
    this.passwordInput = page.getByRole('textbox', { name: 'Input: Password' });
    this.dateInput = page.getByRole('textbox', { name: 'Input: Date' });
    this.displayButton = page.getByRole('button', { name: 'Display Inputs' });
    this.clearButton = page.getByRole('button', { name: 'Clear Inputs' });
    this.outputValues = page.locator('main strong');
  }

  // Navigates relative to baseURL (set in playwright.config.ts).
  async goto() {
    await this.gotoPath('/inputs');
  }

  // .fill() replaces the field value directly -- no need for Selenium-style
  // clear() + sendKeys() pairs, and no explicit waits (auto-waits for actionability).
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

export interface RegisterPageValues {
  username: string;
  password: string;
  confirmPassword: string;
}

export class RegisterPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly registerButton: Locator;
  readonly flashMessage: Locator;

  constructor(page: Page) {
    super(page);
    // CSS id selectors here match the site's stable #id attributes (equivalent
    // to the //input[@id='...'] xpaths) -- getByRole isn't usable since these
    // inputs have no accessible name/label.
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.flashMessage = page.locator('#flash b');
  }

  // Navigates relative to baseURL (set in playwright.config.ts).
  async goto() {
    await this.gotoPath('/register');
  }

  async fill(values: RegisterPageValues) {
    await this.usernameInput.fill(values.username);
    await this.passwordInput.fill(values.password);
    await this.confirmPasswordInput.fill(values.confirmPassword);
  }

  async submit() {
    await this.registerButton.click();
  }

  // Only checks visibility -- confirm the exact wording against the live site
  // before asserting on text, since it depends on account/duplicate state.
  async expectFlashMessageVisible() {
    await expect(this.flashMessage).toBeVisible();
  }
}
