'use strict';
const { before, beforeEach, after, test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { target } = require('../../../scripts/ecommerce-integration/target');
const { config, requireWebsite } = target();
const { createClient } = requireWebsite('@supabase/supabase-js');
const { Pool } = requireWebsite('pg');
const db = new Pool({ connectionString: config.dbUrl, max: 8 });
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
const admin = createClient(config.apiUrl, config.serviceKey, options);
const anonymous = createClient(config.apiUrl, config.anonKey, options);
const product = '11111111-1111-4111-8111-111111111111';
const sized = '22222222-2222-4222-8222-222222222222';
const password = 'Fictional-integration-123!';
const address = {
  fullName: 'Fictional Tester',
  phone: '000',
  address: 'Local fixture',
  city: 'Local',
  postalCode: '000',
};
const customers = [];

before(async () => {
  for (const name of ['alpha', 'beta']) {
    const email = `${name}-${randomUUID()}@example.invalid`;
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    assert.equal(created.error, null, 'Local Auth must create a disposable customer');
    const client = createClient(config.apiUrl, config.anonKey, options);
    const signed = await client.auth.signInWithPassword({ email, password });
    assert.equal(signed.error, null, 'Local Auth must issue a real session');
    customers.push({ id: created.data.user.id, client, token: signed.data.session.access_token });
  }
});
beforeEach(async () => {
  await db.query(
    'TRUNCATE public.products, public.orders, public.checkout_attempts, public.restock_notifications, public.api_rate_limits CASCADE',
  );
  await db.query(
    `INSERT INTO products(id,name,category,price,stock,sizes,image_url,color_options) VALUES
    ($1,'Integration bag','Bags',999.50,1,'{}','/canta-5.jpg','[]'),
    ($2,'Integration blouse','Women''s Blouse',2500,5,ARRAY['M'],'/kadin-product-1.jpg','[{"name":"Brown"}]')`,
    [product, sized],
  );
  await db.query("INSERT INTO product_size_stock(product_id,size,stock) VALUES($1,'M',5)", [sized]);
});
after(() => db.end());

async function checkout(
  customer = customers[0],
  items = [{ id: product, quantity: 1 }],
  key = randomUUID(),
  shippingAddress = address,
) {
  const response = await fetch(config.appUrl + '/api/checkout', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + customer.token,
      'idempotency-key': key,
    },
    body: JSON.stringify({ items, shippingAddress, paymentMethod: 'card_demo' }),
    signal: AbortSignal.timeout(30000),
  });
  return { status: response.status, body: await response.json() };
}
const inventory = async () =>
  (await db.query('SELECT stock FROM products WHERE id=$1', [product])).rows[0].stock;
const orderCount = async () =>
  (await db.query('SELECT count(*)::int AS count FROM orders')).rows[0].count;

test('real Auth session creates a persisted order at catalog price and preserves customer ownership', async () => {
  const response = await checkout(customers[0], [{ id: product, quantity: 1, price: 1 }]);
  assert.equal(response.status, 200);
  assert.equal(Number(response.body.total), 999.5);
  assert.equal(await inventory(), 0);
  assert.equal(await orderCount(), 1);
  const own = await customers[0].client.from('orders').select('id,total');
  const other = await customers[1].client.from('orders').select('id,total');
  assert.equal(own.error, null);
  assert.equal(other.error, null);
  assert.equal(own.data.length, 1);
  assert.deepEqual(other.data, []);
});

test('TC-CHK-007-01 two independently authenticated last-unit purchases produce exactly one order', async () => {
  const results = await Promise.all(customers.map((customer) => checkout(customer)));
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(await inventory(), 0);
  assert.equal(await orderCount(), 1);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM order_items')).rows[0].count, 1);
});

test('TC-STK-004-02 simultaneous identical attempt keys replay one persisted order', async () => {
  const key = randomUUID();
  const results = await Promise.all([
    checkout(customers[0], undefined, key),
    checkout(customers[0], undefined, key),
  ]);
  assert.deepEqual(
    results.map((result) => result.status),
    [200, 200],
  );
  assert.equal(results[0].body.orderId, results[1].body.orderId);
  assert.equal(await orderCount(), 1);
  assert.equal(await inventory(), 0);
});

test('real checkout transaction rolls back an earlier line when a later product is out of stock', async () => {
  await db.query('UPDATE products SET stock=0 WHERE id=$1', [product]);
  const response = await checkout(customers[0], [
    { id: sized, size: 'M', color: 'Brown', quantity: 1 },
    { id: product, quantity: 1 },
  ]);
  assert.equal(response.status, 409);
  assert.equal(await orderCount(), 0);
  assert.equal(
    (await db.query('SELECT stock FROM product_size_stock WHERE product_id=$1', [sized])).rows[0]
      .stock,
    5,
  );
  assert.equal(
    (await db.query('SELECT count(*)::int AS count FROM checkout_attempts')).rows[0].count,
    0,
  );
});

test('TC-STK-004-02 crossed product order cannot oversell or create partial orders', async () => {
  const items = [
    { id: product, quantity: 1 },
    { id: sized, size: 'M', color: 'Brown', quantity: 1 },
  ];
  const results = await Promise.all([
    checkout(customers[0], items),
    checkout(customers[1], [...items].reverse()),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(await orderCount(), 1);
  assert.equal(await inventory(), 0);
  assert.equal((await db.query('SELECT count(*)::int AS count FROM order_items')).rows[0].count, 2);
  assert.equal(
    (await db.query('SELECT stock FROM product_size_stock WHERE product_id=$1', [sized])).rows[0]
      .stock,
    4,
  );
});

test('TC-STK-004-02 stock edit and purchase serialize with a consistent configured aggregate', async () => {
  const results = await Promise.all([
    checkout(customers[0], [{ id: sized, size: 'M', color: 'Brown', quantity: 1 }]),
    admin.rpc('set_product_stock', { p_product_id: sized, p_size: 'M', p_stock: 2 }),
  ]);
  assert.equal(results[0].status, 200);
  assert.equal(results[1].error, null);
  const quantities = (
    await db.query(
      'SELECT p.stock AS overall,s.stock AS variant FROM products p JOIN product_size_stock s ON p.id=s.product_id WHERE p.id=$1',
      [sized],
    )
  ).rows[0];
  assert.equal(quantities.overall, quantities.variant);
  assert.ok([1, 2].includes(quantities.overall));
});

test('idempotency conflict has no additional writes and customer tokens cannot call service-only RPCs', async () => {
  const key = randomUUID();
  assert.equal((await checkout(customers[0], undefined, key)).status, 200);
  assert.equal(
    (await checkout(customers[0], undefined, key, { ...address, city: 'Changed' })).status,
    409,
  );
  assert.equal(await orderCount(), 1);
  assert.equal(await inventory(), 0);
  const denied = await customers[0].client.rpc('set_product_stock', {
    p_product_id: product,
    p_size: null,
    p_stock: 50,
  });
  assert.ok(denied.error);
  assert.equal(await inventory(), 0);
});

test('real PostgREST enforces approved-or-author visibility and denies direct customer moderation', async () => {
  for (const [customer, approved, comment] of [
    [customers[0], true, 'public'],
    [customers[0], false, 'pending-alpha'],
    [customers[1], false, 'pending-beta'],
  ])
    await db.query(
      'INSERT INTO reviews(product_id,user_id,name,rating,comment,approved) VALUES($1,$2,$3,5,$4,$5)',
      [product, customer.id, 'Fictional Reviewer', comment, approved],
    );
  const publicRows = await anonymous.from('reviews').select('comment');
  const ownRows = await customers[0].client.from('reviews').select('comment').order('comment');
  assert.equal(publicRows.error, null);
  assert.equal(ownRows.error, null);
  assert.deepEqual(
    publicRows.data.map((row) => row.comment),
    ['public'],
  );
  assert.deepEqual(
    ownRows.data.map((row) => row.comment),
    ['pending-alpha', 'public'],
  );
  const denied = await customers[0].client
    .from('reviews')
    .update({ approved: true })
    .eq('comment', 'pending-alpha');
  assert.ok(denied.error);
  assert.equal(
    (await db.query("SELECT approved FROM reviews WHERE comment='pending-alpha'")).rows[0].approved,
    false,
  );
});

test('actual review route creates pending feedback and returns owned private Storage URLs only after approval', async () => {
  const image = `reviews/${product}/${customers[0].id}/${randomUUID()}.png`;
  const uploaded = await admin.storage
    .from('review-images')
    .upload(
      image,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFyoAAAAASUVORK5CYII=',
        'base64',
      ),
      { contentType: 'image/png' },
    );
  assert.equal(uploaded.error, null);
  const created = await fetch(config.appUrl + '/api/reviews', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + customers[0].token, 'content-type': 'application/json' },
    body: JSON.stringify({
      productId: product,
      name: 'Fictional Reviewer',
      rating: 5,
      comment: 'Private pending feedback',
      images: [image],
      approved: true,
    }),
  });
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.status, 'pending');
  const publicUrl = config.appUrl + '/api/reviews?productId=' + product + '&approved=false';
  assert.deepEqual((await (await fetch(publicUrl)).json()).reviews, []);
  await db.query('UPDATE reviews SET approved=true WHERE id=$1', [body.reviewId]);
  const rows = (await (await fetch(publicUrl)).json()).reviews;
  assert.equal(rows.length, 1);
  assert.equal(Object.hasOwn(rows[0], 'user_id'), false);
  assert.equal(Object.hasOwn(rows[0], 'images'), false);
  assert.equal(rows[0].displayImages.length, 1);
  const signedUrl = new URL(rows[0].displayImages[0]);
  assert.ok(['127.0.0.1', 'localhost'].includes(signedUrl.hostname));
  assert.equal((await fetch(signedUrl)).status, 200);
});

test('concurrent real PostgreSQL sessions deduplicate the same literal restock email tuple', async () => {
  await db.query('UPDATE products SET stock=0 WHERE id=$1', [product]);
  const first = await db.connect(),
    second = await db.connect();
  try {
    assert.notEqual(
      (await first.query('SELECT pg_backend_pid() AS id')).rows[0].id,
      (await second.query('SELECT pg_backend_pid() AS id')).rows[0].id,
    );
    const request = (client) =>
      client.query('SELECT subscribe_restock($1,$2,$3,$4,$5) AS result', [
        product,
        'literal_%@example.invalid',
        null,
        null,
        randomBytes(32).toString('hex'),
      ]);
    const results = await Promise.all([request(first), request(second)]);
    assert.deepEqual(results.map((result) => result.rows[0].result).sort(), [
      'already_subscribed',
      'subscribed',
    ]);
    assert.equal(
      (await db.query('SELECT count(*)::int AS count FROM restock_notifications')).rows[0].count,
      1,
    );
  } finally {
    first.release();
    second.release();
  }
});

test('real local Auth signup confirmation is delivered to the isolated test inbox', async () => {
  const email = `signup-${randomUUID()}@example.invalid`;
  const client = createClient(config.apiUrl, config.anonKey, options);
  const signed = await client.auth.signUp({ email, password });
  assert.equal(signed.error, null);
  assert.equal(signed.data.session, null);
  let message;
  for (let attempt = 0; attempt < 50; attempt++) {
    const list = await (await fetch(config.mailUrl + '/api/v1/messages')).json();
    message = (list.messages || []).find((item) => JSON.stringify(item.To).includes(email));
    if (message) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(message, 'Confirmation must reach the local mail sink');
  const contents = await (await fetch(config.mailUrl + '/api/v1/message/' + message.ID)).json();
  const links = (contents.HTML || contents.Text || '').match(/https?:\/\/[^\s"<>]+/g) || [];
  const link = links
    .map((value) => value.replaceAll('&amp;', '&'))
    .find((value) => value.includes('/auth/v1/verify'));
  assert.ok(link, 'Confirmation message must contain a verification link');
  const url = new URL(link);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.equal(url.port, new URL(config.apiUrl).port);
  const confirmed = await fetch(url, { redirect: 'manual' });
  assert.ok([302, 303].includes(confirmed.status));
  const login = await client.auth.signInWithPassword({ email, password });
  assert.equal(login.error, null);
  assert.ok(login.data.session);
});
