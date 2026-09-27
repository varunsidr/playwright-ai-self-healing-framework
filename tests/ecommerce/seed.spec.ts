import { test } from '../../fixtures/ecommerce-base';

test('ecommerce product detail seed', async ({ storefront }) => {
  await storefront.openFirstProduct();
  await storefront.expectProductDetailLoaded();
});
