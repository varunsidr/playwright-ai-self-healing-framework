import { expect } from '../../../fixtures/ecommerce-base';
import { adminWrites, test } from '../../../fixtures/ecommerce-isolated-admin';

test.describe(
  'Zeouf isolated admin sign-in feedback',
  { tag: ['@ecommerce', '@regression'] },
  () => {
    test.use({ adminSession: false });
    test.beforeEach(async ({ storefront, admin }) => {
      expect(admin.reads).toEqual([]);
      await storefront.openRoute('/admin');
      await expect(storefront.adminLoginHeading).toBeVisible();
    });

    test('TC-ADM-001-01 both credentials are needed before sign-in can be submitted', async ({
      storefront,
      shop,
    }) => {
      await expect(storefront.adminLoginSubmit).toBeDisabled();
      await storefront.adminUsername().fill('fictional-admin');
      await expect(storefront.adminLoginSubmit).toBeDisabled();
      await storefront.adminPassword.fill('Fictional-admin-password!');
      await expect(storefront.adminLoginSubmit).toBeEnabled();
      await storefront.adminUsername().fill('');
      await expect(storefront.adminLoginSubmit).toBeDisabled();
      expect(adminWrites(shop, '/api/admin/login')).toEqual([]);
    });

    for (const status of [401, 429, 500]) {
      test(
        'TC-ADM-001-01 response ' +
          status +
          ' gives accurate feedback without a local admin session',
        async ({ storefront, admin, shop, page }) => {
          admin.loginStatus = status;
          await storefront.adminUsername().fill('fictional-admin');
          await storefront.adminPassword.fill('Fictional-admin-password!');
          await storefront.adminLoginSubmit.click();
          await expect(storefront.adminLoginError).toContainText(
            status === 429 ? 'Too many attempts' : status === 500 ? 'not configured' : 'didn',
          );
          await expect(storefront.adminPassword).toHaveValue('');
          await expect(storefront.adminUsername()).toHaveValue('fictional-admin');
          expect(await page.evaluate(() => localStorage.getItem('admin_auth'))).toBeNull();
          expect(adminWrites(shop, '/api/admin/login')[0].body).toEqual({
            username: 'fictional-admin',
            password: 'Fictional-admin-password!',
          });
        },
      );
    }
  },
);

test('TC-ADM-003-01 logout failure retains local state and explicit retry clears it', async ({
  storefront,
  admin,
  shop,
  page,
}) => {
  admin.logoutMode = 'error';
  await storefront.openRoute('/admin/settings');
  await expect(storefront.visibleText('3 products across 2 categories')).toBeVisible();
  await storefront.adminLogout().click();
  await expect(storefront.visibleText('Could not sign out. Please try again.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('admin_auth'))).toBe('1');
  await storefront.expectUrl(/\/admin\/settings$/);
  await expect(storefront.adminLogout()).toBeEnabled();
  admin.logoutMode = 'success';
  await storefront.adminLogout().click();
  await storefront.expectUrl(/\/admin$/);
  await expect(storefront.adminLoginHeading).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('admin_auth'))).toBeNull();
  expect(adminWrites(shop, '/api/admin/logout').map((call) => call.method)).toEqual([
    'POST',
    'POST',
  ]);
});

test('TC-REV-006-01 admin review response renders approved and pending feedback without moderation buttons', async ({
  storefront,
  admin,
  shop,
}) => {
  await storefront.openAdminSidebarSection('Reviews');
  await expect(storefront.visibleText('Approved fictional feedback')).toBeVisible();
  await expect(storefront.visibleText('Pending fictional feedback')).toBeVisible();
  await expect(storefront.visibleText('2 reviews')).toBeVisible();
  await expect(storefront.adminMainButtons()).toHaveCount(0);
  expect(
    admin.reads.find((url) => url.pathname === '/api/admin/reviews')?.searchParams.get('status'),
  ).toBe('all');
  expect(shop.calls).toEqual([]);
});

test('TC-REV-006-01 failed admin review read reports the service error', async ({
  storefront,
  admin,
  shop,
}) => {
  admin.reviewsMode = 'error';
  await storefront.openAdminSidebarSection('Reviews');
  await expect(storefront.visibleText('Controlled admin service unavailable')).toBeVisible();
  await expect(storefront.visibleText('Approved fictional feedback')).toHaveCount(0);
  expect(shop.calls).toEqual([]);
});

test('TC-ADM-002-01 local browser flag cannot authorize the real isolated order or stock endpoints', async ({
  storefront,
  admin,
  page,
  request,
}) => {
  // APIRequestContext bypasses browser response mocks. Only the fresh placeholder server is contacted.
  expect(admin.products).toHaveLength(3);
  await storefront.openRoute('/admin/settings');
  expect(await page.evaluate(() => localStorage.getItem('admin_auth'))).toBe('1');
  const orders = await request.get('/api/admin/orders', { headers: { Cookie: 'admin_auth=1' } });
  expect(orders.status()).toBe(401);
  const stock = await request.patch('/api/admin/stock', {
    headers: { Cookie: 'admin_auth=1' },
    data: { productId: '10000000-0000-4000-8000-000000000001', size: null, stock: 1 },
  });
  expect(stock.status()).toBe(401);
});
