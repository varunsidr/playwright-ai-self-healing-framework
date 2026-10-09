import { test as base, type BrowserContext } from '@playwright/test';
import { EcommerceStorefrontPage } from '../pages/ecommerce-storefront-page';

export const test = base.extend<{ storefront: EcommerceStorefrontPage }>({
  storefront: async ({ page }, use) => {
    await use(new EcommerceStorefrontPage(page));
  },
});

export { expect } from '@playwright/test';

export async function blockEcommerceWrites(context: BrowserContext): Promise<string[]> {
  const attemptedWrites: string[] = [];
  await context.route('**/*', (route) => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      attemptedWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
      return route.abort();
    }
    return route.continue();
  });
  return attemptedWrites;
}
