import { test } from '../../../fixtures/ecommerce-isolated';
import { expect } from '../../../fixtures/ecommerce-base';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=',
  'base64',
);

test.describe('Zeouf isolated review feedback', { tag: ['@ecommerce', '@regression'] }, () => {
  test.beforeEach(async ({ storefront, shop }) => {
    await storefront.openProductRoute('/women/' + shop.products.sized.id, shop.products.sized.name);
    await storefront.reviewField('name').fill('Fictional Reviewer');
    await storefront.reviewRating(4).click();
    await storefront.reviewField('comment').fill('Fictional browser-only review.');
  });

  for (const scenario of [
    'upload error',
    'review error',
    'review network',
    'success without image',
    'success with image',
  ]) {
    test(
      'TC-REV-003-01 ' + scenario + ' preserves or clears the form accurately',
      async ({ storefront, shop }) => {
        const withImage = !scenario.endsWith('without image');
        if (withImage)
          await storefront
            .reviewImages()
            .setInputFiles({ name: 'review.png', mimeType: 'image/png', buffer: png });
        if (scenario === 'upload error') shop.uploadMode = 'error';
        if (scenario === 'review error') shop.reviewMode = 'error';
        if (scenario === 'review network') shop.reviewMode = 'network';
        const success = scenario.startsWith('success');
        await storefront.reviewSubmitButton.click();
        if (success) {
          await expect(storefront.reviewSubmitButton).toHaveText('Submitted for approval');
          await expect(storefront.reviewField('name')).toHaveValue('');
          await expect(storefront.reviewField('comment')).toHaveValue('');
          await expect(storefront.reviewImagePreviews()).toHaveCount(0);
          const reviewCall = shop.calls.find((call) => call.path === '/api/reviews');
          expect(reviewCall?.body).toMatchObject({
            productId: shop.products.sized.id,
            rating: 4,
            comment: 'Fictional browser-only review.',
            images: withImage ? ['isolated/review.png'] : null,
          });
        } else {
          await expect(
            storefront.visibleText(
              scenario === 'review network' ? 'Failed to fetch' : 'Controlled fixture unavailable',
            ),
          ).toBeVisible();
          await expect(storefront.reviewField('name')).toHaveValue('Fictional Reviewer');
          await expect(storefront.reviewField('comment')).toHaveValue(
            'Fictional browser-only review.',
          );
          await expect(storefront.reviewImagePreviews()).toHaveCount(1);
          await expect(storefront.reviewSubmitButton).toBeEnabled();
          if (scenario === 'upload error')
            expect(shop.calls.filter((call) => call.path === '/api/reviews')).toEqual([]);
        }
        await expect(storefront.publicReviewItems()).toHaveCount(0);
        await expect(
          storefront.visibleText('No reviews yet. Be the first to leave one.'),
        ).toBeVisible();
        const read = shop.reads.find((url) => url.pathname.endsWith('/reviews'));
        expect(read?.searchParams.get('approved')).toBe('eq.true');
      },
    );
  }

  test('TC-REV-002-01 oversized image is rejected before upload', async ({ storefront, shop }) => {
    await storefront.reviewImages().setInputFiles({
      name: 'oversized.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });
    await expect(storefront.visibleText('Each image must be <= 2MB')).toBeVisible();
    await expect(storefront.reviewImagePreviews()).toHaveCount(0);
    expect(shop.calls.filter((call) => call.path === '/api/reviews/upload')).toEqual([]);
  });

  test('TC-REV-002-01 four selected images cap at three and removal excludes its file from upload', async ({
    storefront,
    shop,
  }) => {
    await storefront.reviewImages().setInputFiles(
      ['first.png', 'removed.png', 'third.png', 'fourth.png'].map((name) => ({
        name,
        mimeType: 'image/png',
        buffer: png,
      })),
    );
    await expect(storefront.reviewImagePreviews()).toHaveCount(3);
    await storefront.reviewRemovePreview(1).click();
    await expect(storefront.reviewImagePreviews()).toHaveCount(2);
    expect(shop.calls).toEqual([]);
    await storefront.reviewSubmitButton.click();
    await expect(storefront.reviewSubmitButton).toHaveText('Submitted for approval');
    expect(shop.calls.find((call) => call.path === '/api/reviews/upload')?.files).toEqual([
      'first.png',
      'third.png',
    ]);
    await expect(storefront.reviewImagePreviews()).toHaveCount(0);
    await expect(storefront.publicReviewItems()).toHaveCount(0);
  });

  test('TC-REV-002-01 oversized selection retains only valid preview and removal sends no upload', async ({
    storefront,
    shop,
  }) => {
    await storefront.reviewImages().setInputFiles([
      { name: 'oversized.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) },
      { name: 'valid.png', mimeType: 'image/png', buffer: png },
    ]);
    await expect(storefront.visibleText('Each image must be <= 2MB')).toBeVisible();
    await expect(storefront.reviewImagePreviews()).toHaveCount(1);
    await storefront.reviewRemovePreview(0).click();
    await expect(storefront.reviewImagePreviews()).toHaveCount(0);
    expect(shop.calls).toEqual([]);
  });

  test('TC-REV-002-02 upload limit response retains review without claiming submission', async ({
    storefront,
    shop,
  }) => {
    shop.uploadMode = 'limited';
    await storefront
      .reviewImages()
      .setInputFiles({ name: 'review.png', mimeType: 'image/png', buffer: png });
    await storefront.reviewSubmitButton.click();
    await expect(storefront.visibleText('Daily upload limit reached')).toBeVisible();
    await expect(storefront.reviewField('name')).toHaveValue('Fictional Reviewer');
    await expect(storefront.reviewField('comment')).toHaveValue('Fictional browser-only review.');
    await expect(storefront.reviewImagePreviews()).toHaveCount(1);
    await expect(storefront.reviewSubmitButton).toBeEnabled();
    await expect(storefront.reviewSubmitButton).not.toHaveText('Submitted for approval');
    await expect(storefront.publicReviewItems()).toHaveCount(0);
    expect(shop.calls.filter((call) => call.path === '/api/reviews')).toEqual([]);
    expect(shop.calls.filter((call) => call.path === '/api/reviews/upload')).toHaveLength(1);
  });
});

test.describe('Zeouf isolated restock feedback', { tag: ['@ecommerce', '@regression'] }, () => {
  test.use({ signedIn: false });
  test.beforeEach(async ({ storefront, shop }) => {
    shop.stock = [
      { size: 'S', stock: 0 },
      { size: 'M', stock: 0 },
      { size: 'L', stock: 0 },
    ];
    await storefront.openProductRoute(
      '/women/' + shop.products.soldOut.id,
      shop.products.soldOut.name,
    );
    await expect(storefront.addToCartButton).toBeDisabled();
    await expect(storefront.restockEmail()).toBeVisible();
  });

  test('TC-RST-01-CORE invalid email prevents a request', async ({ storefront, shop }) => {
    await storefront.restockEmail().fill('invalid-email');
    await storefront.restockSubmit().click();
    await expect(storefront.restockEmail()).toBeFocused();
    expect(
      await storefront
        .restockEmail()
        .evaluate((element) => (element as HTMLInputElement).validity.typeMismatch),
    ).toBe(true);
    expect(shop.calls.filter((call) => call.path === '/api/restock-notifications')).toEqual([]);
  });

  for (const configured of [false, true]) {
    test(
      'TC-RST-03-CORE email configuration ' + configured + ' selects accurate feedback',
      async ({ storefront, shop }) => {
        shop.emailConfigured = configured;
        await storefront.restockEmail().fill('restock-fixture@example.invalid');
        await storefront.restockSubmit().click();
        await expect(storefront.restockStatus()).toHaveText(
          configured
            ? "You're on the list. We'll email you when it's available."
            : 'Your request is saved. Email alerts need to be enabled by the store first.',
        );
        await expect(storefront.restockEmail()).toHaveValue('');
        expect(shop.calls.find((call) => call.path === '/api/restock-notifications')?.body).toEqual(
          {
            productId: shop.products.soldOut.id,
            email: 'restock-fixture@example.invalid',
            size: null,
            color: null,
          },
        );
      },
    );
  }

  for (const mode of ['error', 'network'] as const) {
    test(
      'TC-RST-01-CORE ' + mode + ' preserves email and enables retry',
      async ({ storefront, shop }) => {
        shop.restockMode = mode;
        await storefront.restockEmail().fill('restock-fixture@example.invalid');
        await storefront.restockSubmit().click();
        await expect(storefront.restockStatus()).toHaveText(
          mode === 'error' ? 'Controlled fixture unavailable' : 'Failed to fetch',
        );
        await expect(storefront.restockEmail()).toHaveValue('restock-fixture@example.invalid');
        await expect(storefront.restockSubmit()).toBeEnabled();
        shop.restockMode = 'success';
        await storefront.restockSubmit().click();
        await expect(storefront.restockStatus()).toContainText('Your request is saved.');
        expect(
          shop.calls.filter((call) => call.path === '/api/restock-notifications'),
        ).toHaveLength(2);
      },
    );
  }
});
