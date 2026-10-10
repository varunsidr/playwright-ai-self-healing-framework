import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf newsletter preview', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'TC-CNT-001-01 valid email shows preview without network write @negative',
    { annotation: { type: 'zeouf-check', description: 'CHK-NEWSLETTER-PREVIEW' } },
    async ({ context, storefront }) => {
      const attemptedWrites = await blockEcommerceWrites(context);
      await storefront.openHome();
      await storefront.submitNewsletterPreview('preview-only@example.test');

      await expect(storefront.newsletterPreviewNotice).toBeVisible();
      expect(attemptedWrites).toEqual([]);
    },
  );
});
