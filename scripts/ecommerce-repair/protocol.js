'use strict';

function summarizeEvents(text, elapsedMs) {
  const events = text
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  const completed = events.filter((event) => event.type === 'item.completed');
  const tools = completed
    .filter((event) => event.item?.type === 'mcp_tool_call')
    .map(({ item }) => ({
      server: item.server,
      tool: item.tool,
      status: item.status,
      error: item.error || (item.result?.isError ? 'Tool response reported an error' : null),
    }));
  const turns = events.filter((event) => event.type === 'turn.completed');
  return {
    elapsedMs,
    tools,
    toolCalls: tools.length,
    usageAvailable: turns.some((event) => event.usage),
    usage: turns.reduce((total, event) => {
      for (const [key, value] of Object.entries(event.usage || {}))
        if (typeof value === 'number') total[key] = (total[key] || 0) + value;
      return total;
    }, {}),
    failedTurns: events.filter((event) => event.type === 'turn.failed' || event.type === 'error'),
    commandExecutions: completed.filter((event) => event.item?.type === 'command_execution').length,
    fileChanges: completed.filter((event) => event.item?.type === 'file_change').length,
    webSearches: completed.filter((event) => event.item?.type === 'web_search').length,
  };
}

module.exports = { summarizeEvents };
