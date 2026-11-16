'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const runtime = require('../ecommerce-repair/runtime');
const { nativeEnvironment } = require('../run-ecommerce-native');

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

async function runAgent({
  cwd,
  directory,
  role,
  prompt,
  schema,
  profileRoot,
  requiredTools = [],
  mcp = true,
}) {
  fs.mkdirSync(directory, { recursive: true });
  const binary = process.env.REPAIR_CODEX_BIN || 'codex';
  const servers = JSON.parse(runtime.command(binary, ['mcp', 'list', '--json'], cwd));
  const config = runtime.disableMcpServers(servers);
  let instructions = '',
    allowed = [];
  if (mcp) {
    const profile = fs.readFileSync(
      path.join(profileRoot, '.codex/agents', `playwright_test_${role}.toml`),
      'utf8',
    );
    instructions = profile.match(/developer_instructions\s*=\s*"""([\s\S]*?)"""/)[1];
    allowed = JSON.parse(profile.match(/enabled_tools\s*=\s*(\[[^\n]+\])/)[1]);
    config.push(
      '-c',
      'mcp_servers.playwright-test.enabled=true',
      '-c',
      'mcp_servers.playwright-test.command=' + JSON.stringify(process.execPath),
      '-c',
      'mcp_servers.playwright-test.args=' +
        JSON.stringify([
          path.join(cwd, 'node_modules/@playwright/test/cli.js'),
          'run-test-mcp-server',
        ]),
      '-c',
      'mcp_servers.playwright-test.enabled_tools=' + JSON.stringify(allowed),
    );
  }
  const schemaFile = path.join(directory, 'response.schema.json');
  const resolved = JSON.parse(runtime.command(binary, [...config, 'mcp', 'list', '--json'], cwd));
  const enabled = resolved.filter((server) => server.enabled).map((server) => server.name);
  if (JSON.stringify(enabled) !== JSON.stringify(mcp ? ['playwright-test'] : []))
    throw new Error('Resolved MCP capabilities differ from the requested stage');
  fs.writeFileSync(
    path.join(directory, 'resolved-servers.json'),
    JSON.stringify(
      resolved.map((server) => ({ name: server.name, enabled: server.enabled })),
      null,
      2,
    ),
  );
  const resultFile = path.join(directory, 'response.json');
  fs.writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
  fs.writeFileSync(path.join(directory, 'prompt.txt'), prompt);
  fs.writeFileSync(
    path.join(directory, 'capabilities.json'),
    JSON.stringify(
      {
        role,
        inheritedModel: true,
        enabledServer: mcp ? 'playwright-test' : null,
        enabledTools: allowed,
        disabledServers: servers
          .filter((server) => !mcp || server.name !== 'playwright-test')
          .map((server) => server.name),
      },
      null,
      2,
    ),
  );
  const args = [
    'exec',
    '--approve-for-me',
    '--ephemeral',
    '--color',
    'never',
    '--json',
    ...(!mcp ? ['--skip-git-repo-check'] : []),
    ...config,
    '--output-schema',
    schemaFile,
    '--output-last-message',
    resultFile,
    '-',
  ];
  const env = {
    ...nativeEnvironment(),
    ECOMMERCE_BASE_URL: require('../ecommerce-project').publicOrigin,
    ECOMMERCE_STAGING_CONFIRMED: 'false',
    ECOMMERCE_ISOLATED_FIXTURES: 'false',
  };
  if (process.env.CODEX_API_KEY) env.CODEX_API_KEY = process.env.CODEX_API_KEY;
  const started = Date.now();
  console.log('Running real ' + role + ' agent');
  const stdoutFile = path.join(directory, 'events.jsonl');
  const stderrFile = path.join(directory, 'stderr.log');
  const stdout = fs.openSync(stdoutFile, 'wx'),
    stderr = fs.openSync(stderrFile, 'wx');
  const execution = await new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd,
      env,
      windowsHide: true,
      stdio: ['pipe', stdout, stderr],
    });
    const timer = setTimeout(() => child.kill(), 480000);
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
    child.stdin.end(instructions + '\n\nUSER-AUTHORIZED REHEARSAL\n' + prompt);
  }).finally(() => {
    fs.closeSync(stdout);
    fs.closeSync(stderr);
  });
  const metrics = summarizeEvents(fs.readFileSync(stdoutFile, 'utf8'), Date.now() - started);
  fs.writeFileSync(path.join(directory, 'metrics.json'), JSON.stringify(metrics, null, 2));
  if (execution !== 0 || !fs.existsSync(resultFile))
    throw new Error(`${role} agent did not complete; inspect ${directory}`);
  const response = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
  const missing = requiredTools.filter(
    (tool) =>
      !metrics.tools.some(
        (call) => call.tool === tool && call.status === 'completed' && !call.error,
      ),
  );
  if (missing.length)
    throw new Error(`${role} did not successfully call required MCP tools: ${missing.join(', ')}`);
  if (
    !mcp &&
    (metrics.toolCalls || metrics.commandExecutions || metrics.fileChanges || metrics.webSearches)
  )
    throw new Error('Packet-only evaluation attempted external tools; evaluation is invalid');
  return { response, metrics };
}

module.exports = { summarizeEvents, runAgent };
