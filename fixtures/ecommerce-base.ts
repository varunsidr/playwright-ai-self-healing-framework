import { test as base } from '@playwright/test';
import { EcommerceStorefrontPage } from '../pages/ecommerce-storefront-page';

export const test = base.extend<{ storefront: EcommerceStorefrontPage }>({
  storefront: async ({ page }, use) => {
    await use(new EcommerceStorefrontPage(page));
  },
});

export { expect } from '@playwright/test';
