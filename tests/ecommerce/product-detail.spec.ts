import { expect, test } from '../../fixtures/ecommerce-base';
import { createReviewTestData } from '../../fixtures/test-data';

test.describe('Ecommerce product details', { tag: ['@ecommerce', '@regression'] }, () => {
  test('opens a product and checks quantity, size guide, and review form @happy', async ({
    storefront,
  }) => {
    await storefront.openFirstProduct();
    await storefront.expectProductDetailLoaded();

    await expect(storefront.quantity).toHaveText('1');
    await storefront.quantityIncrease.click();
    await expect(storefront.quantity).toHaveText('2');
    await storefront.quantityDecrease.click();
    await expect(storefront.quantity).toHaveText('1');

    await storefront.openSizeGuide();
    await expect(storefront.sizeGuideHeading).toBeVisible();
    await expect(storefront.sizeGuideChestHeader).toBeVisible();
    await storefront.closeSizeGuide();
    await expect(storefront.sizeGuideHeading).toBeHidden();
    await expect(storefront.reviewSubmitButton).toBeDisabled();
  });

  test(
    'requires sign in before adding a product to the cart',
    { tag: '@negative' },
    async ({ storefront }) => {
      await storefront.openFirstProduct();
      await storefront.addToCartButton.click();
      await storefront.expectGuestSignInRequired();
    },
  );

  test('keeps review submission disabled until all required fields are valid @negative', async ({
    storefront,
  }) => {
    await storefront.openFirstProduct();
    await storefront.expectProductDetailLoaded();
    await expect(storefront.reviewSubmitButton).toBeDisabled();

    await storefront.reviewNameInput.fill('Test Reviewer');
    await storefront.reviewCommentInput.fill('A valid test review comment.');
    await expect(storefront.reviewSubmitButton).toBeDisabled();

    await storefront.selectReviewRating(5);
    await expect(storefront.reviewSubmitButton).toBeEnabled();

    await storefront.reviewNameInput.clear();
    await expect(storefront.reviewSubmitButton).toBeDisabled();
  });

  test('rejects review images larger than 2 MB @negative', async ({ storefront }) => {
    await storefront.openFirstProduct();
    await storefront.expectProductDetailLoaded();
    await storefront.reviewImageInput.setInputFiles({
      name: 'oversized-review.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });

    await expect(storefront.reviewImageError).toBeVisible();
  });

  test('accepts generated review data in the form @happy', async ({ storefront }, testInfo) => {
    const review = createReviewTestData(testInfo.testId);
    await storefront.openFirstProduct();
    await storefront.expectProductDetailLoaded();

    await storefront.reviewNameInput.fill(review.name);
    await storefront.selectReviewRating(review.rating);
    await storefront.reviewCommentInput.fill(review.comment);

    await expect(storefront.reviewSubmitButton).toBeEnabled();
  });

  test(
    'uses generated review data and blocks guest submission',
    { tag: '@negative' },
    async ({ storefront }, testInfo) => {
      const review = createReviewTestData(testInfo.testId);
      await storefront.openFirstProduct();
      await storefront.expectProductDetailLoaded();

      await storefront.reviewNameInput.fill(review.name);
      await storefront.selectReviewRating(review.rating);
      await storefront.reviewCommentInput.fill(review.comment);
      await expect(storefront.reviewSubmitButton).toBeEnabled();
      await storefront.reviewSubmitButton.click();

      await expect(storefront.reviewAuthError).toBeVisible();
    },
  );
});
