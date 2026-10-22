import { expect } from '../../../fixtures/ecommerce-base';
import { customerId, deferBrowserResponse, test } from '../../../fixtures/ecommerce-isolated';

const order = (id: string, status = 'pending') => ({
  id,
  status,
  total: 500,
  placed_at: '2026-10-20T12:00:00Z',
  payment_method: 'card_demo',
  order_items: [
    {
      id: id + '-item',
      product_id: null,
      quantity: 2,
      unit_price: 250,
      products: { name: 'Fictional Order Product ' + id, image_url: '/kadin-product-1.jpg' },
    },
  ],
});

test('TC-ORD-001-01 pending read shows loading before an empty signed-in history', async ({
  storefront,
  shop,
}) => {
  const held = deferBrowserResponse();
  shop.ordersGate = held.response;
  try {
    await storefront.openRoute('/orders');
    await expect(storefront.visibleText('Loading orders')).toBeVisible();
    await expect(storefront.visibleText('No orders yet')).toHaveCount(0);
    await expect(storefront.signedOutOrdersHeading).toHaveCount(0);
    held.release();
    await expect(storefront.visibleText('No orders yet')).toBeVisible();
    await expect(storefront.visibleText('Loading orders')).toHaveCount(0);
    const read = shop.reads.find((url) => url.pathname.endsWith('/orders'))!;
    expect(read.searchParams.get('user_id')).toBe('eq.' + customerId);
    expect(read.searchParams.get('order')).toBe('placed_at.desc');
  } finally {
    held.release();
  }
});

test('TC-ORD-001-01 failed history read shows error rather than empty and reload can recover', async ({
  storefront,
  shop,
  page,
}) => {
  shop.ordersMode = 'error';
  await storefront.openRoute('/orders');
  await expect(
    storefront.visibleText('We could not load your orders. Please try again.'),
  ).toBeVisible();
  await expect(storefront.visibleText('No orders yet')).toHaveCount(0);
  await expect(storefront.customerOrderButtons()).toHaveCount(0);
  shop.ordersMode = 'success';
  shop.orders = [order('RECOVERY-001')];
  await page.reload();
  await expect(storefront.customerOrder('RECOVERY')).toBeVisible();
  await expect(
    storefront.visibleText('We could not load your orders. Please try again.'),
  ).toHaveCount(0);
});

test('TC-ORD-001-01 supplied order sequence and five status labels render with one expanded order', async ({
  storefront,
  shop,
}) => {
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  shop.orders = statuses.map((status, index) => order('HISTORY' + index, status));
  await storefront.openRoute('/orders');
  await expect(storefront.customerOrderButtons()).toHaveCount(5);
  for (const [index, label] of [
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
  ].entries()) {
    await expect(storefront.customerOrderButtons().nth(index)).toContainText(
      'Order HISTORY' + index,
    );
    await expect(storefront.customerOrderButtons().nth(index)).toContainText(label);
  }
  await storefront.customerOrder('HISTORY0').click();
  await expect(storefront.visibleText('Fictional Order Product HISTORY0 × 2')).toBeVisible();
  await expect(storefront.visibleText('Payment: Demo card')).toBeVisible();
  await storefront.customerOrder('HISTORY1').click();
  await expect(storefront.visibleText('Fictional Order Product HISTORY0 × 2')).toHaveCount(0);
  await expect(storefront.visibleText('Fictional Order Product HISTORY1 × 2')).toBeVisible();
  await storefront.customerOrder('HISTORY1').click();
  await expect(storefront.visibleText('Fictional Order Product HISTORY1 × 2')).toHaveCount(0);
  expect(shop.calls).toEqual([]);
});

test('TC-ORD-001-01 deleted product fallback unknown status and cash-on-delivery detail remain readable', async ({
  storefront,
  shop,
}) => {
  shop.orders = [
    {
      ...order('FALLBACK'),
      status: 'awaiting_demo',
      payment_method: 'cash_on_delivery',
      order_items: [
        { id: 'deleted-item', product_id: null, quantity: 2, unit_price: 250, products: null },
      ],
    },
  ];
  await storefront.openRoute('/orders');
  await expect(storefront.customerOrder('FALLBACK')).toContainText('awaiting_demo');
  await expect(storefront.customerOrder('FALLBACK')).toContainText('₹500');
  await storefront.customerOrder('FALLBACK').click();
  await expect(storefront.visibleText('Product × 2')).toBeVisible();
  await expect(storefront.visibleText('Payment: Simulated cash on delivery')).toBeVisible();
  await expect(storefront.visibleText('₹500')).toHaveCount(2);
  expect(shop.calls).toEqual([]);
});
