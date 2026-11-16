'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { disableMcpServers } = require('./runtime');

test('recorded-evidence agents disable every resolved MCP server instead of merging an empty table', () => {
  assert.deepEqual(
    disableMcpServers([{ name: 'playwright-test' }, { name: 'service.with.dots' }]),
    ['-c', 'mcp_servers={"playwright-test"={enabled=false},"service.with.dots"={enabled=false}}'],
  );
  assert.deepEqual(disableMcpServers([]), []);
  assert.throws(() => disableMcpServers([{ name: '' }]), /Unsupported/);
  assert.throws(() => disableMcpServers([{ name: 'bad name' }]), /Unsupported/);
});

test('subscription authentication rejects API-key and missing logins before agent execution', () => {
  const { chatgptConfiguration, cleanEnvironment } = require('./runtime');
  const login =
    (stdout, status = 0) =>
    () => ({ status, stdout, stderr: '' });
  assert.deepEqual(chatgptConfiguration('codex', '.', {}, login('Logged in using ChatGPT')), [
    '-c',
    'forced_login_method="chatgpt"',
    '-c',
    'model_provider="openai"',
  ]);
  assert.throws(
    () => chatgptConfiguration('codex', '.', {}, login('Logged in using an API key')),
    /API-key authentication is not accepted/,
  );
  assert.throws(
    () => chatgptConfiguration('codex', '.', {}, login('Not logged in', 1)),
    /Sign in locally/,
  );
  const prior = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-only-key';
  try {
    assert.equal(cleanEnvironment().OPENAI_API_KEY, undefined);
  } finally {
    if (prior === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = prior;
  }
});
