import { expect, test as base, type BrowserContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { EcommerceStorefrontPage } from '../pages/ecommerce-storefront-page';
import { isConfirmedEcommerceStaging } from '../utils/ecommerce-staging';

const repositoryRoot = resolve(__dirname, '..');
const checkManifest: {
  checks: { id: string; file: string; project: string; testTitle?: string }[];
} = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'specs/ecommerce/requirements/check-links.json'), 'utf8'),
);

export const test = base.extend<{
  storefront: EcommerceStorefrontPage;
  caseTraceability: void;
  publicWriteGuard: void;
}>({
  publicWriteGuard: [
    async ({ context, baseURL }, use, testInfo) => {
      const guarded =
        testInfo.project.name === 'ecommerce-chromium' && !isConfirmedEcommerceStaging(baseURL);
      const writes = guarded ? await blockEcommerceWrites(context) : [];
      await use();
      expect(writes, 'Read-only ecommerce tests must not attempt server writes').toEqual([]);
    },
    { auto: true },
  ],
  caseTraceability: [
    // Playwright requires fixture dependency destructuring even when there are no dependencies.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      const file = relative(repositoryRoot, testInfo.file).replaceAll('\\', '/');
      const matches = checkManifest.checks.filter(
        (check) =>
          check.file === file &&
          check.project === testInfo.project.name &&
          check.testTitle === testInfo.title,
      );
      if (matches.length > 1)
        throw new Error(`Ambiguous check mapping: ${file}: ${testInfo.title}`);
      if (matches.length) {
        const existing = testInfo.annotations.filter((item) => item.type === 'zeouf-check');
        if (
          existing.length &&
          (existing.length !== 1 || existing[0].description !== matches[0].id)
        ) {
          throw new Error(`Conflicting check annotation: ${file}: ${testInfo.title}`);
        }
        if (!existing.length)
          testInfo.annotations.push({ type: 'zeouf-check', description: matches[0].id });
      }
      await use();
    },
    { auto: true },
  ],
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
