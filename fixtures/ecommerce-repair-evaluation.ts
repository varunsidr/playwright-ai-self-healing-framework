import { writeFileSync } from 'node:fs';
import { blockEcommerceWrites, test as base } from './ecommerce-base';
import {
  EcommerceRepairEvaluationPage,
  type RepairEvaluationStage,
} from '../pages/ecommerce-repair-evaluation-page';

export { expect, blockEcommerceWrites } from './ecommerce-base';

export const test = base.extend<{ repairEvaluation: EcommerceRepairEvaluationPage }>({
  repairEvaluation: async ({ page, storefront, context, baseURL }, use, testInfo) => {
    if (process.env.ECOMMERCE_REPAIR_EVALUATION !== 'true') {
      throw new Error('Controlled faults must be invoked through npm run demo:ecommerce:repair');
    }
    const stage = process.env.ECOMMERCE_REPAIR_STAGE as RepairEvaluationStage;
    if (
      ![
        'baseline',
        'locator-drift',
        'locator-repair',
        'application-defect',
        'environment-unavailable',
      ].includes(stage)
    ) {
      throw new Error('Unknown controlled repair evaluation stage');
    }
    // Bound a deliberately stale locator without adding retries or fixed sleeps.
    page.setDefaultTimeout(5000);
    const evaluation = new EcommerceRepairEvaluationPage(
      page,
      storefront,
      stage,
      process.env.ECOMMERCE_REPAIR_SELECTOR,
    );
    evaluation.observation.attemptedWrites = await blockEcommerceWrites(context);
    await evaluation.prepareEnvironment(context, baseURL!);
    try {
      await use(evaluation);
    } finally {
      const output = testInfo.outputPath('evaluation-observation.json');
      writeFileSync(output, JSON.stringify(evaluation.observation, null, 2));
      await testInfo.attach('evaluation-observation', {
        path: output,
        contentType: 'application/json',
      });
    }
  },
});
