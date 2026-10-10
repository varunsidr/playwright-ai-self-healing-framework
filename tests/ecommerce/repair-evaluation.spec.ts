import { expect } from '../../fixtures/ecommerce-base';
import { test } from '../../fixtures/ecommerce-repair-evaluation';

test(
  'EVAL-CNT-001 newsletter preview preserves its written expectation @ecommerce',
  {
    annotation: { type: 'zeouf-evaluation', description: 'EVAL-CNT-001' },
  },
  async ({ storefront, repairEvaluation }) => {
    const writes = repairEvaluation.observation.attemptedWrites;
    await storefront.openHome();
    await repairEvaluation.prepareNewsletter();
    await repairEvaluation.submitNewsletterPreview('evaluation-only@example.test');
    await expect(storefront.newsletterPreviewNotice).toBeVisible();
    expect(writes).toEqual([]);
  },
);
