import type { BrowserContext, Page } from '@playwright/test';
import { EcommerceStorefrontPage } from './ecommerce-storefront-page';

export type RepairEvaluationStage =
  | 'baseline'
  | 'locator-drift'
  | 'locator-repair'
  | 'application-defect'
  | 'environment-unavailable';

export class EcommerceRepairEvaluationPage {
  readonly observation: {
    originalSubmitVisible: boolean | null;
    replacementSubmitVisible: boolean | null;
    replacementTestId: string | null;
    noticeText: string | null;
    blockedDocuments: number;
    attemptedWrites: string[];
  } = {
    originalSubmitVisible: null,
    replacementSubmitVisible: null,
    replacementTestId: null,
    noticeText: null,
    blockedDocuments: 0,
    attemptedWrites: [],
  };

  constructor(
    private readonly page: Page,
    private readonly storefront: EcommerceStorefrontPage,
    private readonly stage: RepairEvaluationStage,
    private readonly repairedTestId: string | undefined,
  ) {}

  async prepareEnvironment(context: BrowserContext, baseURL: string) {
    if (this.stage !== 'environment-unavailable') return;
    const origin = new URL(baseURL).origin;
    await context.route('**/*', (route) => {
      const request = route.request();
      if (
        request.isNavigationRequest() &&
        request.resourceType() === 'document' &&
        new URL(request.url()).origin === origin
      ) {
        this.observation.blockedDocuments += 1;
        return route.abort('connectionrefused');
      }
      return route.fallback();
    });
  }

  async prepareNewsletter() {
    const original = this.page.getByTestId('footer-newsletter-submit');
    await original.waitFor({ state: 'visible' });
    if (['locator-drift', 'locator-repair'].includes(this.stage)) {
      await original.evaluate((element) => {
        element.setAttribute('data-testid', 'evaluation-newsletter-submit-v2');
      });
    }
    this.observation.originalSubmitVisible = await original.isVisible();
    const replacement = this.page.getByTestId('evaluation-newsletter-submit-v2');
    this.observation.replacementSubmitVisible = await replacement.isVisible();
    this.observation.replacementTestId = this.observation.replacementSubmitVisible
      ? await replacement.getAttribute('data-testid')
      : null;
  }

  async submitNewsletterPreview(email: string) {
    if (this.stage === 'locator-repair') {
      // The rehearsal changes only this locator, never the business assertion.
      if (this.repairedTestId !== 'evaluation-newsletter-submit-v2') {
        throw new Error('The reviewed rehearsal accepts only the observed replacement test ID');
      }
      await this.page.getByTestId('footer-newsletter-email').fill(email);
      await this.page.getByTestId(this.repairedTestId).click();
    } else {
      await this.storefront.submitNewsletterPreview(email);
    }
    await this.storefront.newsletterPreviewNotice.waitFor({ state: 'visible' });
    if (this.stage === 'application-defect') {
      this.observation.noticeText = await this.storefront.newsletterPreviewNotice.evaluate(
        (element) => {
          element.textContent = 'Newsletter preview unavailable.';
          return element.textContent;
        },
      );
    } else {
      this.observation.noticeText = await this.storefront.newsletterPreviewNotice.textContent();
    }
  }
}
