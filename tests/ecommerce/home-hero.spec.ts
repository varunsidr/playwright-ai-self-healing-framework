import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf collection hero', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-NAV-001-01 manually switches women and men slides and pauses media @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await storefront.openHome();
    await expect(storefront.heroWomenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.heroWomenLink).toHaveAttribute('href', '/women');
    await storefront.heroMenButton.click();
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.heroMenLink).toHaveAttribute('href', '/men');
    await storefront.heroPauseButton.click();
    await expect(storefront.heroPlayButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.editorialLinks).toHaveCount(6);
    expect(attemptedWrites).toEqual([]);
  });

  test('TC-NAV-001-01 reduced motion keeps manual selection and still poster @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await storefront.useReducedMotion();
    await storefront.openHome();
    await expect(storefront.heroVideo).not.toHaveAttribute('src');
    await expect(storefront.heroPauseButton).toHaveCount(0);
    await storefront.heroMenButton.click();
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.heroVideo).not.toHaveAttribute('src');
    expect(attemptedWrites).toEqual([]);
  });
});
