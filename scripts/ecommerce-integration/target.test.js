'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('./target');
const config = () => ({
  projectId: 'zeouf-integration-test',
  apiUrl: 'http://127.0.0.1:3001',
  dbUrl: 'postgresql://postgres:fixture@127.0.0.1:3002/postgres',
  appUrl: 'http://127.0.0.1:3003',
  mailUrl: 'http://127.0.0.1:3004',
  anonKey: 'fixture',
  serviceKey: 'fixture',
  website: '/fixture',
});
test('integration targets reject public databases, implicit ports and non-disposable projects', () => {
  assert.equal(validate(config()).projectId, 'zeouf-integration-test');
  for (const change of [
    { apiUrl: 'https://production.supabase.co' },
    { dbUrl: 'postgresql://remote.example:5432/postgres' },
    { appUrl: 'http://localhost' },
    { projectId: 'production' },
  ])
    assert.throws(() => validate({ ...config(), ...change }));
});
