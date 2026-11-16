'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarizeEvents } = require('./runner');

test('agent metrics use completed protocol events, never the agent claiming a tool ran', () => {
  const events = [
    {
      type: 'item.completed',
      item: { type: 'agent_message', text: 'I called planner_setup_page' },
    },
    { type: 'item.started', item: { type: 'mcp_tool_call', tool: 'planner_setup_page' } },
    {
      type: 'item.completed',
      item: {
        type: 'mcp_tool_call',
        server: 'playwright-test',
        tool: 'browser_snapshot',
        status: 'completed',
      },
    },
    {
      type: 'item.completed',
      item: { type: 'mcp_tool_call', tool: 'planner_save_plan', status: 'failed', error: 'denied' },
    },
    {
      type: 'turn.completed',
      usage: { input_tokens: 100, cached_input_tokens: 60, output_tokens: 20 },
    },
    {
      type: 'turn.completed',
      usage: { input_tokens: 40, cached_input_tokens: 0, output_tokens: 10 },
    },
  ];
  const result = summarizeEvents(events.map(JSON.stringify).join('\n') + '\npartial-json', 123);
  assert.equal(result.toolCalls, 2);
  assert.equal(
    result.tools.some((call) => call.tool === 'planner_setup_page'),
    false,
  );
  assert.equal(result.tools[1].status, 'failed');
  assert.deepEqual(result.usage, { input_tokens: 140, cached_input_tokens: 60, output_tokens: 30 });
  assert.equal(result.elapsedMs, 123);
  assert.equal(summarizeEvents('', 0).usageAvailable, false);
});
