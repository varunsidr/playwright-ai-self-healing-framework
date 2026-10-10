import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe(
  'Zeouf keyboard and mobile navigation',
  { tag: ['@ecommerce', '@regression'] },
  () => {
    for (const kind of ['account', 'cart', 'search', 'mobile'] as const) {
      test(`TC-NAV-005-01 ${kind} contains focus, closes with Escape and restores trigger @happy`, async ({
        context,
        page,
        storefront,
      }) => {
        const writes = await blockEcommerceWrites(context);
        if (kind === 'mobile') await page.setViewportSize({ width: 375, height: 900 });
        await storefront.openHome();
        const trigger = storefront.navigationTrigger(kind);
        const dialog = storefront.navigationDialog(kind);
        await trigger.focus();
        await trigger.press('Enter');
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await storefront.expectDialogFocusContained(kind);
        await storefront.expectPageScrollLocked(true);
        await storefront.focusDialogEdge(kind, 'last');
        await page.keyboard.press('Tab');
        await storefront.expectDialogEdgeFocused(kind, 'first');
        await page.keyboard.press('Shift+Tab');
        await storefront.expectDialogEdgeFocused(kind, 'last');
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
        await storefront.expectPageScrollLocked(false);
        if (kind === 'search') {
          await expect(dialog).toHaveCount(0);
        } else {
          await expect.poll(() => dialog.evaluate((el) => (el as HTMLElement).inert)).toBe(true);
        }
        expect(writes).toEqual([]);
      });
    }

    for (const group of ['women', 'men'] as const) {
      test(
        `TC-NAV-005-01 desktop ${group} disclosure supports keyboard, hover and inert closure @happy`,
        {
          annotation: {
            type: 'zeouf-check',
            description: `CHK-NAV-DESKTOP-${group.toUpperCase()}`,
          },
        },
        async ({ context, page, storefront }) => {
          const writes = await blockEcommerceWrites(context);
          await page.setViewportSize({ width: 1440, height: 900 });
          await storefront.openHome();
          const trigger = storefront.desktopCategoryTrigger(group);
          const panel = storefront.desktopCategoryPanel(group);
          await expect(trigger).toHaveAttribute('aria-expanded', 'false');
          await expect.poll(() => panel.evaluate((el) => (el as HTMLElement).inert)).toBe(true);
          await trigger.focus();
          await trigger.press('Enter');
          await expect(trigger).toHaveAttribute('aria-expanded', 'true');
          const category = storefront.desktopCategoryLink(
            group,
            group === 'women' ? 'Dress' : 'Suit',
          );
          await expect(category).toHaveAttribute(
            'href',
            group === 'women' ? '/women/dress' : '/men/suits',
          );
          await category.focus();
          await page.keyboard.press('Escape');
          await expect(trigger).toHaveAttribute('aria-expanded', 'false');
          await expect.poll(() => panel.evaluate((el) => (el as HTMLElement).inert)).toBe(true);
          await expect(trigger).toBeFocused();
          await trigger.hover();
          await expect(trigger).toHaveAttribute('aria-expanded', 'true');
          expect(writes).toEqual([]);
        },
      );
    }

    for (const group of ['women', 'men'] as const) {
      test(`TC-NAV-005-01 mobile ${group} clothing expands and closes after navigation @happy`, async ({
        context,
        page,
        storefront,
      }) => {
        const writes = await blockEcommerceWrites(context);
        await page.setViewportSize({ width: 375, height: 900 });
        await storefront.openHome();
        await storefront.mobileMenuToggle.click();
        const categoryRoutes = {
          WOMEN: '/women',
          MEN: '/men',
          PERFUME: '/perfume',
          SHOES: '/shoes',
          ACCESSORIES: '/accessories',
          BAGS: '/bags',
          MAKEUP: '/makeup',
        };
        for (const [name, route] of Object.entries(categoryRoutes)) {
          await expect(storefront.mobileCategoryLink(name)).toHaveAttribute('href', route);
        }
        const summary = storefront.mobileGroupSummary(group);
        await summary.focus();
        await summary.press('Enter');
        const category = storefront.mobileCategoryLink(group === 'women' ? 'Dress' : 'Suit');
        await expect(category).toBeVisible();
        await category.click();
        await storefront.expectUrl(group === 'women' ? /\/women\/dress$/ : /\/men\/suits$/);
        await expect
          .poll(() =>
            storefront.navigationDialog('mobile').evaluate((el) => (el as HTMLElement).inert),
          )
          .toBe(true);
        await storefront.expectCategoryLoaded(group === 'women' ? 'Dress' : 'Suit');
        await storefront.expectPageScrollLocked(false);
        expect(writes).toEqual([]);
      });
    }

    for (const width of [375, 768, 1440]) {
      test(`TC-NFR-04-CORE home and open bag fit ${width}px Chromium viewport @happy`, async ({
        context,
        page,
        storefront,
      }) => {
        const writes = await blockEcommerceWrites(context);
        await page.setViewportSize({ width, height: 900 });
        await storefront.useReducedMotion();
        await storefront.openHome();
        await storefront.expectHomeLoaded();
        await storefront.expectNoHorizontalOverflow();
        await storefront.openCart();
        await expect(storefront.navigationDialog('cart')).toBeInViewport();
        await storefront.expectNoHorizontalOverflow();
        await expect(storefront.startShoppingButton).toBeInViewport();
        expect(writes).toEqual([]);
      });
    }
  },
);
