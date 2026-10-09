import type { Route } from '@playwright/test';
import { blockEcommerceWrites, expect, test as base } from './ecommerce-base';
import { useInrStorefrontRegion } from './ecommerce-browser-cart';

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string | null;
  image_url: string;
  stock: number;
  sizes: string[];
  images: string[];
  color_options: never[];
  tag: string | null;
  created_at: string;
};

export function catalogProducts(count: number): CatalogProduct[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `90000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    name: `Fixture Dress ${String(index + 1).padStart(2, '0')}`,
    price: (index + 1) * 1000,
    category: "Women's Dress",
    brand: index % 2 ? 'Brand B' : 'Brand A',
    image_url: '/kadin-product-1.jpg',
    stock: index % 2 ? 0 : 4,
    sizes: [],
    images: [],
    color_options: [],
    tag: index % 2 ? 'New' : null,
    created_at: '2026-10-01T00:00:00Z',
  }));
}

type ResponseMode = 'success' | 'error' | 'pending';
type CatalogFixture = {
  products: CatalogProduct[];
  stock: { product_id: string; size: string; stock: number }[];
  productMode: ResponseMode;
  stockMode: ResponseMode;
  queries: URLSearchParams[];
  abortedReads: string[];
  release: () => void;
};

/** Mock only observed read contracts; never create products or call test helpers. */
export const test = base.extend<{ catalog: CatalogFixture }>({
  catalog: async ({ context }, use) => {
    const attemptedWrites = await blockEcommerceWrites(context);
    await useInrStorefrontRegion(context);
    const held: (() => void)[] = [];
    const catalog: CatalogFixture = {
      products: catalogProducts(4),
      stock: [],
      productMode: 'success',
      stockMode: 'success',
      queries: [],
      abortedReads: [],
      release: () => held.splice(0).forEach((resolve) => resolve()),
    };
    const failedRequest = (request: import('@playwright/test').Request) => {
      if (request.url().includes('/rest/v1/')) catalog.abortedReads.push(request.url());
    };
    context.on('requestfailed', failedRequest);
    const respond = async (route: Route, table: 'products' | 'stock') => {
      if (route.request().method() !== 'GET') return route.fallback();
      const query = new URL(route.request().url()).searchParams;
      if (table === 'products') catalog.queries.push(query);
      const mode = table === 'products' ? catalog.productMode : catalog.stockMode;
      if (mode === 'pending') await new Promise<void>((resolve) => held.push(resolve));
      if (mode === 'error') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Controlled fixture unavailable' }),
        });
        return;
      }
      const data =
        table === 'stock'
          ? catalog.stock
          : catalog.products.filter((product) =>
              (['name', 'category'] as const).every((field) => {
                const filter = query.get(field);
                if (!filter?.startsWith('ilike.')) return true;
                const needle = filter.slice(6).replaceAll('%', '').toLowerCase();
                return product[field].toLowerCase().includes(needle);
              }),
            );
      // Abandoned reads may already have been cancelled by the application deadline.
      try {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(data),
        });
      } catch (error) {
        if (!/closed|cancel|abort|Invalid InterceptionId/i.test(String(error))) throw error;
      }
    };
    await context.route('**/rest/v1/products?*', (route) => respond(route, 'products'));
    await context.route('**/rest/v1/product_size_stock?*', (route) => respond(route, 'stock'));
    try {
      await use(catalog);
    } finally {
      catalog.release();
      await context.unrouteAll({ behavior: 'ignoreErrors' });
      context.off('requestfailed', failedRequest);
      expect(attemptedWrites, 'Fixture tests must not attempt server writes').toEqual([]);
    }
  },
});
