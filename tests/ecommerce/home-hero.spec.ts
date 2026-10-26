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
    page,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await page.clock.install();
    await storefront.useReducedMotion();
    await storefront.openHome();
    await expect(storefront.heroVideo).not.toHaveAttribute('src');
    await expect(storefront.heroPauseButton).toHaveCount(0);
    await storefront.heroMenButton.click();
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(12000);
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.heroVideo).not.toHaveAttribute('src');
    expect(attemptedWrites).toEqual([]);
  });

  test('TC-NAV-001-01 visible hero rotates automatically and pause resumes from its selected slide @happy', async ({
    page,
    storefront,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install();
    await storefront.openHome();
    await storefront.heroPauseButton.click();
    await storefront.heroWomenButton.click();
    await expect(storefront.heroWomenButton).toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(12000);
    await expect(storefront.heroWomenButton).toHaveAttribute('aria-pressed', 'true');
    expect(await storefront.heroVideo.evaluate((video) => (video as HTMLVideoElement).paused)).toBe(
      true,
    );
    await storefront.heroPlayButton.click();
    await page.clock.runFor(6500);
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.heroMenLink).toHaveAttribute('href', '/men');
    await expect(storefront.heroVideo).toHaveCount(1);
    await storefront.heroPauseButton.click();
    await page.clock.runFor(12000);
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await storefront.heroPlayButton.click();
    await page.clock.runFor(6500);
    await expect(storefront.heroWomenButton).toHaveAttribute('aria-pressed', 'true');
    await expect(storefront.heroWomenLink).toHaveAttribute('href', '/women');
  });

  test('TC-NAV-001-01 offscreen hero stops rotation and resumes after returning into view @happy', async ({
    page,
    storefront,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.clock.install();
    await storefront.openHome();
    await storefront.heroPauseButton.click();
    await storefront.heroMenButton.click();
    await storefront.heroPlayButton.click();
    await storefront.footer.scrollIntoViewIfNeeded();
    await expect(storefront.hero).not.toBeInViewport();
    await expect
      .poll(() => storefront.heroVideo.evaluate((video) => (video as HTMLVideoElement).paused))
      .toBe(true);
    await page.clock.runFor(12000);
    await expect(storefront.heroMenButton).toHaveAttribute('aria-pressed', 'true');
    await storefront.hero.scrollIntoViewIfNeeded();
    await expect(storefront.hero).toBeInViewport({ ratio: 0.1 });
    await page.clock.runFor(6500);
    await expect(storefront.heroWomenButton).toHaveAttribute('aria-pressed', 'true');
  });
});
