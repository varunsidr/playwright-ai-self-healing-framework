'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateAdditiveLocators,
  validateSelectorRefactor,
  validateRehearsalContract,
} = require('./quality');

test('generation can centralize locators but cannot alter existing interactions or add action helpers', () => {
  const before =
    "class EcommerceStorefrontPage { footer: Locator; async preview() { await this.footer.getByTestId('submit').click(); } }";
  const after = before.replace(
    / }$/,
    " heading() { return this.footer.getByText('Newsletter preview'); } }",
  );
  assert.deepEqual(validateAdditiveLocators(before, after), ['heading']);
  assert.throws(
    () => validateAdditiveLocators(before, after.replace("'submit'", "'other'")),
    /existing page-object/,
  );
  assert.throws(
    () =>
      validateAdditiveLocators(
        before,
        after.replace(
          "return this.footer.getByText('Newsletter preview');",
          "return this.footer.getByText('Newsletter preview').click();",
        ),
      ),
    /locator-returning/,
  );
});

test('a generated rehearsal must retain an exact business result and the observed write-attempt assertion', () => {
  const source =
    "const writes = await blockEcommerceWrites(context); await storefront.submitNewsletterPreview('preview@example.test'); await expect(storefront.newsletterPreviewNotice).toHaveText('No save or send.'); expect(writes).toEqual([]);";
  validateRehearsalContract(source, 'No save or send.');
  assert.throws(
    () =>
      validateRehearsalContract(
        source.replace("'No save or send.'", "'Thanks!'"),
        'No save or send.',
      ),
    /exact notice/,
  );
  assert.throws(
    () =>
      validateRehearsalContract(source.replace('expect(writes)', 'expect([])'), 'No save or send.'),
    /zero attempted writes/,
  );
});

test('selector extraction preserves every existing assertion and rejects weakened expectations', () => {
  const before =
    "await expect(storefront.footer.getByText('Newsletter preview')).toBeVisible(); expect(writes).toEqual([]);";
  const after =
    'await expect(storefront.newsletterPreviewHeading()).toBeVisible(); expect(writes).toEqual([]);';
  validateSelectorRefactor(before, after, ['newsletterPreviewHeading']);
  assert.throws(
    () =>
      validateSelectorRefactor(before, after.replace('toBeVisible()', 'toBeHidden()'), [
        'newsletterPreviewHeading',
      ]),
    /assertions/,
  );
  assert.throws(
    () =>
      validateSelectorRefactor(before, after.replace('expect(writes).toEqual([]);', ''), [
        'newsletterPreviewHeading',
      ]),
    /assertions/,
  );
});
