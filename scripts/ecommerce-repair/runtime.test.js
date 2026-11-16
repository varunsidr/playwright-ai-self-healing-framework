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
