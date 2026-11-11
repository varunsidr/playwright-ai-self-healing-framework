'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../../../scripts/ecommerce-contracts/source');

const product = '11111111-1111-4111-8111-111111111111';
const otherProduct = '22222222-2222-4222-8222-222222222222';
const customer = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const key = '99999999-9999-4999-8999-999999999999';
const address = {
  fullName: 'Fictional Tester',
  phone: '000',
  address: 'Demo',
  city: 'Demo',
  postalCode: '000',
};
const body = (items = [{ id: product, quantity: 1 }]) => ({
  items,
  shippingAddress: address,
  paymentMethod: 'card_demo',
});

function fixture(options = {}) {
  const calls = [];
  const createClient = (_url, credential) => {
    if (credential === 'contract-anon-key')
      return {
        auth: {
          getUser: async () => ({
            data: { user: options.unauthenticated ? null : { id: customer } },
            error: null,
          }),
        },
      };
    return {
      rpc: async (name, args) => {
        calls.push({ name, args: JSON.parse(JSON.stringify(args)) });
        return {
          data: { order_id: 'fictional-order', total: 2500 },
          error: options.rpcError ? { message: options.rpcError } : null,
        };
      },
    };
  };
  const route = handler('src/app/api/checkout/route.ts', createClient);
  const post = (value, attempt = key, authenticated = true) =>
    route.POST(
      new Request('https://contract-fixture.invalid/api/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(authenticated ? { authorization: 'Bearer fictional-token' } : {}),
          ...(attempt === null ? {} : { 'idempotency-key': attempt }),
        },
        body: JSON.stringify(value),
      }),
    );
  return { post, calls };
}

test('TC-CHK-003-01 merged quantity 21 rejects before the purchase RPC', async () => {
  const f = fixture();
  const response = await f.post(
    body([
      { id: product, quantity: 10 },
      { id: product, quantity: 11 },
    ]),
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'A cart item exceeds the quantity limit.' });
  assert.deepEqual(f.calls, []);
});

for (const [label, items] of [
  ['empty cart', []],
  ['51 raw entries', Array.from({ length: 51 }, () => ({ id: product, quantity: 1 }))],
  ['malformed product UUID', [{ id: 'not-a-uuid', quantity: 1 }]],
  ['zero quantity', [{ id: product, quantity: 0 }]],
  ['quantity 21', [{ id: product, quantity: 21 }]],
  ['fractional quantity', [{ id: product, quantity: 1.5 }]],
  ['nonnumeric quantity', [{ id: product, quantity: 'many' }]],
  ['null item', [null]],
]) {
  test('TC-CHK-003-01 rejects ' + label + ' without purchase writes', async () => {
    const f = fixture();
    assert.equal((await f.post(body(items))).status, 400);
    assert.deepEqual(f.calls, []);
  });
}

for (const invalidKey of [null, '', 'not-a-uuid', key + 'x']) {
  test('TC-CHK-009-04 rejects attempt key ' + JSON.stringify(invalidKey), async () => {
    const f = fixture();
    const response = await f.post(body(), invalidKey);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'A valid checkout attempt key is required.' });
    assert.deepEqual(f.calls, []);
  });
}

for (const [label, option] of [
  ['object size', { size: {} }],
  ['numeric color', { color: 2 }],
  ['31-character size', { size: 's'.repeat(31) }],
  ['41-character color', { color: 'c'.repeat(41) }],
]) {
  test('TC-CHK-009-04 rejects ' + label + ' before the purchase RPC', async () => {
    const f = fixture();
    const response = await f.post(body([{ id: product, quantity: 1, ...option }]));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'A cart option is invalid.' });
    assert.deepEqual(f.calls, []);
  });
}

test('TC-CHK-009-04 equivalent reordered tuples normalize to the same RPC payload', async () => {
  const f = fixture();
  const entries = [
    { id: otherProduct, quantity: '2', size: ' M ', color: ' Blue ' },
    { id: product, quantity: 10 },
    { id: product, quantity: 10 },
  ];
  assert.equal((await f.post(body(entries))).status, 200);
  assert.equal((await f.post(body([...entries].reverse()))).status, 200);
  assert.deepEqual(f.calls[0], f.calls[1]);
  assert.deepEqual(f.calls[0].args.p_items, [
    { id: product, quantity: 20, size: null, color: null },
    { id: otherProduct, quantity: 2, size: 'M', color: 'Blue' },
  ]);
  assert.equal(f.calls[0].args.p_user_id, customer);
  assert.equal(f.calls[0].args.p_idempotency_key, key);
});

test('TC-CHK-009-04 exact option limits accept trimmed 30/40-character values', async () => {
  const f = fixture();
  assert.equal(
    (
      await f.post(
        body([
          { id: product, quantity: 1, size: ' ' + 's'.repeat(30) + ' ', color: 'c'.repeat(40) },
        ]),
      )
    ).status,
    200,
  );
  assert.equal(f.calls[0].args.p_items[0].size.length, 30);
  assert.equal(f.calls[0].args.p_items[0].color.length, 40);
});

test('TC-CHK-003-01 exactly 50 valid raw entries normalize within per-tuple limits', async () => {
  const f = fixture();
  const items = Array.from({ length: 50 }, (_, i) => ({
    id: product,
    quantity: 1,
    size: String(i),
  }));
  assert.equal((await f.post(body(items))).status, 200);
  assert.equal(f.calls[0].args.p_items.length, 50);
});

test('TC-CHK-009-04 forged body identity cannot override verified authentication', async () => {
  const f = fixture();
  assert.equal((await f.post({ ...body(), user_id: 'forged-customer' })).status, 200);
  assert.equal(f.calls[0].args.p_user_id, customer);
  const anonymous = fixture();
  assert.equal((await anonymous.post(body(), key, false)).status, 401);
  assert.deepEqual(anonymous.calls, []);
});

for (const [error, status] of [
  ['IDEMPOTENCY_CONFLICT', 409],
  ['INVALID_OPTION', 400],
  ['OUT_OF_STOCK', 409],
  ['PRIVATE_DATABASE_DETAIL', 500],
]) {
  test('TC-CHK-009-04 purchase error ' + error + ' has a safe public response', async () => {
    const f = fixture({ rpcError: error });
    const response = await f.post(body());
    assert.equal(response.status, status);
    assert.equal(JSON.stringify(await response.json()).includes(error), false);
    assert.equal(f.calls.length, 1);
  });
}
