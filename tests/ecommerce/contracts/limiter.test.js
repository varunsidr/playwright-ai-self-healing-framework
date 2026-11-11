'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../../../scripts/ecommerce-contracts/source');
for (const endpoint of ['checkout', 'reviews']) {
  for (const [label, limited, status] of [
    ['unavailable', null, 503],
    ['limited', true, 429],
    ['allowed', false, 401],
    ['default allowed', undefined, 401],
  ]) {
    test(`${endpoint} limiter ${label} preserves the three-state contract`, async () => {
      let clients = 0;
      const route = handler(
        `src/app/api/${endpoint}/route.ts`,
        () => {
          clients++;
          return {};
        },
        { limited },
      );
      const response = await route.POST(
        new Request(`https://contract-fixture.invalid/api/${endpoint}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            productId: '11111111-1111-4111-8111-111111111111',
            name: 'Fictional Reviewer',
            rating: 5,
            comment: 'Fictional feedback',
          }),
        }),
      );
      assert.equal(response.status, status);
      if (limited === null || limited === true)
        assert.equal(clients, 0, 'Limiter denial precedes backend clients');
      assert.equal(typeof (await response.json()).error, 'string');
    });
  }
}
