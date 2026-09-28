import { test } from '../../fixtures/ecommerce-base';

test('zeouf storefront seed @ecommerce @smoke', async ({ storefront }) => {
  await storefront.openHome();
  await storefront.expectHomeLoaded();
});
