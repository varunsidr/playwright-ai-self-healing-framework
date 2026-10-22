import { readFileSync } from 'node:fs';
import { expect, test as base } from './ecommerce-base';
import { useInrStorefrontRegion } from './ecommerce-browser-cart';
import type { BrowserContext, Route } from '@playwright/test';

export type IsolatedProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
};
type RecordedCall = {
  method: string;
  path: string;
  body: unknown;
  idempotencyKey?: string;
  files?: string[];
};
type Mode = 'success' | 'error' | 'network';
const fixtureHost = 'supabase.co.catalog-fixture.invalid';
export const customerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const secondCustomerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const customer = {
  id: customerId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'browser-fixture@example.invalid',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Fictional Shopper' },
  created_at: '2026-10-01T00:00:00Z',
};
const fixtureCustomer = (id: string) => ({
  ...customer,
  id,
  email: id === customerId ? customer.email : 'second-shopper@example.invalid',
});
const session = (id = customerId) => ({
  access_token: 'isolated-browser-access-token',
  refresh_token: 'isolated-browser-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: fixtureCustomer(id),
});

export type IsolatedShop = {
  products: { sized: IsolatedProduct; soldOut: IsolatedProduct; unsized: IsolatedProduct };
  calls: RecordedCall[];
  reads: URL[];
  checkoutMode: Mode;
  checkoutGate: Promise<void> | null;
  checkoutOrderId: string | null;
  resetMode: 'success' | 'error';
  ordersMode: 'success' | 'error';
  ordersGate: Promise<void> | null;
  reviewMode: Mode;
  uploadMode: Mode | 'limited';
  favoriteMode: Mode;
  restockMode: Mode;
  emailConfigured: boolean;
  helperSuccess: boolean;
  loginFailure: boolean;
  related: IsolatedProduct[];
  stock: { size: string; stock: number }[];
  favorites: Set<string>;
  favoritesByUser: Map<string, Set<string>>;
  loginUserId: string;
  orders: unknown[];
};

/** The runner supplies a fresh local build, fake Supabase host and seeded product identities. */
export const test = base.extend<{ shop: IsolatedShop; signedIn: boolean }>({
  signedIn: [true, { option: true }],
  shop: async ({ context, baseURL, signedIn }, use, testInfo) => {
    const origin = new URL(baseURL!);
    if (
      process.env.ECOMMERCE_ISOLATED_FIXTURES !== 'true' ||
      !['127.0.0.1', 'localhost'].includes(origin.hostname) ||
      !process.env.ECOMMERCE_ISOLATED_PRODUCTS_FILE
    ) {
      throw new Error('Use test:ecommerce:isolated with a disposable Zeouf checkout.');
    }
    const products = JSON.parse(
      readFileSync(process.env.ECOMMERCE_ISOLATED_PRODUCTS_FILE, 'utf8'),
    ) as IsolatedShop['products'];
    const shop: IsolatedShop = {
      products,
      calls: [],
      reads: [],
      checkoutMode: 'success',
      checkoutGate: null,
      checkoutOrderId: 'isolated-order-001',
      resetMode: 'success',
      ordersMode: 'success',
      ordersGate: null,
      reviewMode: 'success',
      uploadMode: 'success',
      favoriteMode: 'success',
      restockMode: 'success',
      emailConfigured: false,
      helperSuccess: false,
      loginFailure: false,
      related: [],
      stock: [
        { size: 'S', stock: 0 },
        { size: 'M', stock: 4 },
        { size: 'L', stock: 5 },
      ],
      favorites: new Set(),
      favoritesByUser: new Map(),
      loginUserId: customerId,
      orders: [],
    };
    shop.favoritesByUser.set(customerId, shop.favorites);
    shop.favoritesByUser.set(secondCustomerId, new Set());
    const unexpected: string[] = [];
    await context.route('**/*', (route) => {
      const request = route.request();
      if (
        new URL(request.url()).hostname === fixtureHost ||
        !['GET', 'HEAD', 'OPTIONS'].includes(request.method())
      ) {
        unexpected.push(request.method() + ' ' + new URL(request.url()).pathname);
        return route.abort();
      }
      return route.fallback();
    });
    await useInrStorefrontRegion(context);
    await context.addInitScript(
      ({ authenticated, savedSession }) => {
        if (sessionStorage.getItem('zeouf-isolated-session-initialized')) return;
        sessionStorage.setItem('zeouf-isolated-session-initialized', '1');
        if (authenticated)
          localStorage.setItem('sb-supabase-auth-token', JSON.stringify(savedSession));
      },
      { authenticated: signedIn, savedSession: session() },
    );
    const record = (route: Route) => {
      let body: unknown = null;
      if (route.request().headers()['content-type']?.includes('application/json'))
        body = route.request().postDataJSON();
      shop.calls.push({
        method: route.request().method(),
        path: new URL(route.request().url()).pathname,
        body,
        ...(route.request().headers()['idempotency-key']
          ? { idempotencyKey: route.request().headers()['idempotency-key'] }
          : {}),
        ...(route.request().headers()['content-type']?.includes('multipart/form-data')
          ? {
              files: [
                ...(route.request().postDataBuffer()?.toString('utf8') || '').matchAll(
                  /filename="([^"]*)"/g,
                ),
              ].map((match) => match[1]),
            }
          : {}),
      });
    };
    const respond = async (
      route: Route,
      mode: Mode,
      json: unknown,
      status = 200,
      gate: Promise<void> | null = null,
    ) => {
      record(route);
      if (gate) await gate;
      if (mode === 'network') return route.abort('failed');
      await route.fulfill({
        status: mode === 'error' ? 503 : status,
        contentType: 'application/json',
        body: JSON.stringify(mode === 'error' ? { error: 'Controlled fixture unavailable' } : json),
      });
    };
    await context.route('https://' + fixtureHost + '/auth/v1/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/user') && route.request().method() === 'GET')
        return route.fulfill({ json: fixtureCustomer(shop.loginUserId) });
      if (url.pathname.endsWith('/token') && url.searchParams.get('grant_type') === 'password') {
        record(route);
        return route.fulfill({
          status: shop.loginFailure ? 400 : 200,
          json: shop.loginFailure
            ? { error: 'invalid_grant', error_description: 'Invalid login credentials' }
            : session(shop.loginUserId),
        });
      }
      if (url.pathname.endsWith('/signup'))
        return respond(route, 'success', { user: customer, session: null });
      if (url.pathname.endsWith('/recover')) {
        record(route);
        return route.fulfill({
          status: shop.resetMode === 'error' ? 400 : 200,
          json: shop.resetMode === 'error' ? { msg: 'Controlled reset rejected' } : {},
        });
      }
      if (url.pathname.endsWith('/logout')) {
        record(route);
        return route.fulfill({ status: 204 });
      }
      return route.fallback();
    });
    await context.route('https://' + fixtureHost + '/rest/v1/**', async (route) => {
      const url = new URL(route.request().url());
      const table = url.pathname.split('/').pop();
      const method = route.request().method();
      if (table === 'favorites' && method !== 'GET') {
        record(route);
        if (shop.favoriteMode === 'error')
          return route.fulfill({ status: 503, json: { message: 'Controlled favorite failure' } });
        const owner =
          method === 'POST'
            ? route.request().postDataJSON().user_id
            : (url.searchParams.get('user_id') || '').replace(/^eq\./, '');
        const favorites = shop.favoritesByUser.get(owner);
        if (!favorites)
          return route.fulfill({ status: 400, json: { message: 'Unknown fixture owner' } });
        if (method === 'POST') favorites.add(route.request().postDataJSON().product_id);
        else if (method === 'DELETE')
          favorites.delete((url.searchParams.get('product_id') || '').replace(/^eq\./, ''));
        else return route.fallback();
        return route.fulfill({ status: method === 'POST' ? 201 : 204 });
      }
      if (method !== 'GET') return route.fallback();
      shop.reads.push(url);
      if (table === 'favorites')
        return route.fulfill({
          json: [
            ...(shop.favoritesByUser.get(
              (url.searchParams.get('user_id') || '').replace(/^eq\./, ''),
            ) || []),
          ].map((product_id) => ({ product_id })),
        });
      if (table === 'orders') {
        if (shop.ordersGate) await shop.ordersGate;
        return route.fulfill(
          shop.ordersMode === 'error'
            ? { status: 503, json: { message: 'Controlled order read unavailable' } }
            : { json: shop.orders },
        );
      }
      if (table === 'product_size_stock') return route.fulfill({ json: shop.stock });
      if (table === 'reviews') return route.fulfill({ json: [] });
      if (table === 'products') {
        const excluded = url.searchParams.get('id')?.replace(/^neq\./, '');
        const limit = Number(url.searchParams.get('limit') || shop.related.length);
        return route.fulfill({
          json: shop.related.filter((product) => product.id !== excluded).slice(0, limit),
        });
      }
      return route.fallback();
    });
    // Every write is fulfilled here. No mock handler calls route.fetch/continue or an upstream API.
    await context.route(origin.origin + '/api/checkout', (route) =>
      respond(
        route,
        shop.checkoutMode,
        { orderId: shop.checkoutOrderId, total: 1000 },
        200,
        shop.checkoutGate,
      ),
    );
    await context.route(origin.origin + '/api/reviews', (route) =>
      respond(route, shop.reviewMode, { status: 'pending' }, 201),
    );
    await context.route(origin.origin + '/api/reviews/upload', (route) => {
      if (shop.uploadMode === 'limited') {
        record(route);
        return route.fulfill({ status: 429, json: { error: 'Daily upload limit reached' } });
      }
      return respond(route, shop.uploadMode, { paths: ['isolated/review.png'] });
    });
    await context.route(origin.origin + '/api/restock-notifications', (route) =>
      respond(route, shop.restockMode, { emailConfigured: shop.emailConfigured }),
    );
    await context.route(origin.origin + '/api/dev/create-user', (route) => {
      record(route);
      return route.fulfill({
        status: shop.helperSuccess ? 200 : 403,
        json: shop.helperSuccess ? { status: 'ok' } : { error: 'Disabled in production fixture' },
      });
    });
    try {
      await use(shop);
    } finally {
      await testInfo.attach('isolated-browser-contracts', {
        body: JSON.stringify(
          { calls: shop.calls, reads: shop.reads.map(String), unexpected },
          null,
          2,
        ),
        contentType: 'application/json',
      });
      await context.unrouteAll({ behavior: 'ignoreErrors' });
      expect(
        unexpected,
        'Every fixture-service request and every write must be handled locally',
      ).toEqual([]);
    }
  },
});

export async function savedBrowserCart(context: BrowserContext) {
  const page = context.pages()[0];
  return page.evaluate(() => JSON.parse(localStorage.getItem('els-cart') || '[]'));
}

/** Explicit release controls a response; tests always release in finally to preserve teardown. */
export function deferBrowserResponse() {
  let release!: () => void;
  const response = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { response, release };
}

export { expect } from '@playwright/test';
