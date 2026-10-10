import { blockEcommerceWrites, expect, test } from '../../fixtures/ecommerce-base';

test.describe('Zeouf header search', { tag: ['@ecommerce', '@regression'] }, () => {
  test(
    'TC-SEA-01-CORE focuses search, ignores blank and encodes nonblank query @negative',
    { annotation: { type: 'zeouf-check', description: 'CHK-SEARCH-INPUT' } },
    async ({ context, storefront }) => {
      const attemptedWrites = await blockEcommerceWrites(context);
      await storefront.openHome();
      await storefront.openSearch();
      await expect(storefront.searchInput).toBeFocused();
      await expect(storefront.searchInput).toHaveValue('');

      await storefront.submitOpenSearch('');
      await storefront.expectUrl(/\/$/);

      await storefront.submitOpenSearch('  silk & café  ');
      await storefront.expectUrl(/\/search\?q=silk%20%26%20caf%C3%A9$/);
      await expect(storefront.searchInput).toBeHidden();
      expect(attemptedWrites).toEqual([]);
    },
  );
});
