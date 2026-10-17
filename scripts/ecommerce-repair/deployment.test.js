'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const deployment = require('./deployment');
const core = require('./core');

const source = {
  id: 123,
  sha: 'a'.repeat(40),
  environment: 'Production',
  creator: { login: 'vercel[bot]' },
};
const status = {
  id: 456,
  state: 'success',
  environment_url: 'https://zeouf-luxury-fashion-ecommerce-fixture123.vercel.app',
  creator: { login: 'vercel[bot]' },
};
const record = deployment.recordFrom(source, status);

test('capture uses a successful Vercel Production deployment and never guesses a revision', async () => {
  const calls = [];
  const get = async (endpoint) => {
    calls.push(endpoint);
    if (endpoint.startsWith('/deployments?'))
      return [{ ...source, creator: { login: 'untrusted' } }, source];
    return [status];
  };
  assert.equal((await deployment.capture(get)).websiteRevision, source.sha);
  assert.equal(calls.length, 2);
  await assert.rejects(
    () =>
      deployment.capture(async (endpoint) =>
        endpoint.startsWith('/deployments?') ? [source] : [{ ...status, state: 'failure' }],
      ),
    /No successful/,
  );
  assert.throws(
    () => deployment.recordFrom(source, { ...status, state: 'pending' }),
    /successful Vercel/,
  );
  assert.throws(
    () => deployment.recordFrom({ ...source, environment: 'Preview' }, status),
    /successful Vercel/,
  );
});

test('deployment identity excludes mutable aliases, other websites and credentials in URLs', () => {
  for (const url of [
    'https://zeouf-luxury-fashion-ecommerce.vercel.app',
    'https://example.com',
    'http://zeouf-luxury-fashion-ecommerce-fixture123.vercel.app',
    'https://token@zeouf-luxury-fashion-ecommerce-fixture123.vercel.app',
    'https://zeouf-luxury-fashion-ecommerce-fixture123.vercel.app/?token=secret',
  ])
    assert.throws(() => deployment.validateRecord({ ...record, url }), /Invalid Zeouf/);
  assert.throws(
    () => deployment.validateRecord({ ...record, websiteRevision: 'main' }),
    /Invalid Zeouf/,
  );
});

test('record verification rejects changed SHA, status identity and URL', async () => {
  const get =
    (d = source, s = status) =>
    async (endpoint) =>
      endpoint.endsWith('/123') ? d : [s];
  await deployment.verifyRecord(record, get());
  await assert.rejects(
    () => deployment.verifyRecord(record, get({ ...source, sha: 'b'.repeat(40) })),
    /identity changed/,
  );
  await assert.rejects(
    () => deployment.verifyRecord(record, get(source, { ...status, id: 789 })),
    /unavailable/,
  );
  await assert.rejects(
    () =>
      deployment.verifyRecord(
        record,
        get(source, {
          ...status,
          environment_url: 'https://zeouf-luxury-fashion-ecommerce-other123.vercel.app',
        }),
      ),
    /identity changed/,
  );
});

test('reports and repair checkouts must match the same deployment bytes, origin and immutable revisions', () => {
  const bytes = Buffer.from(JSON.stringify(record));
  const metadata = {
    websiteRevision: source.sha,
    websiteDeploymentId: '123',
    ecommerceOrigin: record.url,
    websiteDeploymentSha256: core.hash(bytes),
  };
  deployment.validateBinding(metadata, record, bytes);
  for (const change of [
    { websiteRevision: null },
    { websiteRevision: 'b'.repeat(40) },
    { websiteDeploymentId: '999' },
    { ecommerceOrigin: 'https://zeouf-luxury-fashion-ecommerce.vercel.app' },
    { websiteDeploymentSha256: 'wrong' },
  ])
    assert.throws(
      () => deployment.validateBinding({ ...metadata, ...change }, record, bytes),
      /not bound/,
    );
  const packet = {
    reports: [
      {
        codeRevision: 'f'.repeat(40),
        websiteRevision: metadata.websiteRevision,
        websiteDeploymentId: metadata.websiteDeploymentId,
        websiteDeploymentSha256: metadata.websiteDeploymentSha256,
        origin: metadata.ecommerceOrigin,
      },
    ],
  };
  deployment.validatePacket(packet, record, bytes, 'f'.repeat(40), source.sha);
  assert.throws(
    () => deployment.validatePacket({ reports: [] }, record, bytes, 'f'.repeat(40), source.sha),
    /original test reports/,
  );
  assert.throws(
    () => deployment.validatePacket(packet, record, bytes, 'f'.repeat(40), 'b'.repeat(40)),
    /tested deployment/,
  );
  assert.throws(
    () => deployment.validatePacket(packet, record, bytes, 'e'.repeat(40), source.sha),
    /Framework checkout/,
  );
});
