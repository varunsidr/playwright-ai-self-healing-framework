import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

const footerDestinations = {
  Women: '/women',
  Men: '/men',
  Shoes: '/shoes',
  Bags: '/bags',
  Accessories: '/accessories',
  Perfume: '/perfume',
  Makeup: '/makeup',
  Favorites: '/favorites',
  Privacy: '/privacy',
  Terms: '/terms',
};

test.describe('Zeouf footer and demo information', { tag: ['@ecommerce', '@regression'] }, () => {
  test('TC-CNT-02-CORE footer destinations and information-page return links @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await storefront.openHome();
    for (const [label, href] of Object.entries(footerDestinations)) {
      await expect(storefront.footerLink(label)).toHaveAttribute('href', href);
    }
    const github = storefront.footerLink('GitHub');
    await expect(github).toHaveAttribute('href', 'https://github.com/varunsidr');
    await expect(github).toHaveAttribute('target', '_blank');
    await expect(github).toHaveAttribute('rel', /noopener.*noreferrer/);

    await storefront.footerLink('Privacy').click();
    await expect(storefront.privacyHeading).toBeVisible();
    await storefront.privacyBackToStoreLink.click();
    await storefront.expectUrl(/\/$/);
    await storefront.footerLink('Terms').click();
    await expect(storefront.termsHeading).toBeVisible();
    await expect(storefront.termsOpenSourceHeading).toBeVisible();
    await storefront.termsBackHomeLink.click();
    await storefront.expectUrl(/\/$/);
    expect(attemptedWrites).toEqual([]);
  });

  test('TC-CNT-03-CORE records current demo disclosures without a purchase @happy', async ({
    context,
    storefront,
  }) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await storefront.openHome();
    await expect(storefront.homeDemoNotice).toBeVisible();
    await storefront.openRoute('/checkout');
    await expect(storefront.checkoutHeading).toBeVisible();
    await expect(storefront.checkoutDemoNotice).toBeVisible();
    await expect(storefront.checkoutFictionalNotice).toBeVisible();
    await storefront.openRoute('/privacy');
    await expect(storefront.privacyHeading).toBeVisible();
    await expect(storefront.privacyCartStorageNotice).toBeVisible();
    await expect(storefront.privacyPaymentNotice).toBeVisible();
    await storefront.openRoute('/terms');
    await expect(storefront.termsDemoNotice).toBeVisible();
    expect(attemptedWrites).toEqual([]);
  });
});
