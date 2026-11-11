'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../../../scripts/ecommerce-contracts/source');
const product = '11111111-1111-4111-8111-111111111111';
const customer = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const image = `reviews/${product}/${customer}/99999999-9999-4999-8999-999999999999.webp`;
const review = {
  id: 'review-fixture',
  product_id: product,
  user_id: customer,
  name: 'Fictional Reviewer',
  rating: 5,
  title: null,
  comment: 'Fictional feedback',
  images: [image],
  created_at: '2026-11-01T00:00:00Z',
  admin_reply: 'Fictional reply',
  replied_at: null,
};

function fixture(options = {}) {
  const calls = [],
    writes = [],
    signed = [];
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: options.unauthenticated ? null : { id: customer } },
        error: null,
      }),
    },
    storage: {
      from: (bucket) => ({
        createSignedUrl: async (file, seconds) => {
          signed.push({ bucket, file, seconds });
          return { data: { signedUrl: 'https://signed-fixture.invalid/photo' }, error: null };
        },
      }),
    },
    from(table) {
      assert.equal(table, 'reviews');
      const query = {};
      for (const method of ['select', 'eq', 'order', 'limit'])
        query[method] = (...args) => {
          calls.push({ method, args });
          return query;
        };
      query.insert = (value) => {
        writes.push(JSON.parse(JSON.stringify(value)));
        return query;
      };
      query.single = async () => ({
        data: { id: review.id },
        error: options.databaseError ? { message: 'private detail' } : null,
      });
      query.then = (resolve, reject) =>
        Promise.resolve({
          data: options.rows || [review],
          error: options.databaseError ? { message: 'private detail' } : null,
        }).then(resolve, reject);
      return query;
    },
  };
  const route = handler('src/app/api/reviews/route.ts', () => client, {
    env: options.noService ? { SUPABASE_SERVICE_ROLE_KEY: '' } : {},
  });
  const post = (value, authenticated = true) =>
    route.POST(
      new Request('https://contract-fixture.invalid/api/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(authenticated ? { authorization: 'Bearer fictional-token' } : {}),
        },
        body: JSON.stringify(value),
      }),
    );
  return { route, calls, writes, signed, post };
}
const valid = () => ({
  productId: product,
  name: ' Fictional Reviewer ',
  rating: 5,
  comment: ' Fictional feedback ',
  images: [image],
  approved: true,
  user_id: 'forged-user',
});

test('TC-REV-004-01 public GET ignores approved=false, orders newest first and caps reads at 100', async () => {
  const f = fixture();
  const response = await f.route.GET(
    new Request(`https://contract-fixture.invalid/api/reviews?productId=${product}&approved=false`),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.ok(
    f.calls.some((c) => c.method === 'eq' && c.args[0] === 'approved' && c.args[1] === true),
  );
  assert.ok(
    f.calls.some((c) => c.method === 'eq' && c.args[0] === 'product_id' && c.args[1] === product),
  );
  assert.ok(
    f.calls.some(
      (c) => c.method === 'order' && c.args[0] === 'created_at' && c.args[1].ascending === false,
    ),
  );
  assert.ok(f.calls.some((c) => c.method === 'limit' && c.args[0] === 100));
  const [publicReview] = (await response.json()).reviews;
  assert.equal(publicReview.name, review.name);
  assert.equal(publicReview.admin_reply, review.admin_reply);
  assert.equal(Object.hasOwn(publicReview, 'user_id'), false);
  assert.equal(Object.hasOwn(publicReview, 'images'), false);
  assert.deepEqual(publicReview.displayImages, ['https://signed-fixture.invalid/photo']);
  assert.deepEqual(f.signed, [{ bucket: 'review-images', file: image, seconds: 600 }]);
});

test('TC-REV-004-01 missing service role never exposes or signs stored image paths', async () => {
  const f = fixture({ noService: true });
  const response = await f.route.GET(
    new Request(`https://contract-fixture.invalid/api/reviews?productId=${product}`),
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).reviews[0].displayImages, []);
  assert.deepEqual(f.signed, []);
});

test('TC-REV-004-01 foreign image paths are never signed', async () => {
  const f = fixture({
    rows: [
      { ...review, images: ['reviews/other/owner/file.webp', 'https://public.invalid/raw.png'] },
    ],
  });
  const response = await f.route.GET(
    new Request(`https://contract-fixture.invalid/api/reviews?productId=${product}`),
  );
  assert.deepEqual((await response.json()).reviews[0].displayImages, []);
  assert.deepEqual(f.signed, []);
});

test('TC-REV-004-01 database read failures return safe errors', async () => {
  const f = fixture({ databaseError: true });
  const response = await f.route.GET(
    new Request(`https://contract-fixture.invalid/api/reviews?productId=${product}`),
  );
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: 'Could not load reviews.' });
});

test('TC-REV-004-02 server creation forces pending and verified author with trimmed fields', async () => {
  const f = fixture();
  const response = await f.post(valid());
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { status: 'pending', reviewId: review.id });
  assert.deepEqual(f.writes, [
    {
      product_id: product,
      user_id: customer,
      name: 'Fictional Reviewer',
      rating: 5,
      title: null,
      comment: 'Fictional feedback',
      images: [image],
      approved: false,
    },
  ]);
});

for (const [label, change] of [
  ['blank display name', { name: '  ' }],
  ['121-character name', { name: 'a'.repeat(121) }],
  ['zero stars', { rating: 0 }],
  ['six stars', { rating: 6 }],
  ['fractional stars', { rating: 1.5 }],
  ['string stars', { rating: '5' }],
  ['blank comment', { comment: ' ' }],
  ['oversized comment', { comment: 'x'.repeat(4001) }],
  ['four images', { images: [image, image, image, image] }],
  ['malformed product', { productId: 'invalid' }],
]) {
  test('TC-REV-004-02 rejects ' + label + ' without insertion', async () => {
    const f = fixture();
    assert.equal((await f.post({ ...valid(), ...change })).status, 400);
    assert.deepEqual(f.writes, []);
  });
}

test('TC-REV-004-02 exact name/comment limits remain accepted', async () => {
  const f = fixture();
  assert.equal(
    (await f.post({ ...valid(), name: 'x'.repeat(120), comment: 'x'.repeat(4000) })).status,
    201,
  );
});

for (const foreign of [
  'https://public.invalid/photo.png',
  image.replace(customer, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  image.replace('.webp', '.html'),
]) {
  test('TC-REV-004-02 rejects foreign or invalid image ' + foreign, async () => {
    const f = fixture();
    assert.equal((await f.post({ ...valid(), images: [foreign] })).status, 400);
    assert.deepEqual(f.writes, []);
  });
}

test('TC-REV-004-02 absent or rejected authentication never inserts a review', async () => {
  for (const rejected of [false, true]) {
    const f = fixture({ unauthenticated: rejected });
    assert.equal((await f.post(valid(), rejected)).status, 401);
    assert.deepEqual(f.writes, []);
  }
});
