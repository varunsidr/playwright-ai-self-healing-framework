// Shared base for every page object -- holds the one thing all pages have in
// common (relative navigation), so new page objects only add their own
// locators/actions instead of re-declaring `page`/`goto` boilerplate.
import type { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async gotoPath(path: string) {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }
}
