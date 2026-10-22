import { test as base, type IsolatedShop } from './ecommerce-isolated';
import type { Route } from '@playwright/test';

type Mode = 'success' | 'error' | 'network';
export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  images: string[];
  description: string;
  sizes: string[];
  created_at: string;
  product_size_stock: { id: string; product_id: string; size: string; stock: number }[];
};
export type AdminOrder = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  placed_at: string;
  order_items: { id: string; product_id: string; quantity: number; unit_price: number }[];
};
type AdminReview = {
  id: string;
  product_id: string;
  name: string;
  comment: string;
  rating: number;
  approved: boolean;
  created_at: string;
  admin_reply: null;
};
type AdminProfile = { id: string; full_name: string | null; updated_at: string | null };

export function adminProducts(): AdminProduct[] {
  return [
    { name: 'Studio Dress New', category: "Women's Dress", created_at: '2026-10-20T12:00:00Z' },
    { name: 'Studio Shirt', category: "Men's Shirt", created_at: '2026-10-19T12:00:00Z' },
    { name: 'Studio Dress Classic', category: "Women's Dress", created_at: '2026-10-18T12:00:00Z' },
  ].map((product, index) => ({
    ...product,
    id: '10000000-0000-4000-8000-' + String(index + 1).padStart(12, '0'),
    price: (index + 1) * 1000,
    stock: 5,
    image_url: '/kadin-product-1.jpg',
    images: ['/kadin-product-1.jpg'],
    description: 'Fictional browser fixture',
    sizes: [],
    product_size_stock: [],
  }));
}

export function stockBoundaryProducts(): AdminProduct[] {
  return [0, 1, 4, 5].map((stock, index) => {
    const product = {
      ...adminProducts()[0],
      id: 'stock-' + index,
      name: 'Stock Boundary ' + stock,
      stock,
      sizes: ['S'],
    };
    return {
      ...product,
      product_size_stock: [{ id: product.id + '-S', product_id: product.id, size: 'S', stock }],
    };
  });
}

export type AdminFixture = {
  products: AdminProduct[];
  orders: AdminOrder[];
  reviews: AdminReview[];
  profiles: AdminProfile[];
  reads: URL[];
  readGates: Partial<Record<'products' | 'orders' | 'reviews', Promise<void>>>;
  catalogMode: Mode;
  ordersMode: Mode;
  reviewsMode: Mode;
  saveMode: Mode;
  deleteMode: Mode;
  statusMode: Mode;
  stockMode: Mode;
  logoutMode: Mode;
  loginStatus: number;
};

/** Local admin flag enables UI rendering only; every admin service response below is fictional. */
export const test = base.extend<{ admin: AdminFixture; adminSession: boolean }>({
  adminSession: [true, { option: true }],
  admin: async ({ context, baseURL, shop, adminSession }, use, testInfo) => {
    const admin: AdminFixture = {
      products: adminProducts(),
      orders: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'pending'].map(
        (status, index) => ({
          id: 'ORDER00' + (index + 1) + '-fixture',
          user_id: index % 2 ? 'customer-Beta' : 'customer-Alpha',
          total: (index + 1) * 1000,
          status,
          placed_at: '2026-10-20T12:00:00Z',
          order_items: [],
        }),
      ),
      reviews: [true, false].map((approved, index) => ({
        id: 'review-' + index,
        product_id: shop.products.sized.id,
        name: approved ? 'Approved Reviewer' : 'Pending Reviewer',
        comment: approved ? 'Approved fictional feedback' : 'Pending fictional feedback',
        rating: approved ? 4 : 2,
        approved,
        created_at: '2026-10-20T12:00:00Z',
        admin_reply: null,
      })),
      profiles: [
        {
          id: 'profile-new',
          full_name: 'Fictional New Shopper',
          updated_at: '2026-10-20T12:00:00Z',
        },
        { id: 'profile-no-name', full_name: null, updated_at: null },
      ],
      reads: [],
      readGates: {},
      catalogMode: 'success',
      ordersMode: 'success',
      reviewsMode: 'success',
      saveMode: 'success',
      deleteMode: 'success',
      statusMode: 'success',
      stockMode: 'success',
      logoutMode: 'success',
      loginStatus: 401,
    };
    await context.addInitScript((enabled) => {
      if (sessionStorage.getItem('zeouf-isolated-admin-initialized')) return;
      sessionStorage.setItem('zeouf-isolated-admin-initialized', '1');
      if (enabled) localStorage.setItem('admin_auth', '1');
    }, adminSession);
    const record = (route: Route) =>
      shop.calls.push({
        method: route.request().method(),
        path: new URL(route.request().url()).pathname,
        body: route.request().headers()['content-type']?.includes('application/json')
          ? route.request().postDataJSON()
          : null,
      });
    const reply = async (route: Route, mode: Mode, data: unknown, status = 200) => {
      if (mode === 'network') return route.abort('failed');
      return route.fulfill({
        status: mode === 'error' ? 503 : status,
        json: mode === 'error' ? { error: 'Controlled admin service unavailable' } : data,
      });
    };
    await context.route(new URL(baseURL!).origin + '/api/admin/**', async (route) => {
      const url = new URL(route.request().url());
      const method = route.request().method();
      if (method === 'GET') {
        admin.reads.push(url);
        const resource = url.pathname.split('/').pop() as keyof AdminFixture['readGates'];
        if (admin.readGates[resource]) await admin.readGates[resource];
        if (url.pathname === '/api/admin/products')
          return reply(route, admin.catalogMode, { products: admin.products });
        if (url.pathname === '/api/admin/orders')
          return reply(route, admin.ordersMode, { orders: admin.orders });
        if (url.pathname === '/api/admin/reviews')
          return reply(route, admin.reviewsMode, { reviews: admin.reviews });
        if (url.pathname === '/api/admin/users')
          return reply(route, 'success', { users: admin.profiles });
        return route.fallback();
      }
      if (url.pathname === '/api/admin/logout' && method === 'POST') {
        record(route);
        return reply(route, admin.logoutMode, { status: 'ok' });
      }
      if (url.pathname === '/api/admin/login' && method === 'POST') {
        record(route);
        return route.fulfill({
          status: admin.loginStatus,
          json: { error: 'Controlled admin login denial' },
        });
      }
      if (url.pathname === '/api/admin/orders' && method === 'PATCH') {
        record(route);
        if (admin.statusMode !== 'success') return reply(route, admin.statusMode, {});
        const body = route.request().postDataJSON();
        admin.orders = admin.orders.map((order) =>
          order.id === body.id ? { ...order, status: body.status } : order,
        );
        return reply(route, 'success', { status: 'ok' });
      }
      if (url.pathname === '/api/admin/stock' && method === 'PATCH') {
        record(route);
        if (admin.stockMode !== 'success') return reply(route, admin.stockMode, {});
        const body = route.request().postDataJSON();
        const product = admin.products.find((item) => item.id === body.productId)!;
        const row = product.product_size_stock.find((item) => item.size === body.size)!;
        row.stock = body.stock;
        product.stock = product.product_size_stock.reduce((sum, item) => sum + item.stock, 0);
        return reply(route, 'success', { stock: product.stock });
      }
      if (url.pathname === '/api/admin/restock-alerts/notify' && method === 'POST') {
        record(route);
        return reply(route, 'success', { sent: 0 });
      }
      if (/^\/api\/admin\/products(?:\/[^/]+)?$/.test(url.pathname)) {
        if (!['POST', 'PATCH', 'DELETE'].includes(method)) return route.fallback();
        record(route);
        if (method === 'DELETE') {
          if (admin.deleteMode !== 'success') return reply(route, admin.deleteMode, {});
          admin.products = admin.products.filter(
            (product) => product.id !== url.pathname.split('/').pop(),
          );
          return reply(route, 'success', { status: 'ok' });
        }
        if (admin.saveMode !== 'success') return reply(route, admin.saveMode, {});
        const body = route.request().postDataJSON() as Partial<AdminProduct>;
        const id =
          method === 'POST'
            ? '10000000-0000-4000-8000-000000000099'
            : url.pathname.split('/').pop()!;
        const product = { ...adminProducts()[0], ...body, id };
        admin.products = [product, ...admin.products.filter((existing) => existing.id !== id)];
        return reply(route, 'success', { product });
      }
      return route.fallback();
    });
    try {
      await use(admin);
    } finally {
      await testInfo.attach('isolated-admin-contracts', {
        body: JSON.stringify({ reads: admin.reads.map(String), calls: shop.calls }, null, 2),
        contentType: 'application/json',
      });
    }
  },
});

export function adminWrites(shop: IsolatedShop, path: string) {
  return shop.calls.filter((call) => call.path === path);
}
