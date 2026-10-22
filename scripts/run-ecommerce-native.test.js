'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { liveOrigin, tapStats, browserStats, nativeEnvironment } = require('./run-ecommerce-native');

test('native subprocesses do not inherit database or Redis connection settings', () => {
  assert.deepEqual(
    nativeEnvironment({
      PATH: 'bin',
      CI: '1',
      DATABASE_URL: 'fictional',
      DIRECT_URL: 'fictional',
      PGHOST: 'fictional',
      PGUSER: 'fictional',
      POSTGRES_URL: 'fictional',
      REDIS_URL: 'fictional',
    }),
    { PATH: 'bin', CI: '1' },
  );
});

test('native live target accepts only credential-free HTTPS origins', () => {
  assert.equal(
    liveOrigin('https://zeouf-luxury-fashion-ecommerce.vercel.app/'),
    'https://zeouf-luxury-fashion-ecommerce.vercel.app',
  );
  for (const value of [
    'http://localhost:3100',
    'https://u:p@example.test/',
    'https://example.test/path',
    'https://example.test/?q=1',
    'https://example.test/#fragment',
  ])
    assert.throws(() => liveOrigin(value));
});

const tap = '# tests 13\n# pass 13\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n';
test('native Node evidence requires nonempty complete totals without skips or failures', () => {
  assert.equal(tapStats(tap).pass, 13);
  for (const text of [
    '',
    tap.replace('# tests 13', '# tests 0'),
    tap.replace('# skipped 0', '# skipped 1'),
    tap.replace('# fail 0', '# fail 1'),
    tap.replace('# pass 13', '# pass 12'),
  ])
    assert.throws(() => tapStats(text), /incomplete|clean/);
});

const report = () => ({
  stats: { expected: 1 },
  errors: [],
  suites: [
    {
      specs: [
        {
          file: 'storefront.spec.ts',
          title: 'Native example',
          tests: [
            {
              projectName: '',
              expectedStatus: 'passed',
              status: 'expected',
              results: [{ status: 'passed', retry: 0 }],
            },
          ],
        },
      ],
    },
  ],
});
test('native browser evidence requires each discovered check to pass once', () => {
  assert.deepEqual(browserStats(report(), report()), { expected: 1 });
  for (const change of [
    (r) => {
      r.errors.push({ message: 'Runner error' });
    },
    (r) => {
      r.suites = [];
    },
    (r) => {
      r.suites[0].specs[0].tests[0].results[0].retry = 1;
    },
    (r) => {
      r.suites[0].specs[0].tests[0].status = 'skipped';
    },
    (r) => {
      r.suites[0].specs[0].tests[0].results.push({ status: 'passed', retry: 1 });
    },
  ]) {
    const current = report();
    change(current);
    assert.throws(() => browserStats(current, report()), /every discovered/);
  }
});

test('native discovery cannot be empty or alias two tests to one identity', () => {
  const empty = report();
  empty.suites = [];
  assert.throws(() => browserStats(empty, empty), /every discovered/);
  const duplicate = report();
  duplicate.suites[0].specs.push(duplicate.suites[0].specs[0]);
  assert.throws(() => browserStats(duplicate, duplicate), /every discovered/);
});
