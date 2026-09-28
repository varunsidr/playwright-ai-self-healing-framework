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
      // Start in a fresh browser context with no prior session assumptions. Navigate to /kadin/elbise on ECOMMERCE_BASE_URL using project ecommerce-chromium.
      await storefront.openRoute('/kadin/elbise');
      await storefront.expectCategoryLoaded('Dress');
      await expect(storefront.productCards.first()).toBeVisible();
      const initialCardCount = await storefront.productCards.count();
      expect(
        initialCardCount,
        'Dress catalog needs at least two visible product cards',
      ).toBeGreaterThanOrEqual(2);
      await expect(storefront.productCardPrices).toHaveCount(initialCardCount);

      // Read the visible product cards in DOM order and record each card's data-testid=product-card-price text. Parse the displayed rupee amount into a finite number by removing the currency symbol and grouping commas.
      const initialPriceTexts = await storefront.productCardPrices.allTextContents();
      const initialPrices = initialPriceTexts.map(parseRupeePrice);
      expect(
        new Set(initialPrices).size,
        'The catalog needs at least two distinct prices',
      ).toBeGreaterThanOrEqual(2);

      // Select the Price: Low to High option (value price-low) in data-testid=product-listing-sort-select. Wait for the product listing to finish updating, then read all visible data-testid=product-card-price elements in their current card order.
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

      // Compare every adjacent pair of the displayed post-sort numeric prices in DOM order.
      for (let index = 1; index < sortedPrices.length; index += 1) {
        expect(
          sortedPrices[index],
          `Card ${index + 1} costs less than card ${index}`,
        ).toBeGreaterThanOrEqual(sortedPrices[index - 1]);
      }

      // Compare the post-sort multiset of numeric prices with the recorded pre-sort multiset.
      expect(
        [...sortedPrices].sort((left, right) => left - right),
        'Catalog prices changed during sorting',
      ).toEqual([...initialPrices].sort((left, right) => left - right));
    });
  },
);
