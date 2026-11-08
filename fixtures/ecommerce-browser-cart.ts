import type { BrowserContext } from '@playwright/test';

type BrowserCartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  size: string | null;
  color: string | null;
  quantity: number;
};

export const browserCartOwnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const browserCartKey = (ownerId = browserCartOwnerId) =>
  'els-cart:' + encodeURIComponent(ownerId);

/** Seed fictional, browser-local cart data once per tab; navigation keeps subsequent edits. */
export async function seedBrowserCart(
  context: BrowserContext,
  items: BrowserCartItem[],
  ownerId = browserCartOwnerId,
) {
  await seedRawBrowserCart(context, JSON.stringify(items), ownerId);
}

/** Seed once, so a reload tests application persistence rather than reapplying a fixture. */
export async function seedRawBrowserCart(
  context: BrowserContext,
  value: string,
  ownerId: string | null = browserCartOwnerId,
) {
  await context.addInitScript(
    ({ savedValue, key }) => {
      const marker = 'zeouf-playwright-cart-seeded:' + key;
      if (window.sessionStorage.getItem(marker)) return;
      window.localStorage.setItem(key, savedValue);
      window.sessionStorage.setItem(marker, '1');
    },
    { savedValue: value, key: ownerId === null ? 'els-cart' : browserCartKey(ownerId) },
  );
}

/** Limit fault injection to the cart key; session/auth storage continues normally. */
export async function failBrowserCartStorage(
  context: BrowserContext,
  failure: 'read' | 'write',
  initialCart?: string,
) {
  await context.addInitScript(
    ({ fault, savedCart, key: cartKey }) => {
      // Seed and patch within one script; ordering among separate init scripts is unspecified.
      if (
        savedCart !== undefined &&
        !window.sessionStorage.getItem('zeouf-playwright-cart-seeded')
      ) {
        window.localStorage.setItem(cartKey, savedCart);
        window.sessionStorage.setItem('zeouf-playwright-cart-seeded', '1');
      }
      const method = fault === 'read' ? 'getItem' : 'setItem';
      const original = Storage.prototype[method];
      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        value: function (this: Storage, key: string, value?: string) {
          if (this === window.localStorage && key === cartKey) {
            throw new DOMException(
              'Controlled cart storage failure',
              fault === 'read' ? 'SecurityError' : 'QuotaExceededError',
            );
          }
          return Reflect.apply(original, this, fault === 'read' ? [key] : [key, value]);
        },
      });
    },
    { fault: failure, savedCart: initialCart, key: browserCartKey() },
  );
}

/** Keep currency assertions deterministic without changing any server-side state. */
export async function useInrStorefrontRegion(context: BrowserContext) {
  await context.route(/\/api\/storefront\/region\?/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ country: 'IN', currency: 'INR', rate: 1, rateDate: null }),
    }),
  );
}

export const fictionalCartVariants: BrowserCartItem[] = [
  {
    id: 'playwright-local-cart-item',
    name: 'Playwright Browser Cart Item',
    price: 1000,
    image_url: '/kadin-product-1.jpg',
    category: 'Women',
    size: 'S',
    color: 'Blue',
    quantity: 2,
  },
  {
    id: 'playwright-local-cart-item',
    name: 'Playwright Browser Cart Item',
    price: 1000,
    image_url: '/kadin-product-1.jpg',
    category: 'Women',
    size: 'M',
    color: 'Blue',
    quantity: 1,
  },
];
