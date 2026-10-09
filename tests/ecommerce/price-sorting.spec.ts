import { expect, test } from '../../fixtures/ecommerce-base';

function parseRupeePrice(text: string): number {
  const match = /^\s*₹\s*([\d,]+(?:\.\d{1,2})?)\s*$/u.exec(text);
  expect(
    match,
    `Expected a displayed rupee price, received ${JSON.stringify(text)}`,
  ).not.toBeNull();
  const price = Number(match![1].replaceAll(',', ''));
  expect(Number.isFinite(price), `Price is not finite: ${JSON.stringify(text)}`).toBe(true);
  return price;
}

test.describe(
  'Dress catalog display order',
  { tag: ['@ecommerce', '@regression', '@happy'] },
  () => {
    test('Price: Low to High orders all visible Dress product prices', async ({ storefront }) => {
      // Load every product before sorting so pagination cannot change the price set under comparison.
      await storefront.openRoute('/women/dress');
      await storefront.expectCategoryLoaded('Dress');
      await expect(storefront.productCards.first()).toBeVisible();
      await storefront.loadAllProducts();
      const initialCardCount = await storefront.productCards.count();
      expect(
        initialCardCount,
        'Dress catalog needs at least two visible product cards',
      ).toBeGreaterThanOrEqual(2);
      await expect(storefront.productCardPrices).toHaveCount(initialCardCount);

      const initialPriceTexts = await storefront.productCardPrices.allTextContents();
      const initialPrices = initialPriceTexts.map(parseRupeePrice);
      expect(
        new Set(initialPrices).size,
        'The catalog needs at least two distinct prices',
      ).toBeGreaterThanOrEqual(2);

      await storefront.sortByPriceLowToHigh();
      await expect(storefront.sortSelect).toHaveValue('price-low');
      await expect
        .poll(async () => {
          const prices = (await storefront.productCardPrices.allTextContents()).map(
            parseRupeePrice,
          );
          return prices;
        })
        .toEqual([...initialPrices].sort((left, right) => left - right));
      const sortedCardCount = await storefront.productCards.count();
      const sortedPriceTexts = await storefront.productCardPrices.allTextContents();
      expect(sortedPriceTexts.length, 'Every product card should retain a displayed price').toBe(
        sortedCardCount,
      );
      const sortedPrices = sortedPriceTexts.map(parseRupeePrice);

      for (let index = 1; index < sortedPrices.length; index += 1) {
        expect(
          sortedPrices[index],
          `Card ${index + 1} costs less than card ${index}`,
        ).toBeGreaterThanOrEqual(sortedPrices[index - 1]);
      }

      expect(
        [...sortedPrices].sort((left, right) => left - right),
        'Catalog prices changed during sorting',
      ).toEqual([...initialPrices].sort((left, right) => left - right));
    });
  },
);
