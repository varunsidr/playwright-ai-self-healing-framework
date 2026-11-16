'use strict';

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const core = require('./core');
const { collectChecks, checkOutcome } = require('../build-ecommerce-monitoring');

function cleanEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !/TOKEN|SECRET|PASSWORD|API_KEY|SERVICE_ROLE|SUPABASE|SMTP|RESEND|GROQ|ADMIN_|^NODE_OPTIONS$|^PW_|^ECOMMERCE_|^OPENAI_/i.test(
          key,
        ),
    ),
  );
}
function websiteEnvironment() {
  return {
    ...cleanEnvironment(),
    ISOLATED_BROWSER_TESTS: '1',
    NODE_ENV: 'production',
    NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.co.catalog-fixture.invalid',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'isolated-browser-fixture-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: '',
    RESEND_API_KEY: '',
    GROQ_API_KEY: '',
    OPENAI_API_KEY: '',
    TEST_API_SECRET: '',
    DEV_CREATE_USER_KEY: '',
  };
}
function command(binary, args, cwd, options = {}) {
  const { raw = false, ...processOptions } = options;
  const result = spawnSync(binary, args, {
    cwd,
    encoding: 'utf8',
    env: cleanEnvironment(),
    timeout: 120000,
    maxBuffer: 12 * 1024 * 1024,
    ...processOptions,
  });
  if (result.error || result.status !== 0)
    throw new Error(
      `Command failed: ${path.basename(binary)} ${args.slice(0, 3).join(' ')}\n${result.error?.message || result.stderr || result.stdout}`,
    );
  return raw ? result.stdout : result.stdout.trim();
}
function makeWorkspace() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-repair-'));
}
function npmCli() {
  const choices = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
  ].filter(Boolean);
  const found = choices.find((item) => fs.existsSync(item));
  if (!found) throw new Error('Run the repair command through npm so npm_execpath is available');
  return found;
}
function run(binary, args, cwd, logFile, options = {}) {
  console.log(`Running ${path.basename(logFile)}`);
  return new Promise((resolve, reject) => {
    const log = fs.openSync(logFile, 'w');
    const child = spawn(binary, args, {
      cwd,
      env: cleanEnvironment(),
      stdio: ['pipe', log, log],
      ...options,
    });
    const timer = setTimeout(() => child.kill(), options.timeout || 600000);
    let closed = false;
    const closeLog = () => {
      if (!closed) {
        closed = true;
        fs.closeSync(log);
      }
    };
    child.on('error', (error) => {
      clearTimeout(timer);
      closeLog();
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      closeLog();
      resolve({ code, signal });
    });
    child.stdin.end(options.input || '');
  });
}
function snapshot(source, destination, overlay = false) {
  const revision = command('git', ['rev-parse', 'HEAD'], source);
  command(
    'git',
    ['clone', '--config', 'core.autocrlf=false', '--no-hardlinks', '--quiet', source, destination],
    source,
  );
  command('git', ['checkout', '--quiet', '--detach', revision], destination);
  if (overlay) {
    const files = command(
      'git',
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
      source,
    )
      .split('\0')
      .filter(Boolean);
    for (const file of files) {
      if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example')) continue;
      const sourceFile = core.safePath(source, file),
        target = core.safePath(destination, file);
      if (!fs.existsSync(sourceFile)) {
        if (fs.existsSync(target)) fs.unlinkSync(target);
        continue;
      }
      if (fs.lstatSync(sourceFile).isSymbolicLink())
        throw new Error('Source symlinks are not copied into repair snapshots');
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(sourceFile, target);
    }
  }
  command('git', ['add', '--all'], destination);
  command(
    'git',
    [
      '-c',
      'user.name=Zeouf Repair Snapshot',
      '-c',
      'user.email=repair-snapshot@example.invalid',
      '-c',
      'core.hooksPath=.disabled-repair-hooks',
      'commit',
      '--allow-empty',
      '--quiet',
      '-m',
      'Record isolated repair baseline',
    ],
    destination,
  );
  return { sourceRevision: revision, baseline: command('git', ['rev-parse', 'HEAD'], destination) };
}
function sourceEvidence(framework, website, packet) {
  const sources = {
    'observed-failures': packet.failures
      .map((item) => `${item.checkId}: ${item.title}\n${item.errors.join('\n')}`)
      .join('\n\n'),
    requirements: packet.requirements.map((item) => `${item.id}: ${item.acceptance}`).join('\n'),
  };
  for (const failure of packet.failures)
    for (const [index, item] of (failure.evidence || []).entries())
      sources[`browser/${failure.checkId}/${index}-${item.name}`] =
        `Attempt ${item.attempt}; retry ${item.retry}; artifact SHA256 ${item.sha256}; truncated ${item.truncated}\n${item.content}`;
  for (const file of new Set([
    ...packet.failures.map((item) => item.file),
    'pages/ecommerce-storefront-page.ts',
  ]))
    sources[`framework/${file}`] = fs.readFileSync(core.safePath(framework, file), 'utf8');
  const groups = new Set(
    packet.cases.flatMap((item) => item.requirementIds.map((id) => id.split('-')[0])),
  );
  const files = new Set();
  if (groups.has('CAT')) files.add('src/components/ProductListing.tsx');
  if (['NAV', 'AUTH', 'CART'].some((item) => groups.has(item)))
    files.add('src/components/Navbar.tsx');
  if (groups.has('CNT')) files.add('src/components/Footer.tsx');
  if (groups.has('PDP') || groups.has('REV')) files.add('src/components/ProductDetailView.tsx');
  if (groups.has('SEA')) files.add('src/app/arama/page.tsx');
  for (const file of files)
    if (fs.existsSync(core.safePath(website, file)))
      sources[`website/${file}`] = fs.readFileSync(core.safePath(website, file), 'utf8');
  return sources;
}
async function codex(cwd, prompt, schemaFile, resultFile, logFile, readOnly, options = {}) {
  const env = cleanEnvironment();
  if (!options.chatgpt && process.env.CODEX_API_KEY) env.CODEX_API_KEY = process.env.CODEX_API_KEY;
  // An empty table merges with project/user configuration; disable resolved servers explicitly.
  const binary = process.env.REPAIR_CODEX_BIN || 'codex';
  const authentication = options.chatgpt ? chatgptConfiguration(binary, cwd, env) : [];
  const servers = JSON.parse(
    command(binary, [...authentication, 'mcp', 'list', '--json'], cwd, { env }),
  );
  const disabledServers = disableMcpServers(servers);
  const resolved = JSON.parse(
    command(binary, [...authentication, ...disabledServers, 'mcp', 'list', '--json'], cwd, { env }),
  );
  if (resolved.some((server) => server.enabled))
    throw new Error('Recorded-evidence mode still has an enabled MCP server');
  fs.writeFileSync(
    logFile + '.capabilities.json',
    JSON.stringify(
      {
        mode: 'recorded-evidence',
        authentication: options.chatgpt ? 'chatgpt' : 'inherited',
        disabledMcpServers: servers.map((server) => server.name),
        resolvedMcpServers: resolved.map((server) => ({
          name: server.name,
          enabled: server.enabled,
        })),
      },
      null,
      2,
    ),
  );
  const result = await run(
    binary,
    [
      'exec',
      ...authentication,
      ...(options.chatgpt ? ['--json'] : []),
      '--sandbox',
      readOnly ? 'read-only' : 'workspace-write',
      '--ephemeral',
      '--color',
      'never',
      ...disabledServers,
      '--output-schema',
      schemaFile,
      '--output-last-message',
      resultFile,
      '-',
    ],
    cwd,
    logFile,
    { env, input: prompt, timeout: 300000 },
  );
  if (result.code !== 0 || !fs.existsSync(resultFile))
    throw new Error(`Agent failed (${result.code}); inspect ${path.basename(logFile)}`);
  return JSON.parse(fs.readFileSync(resultFile, 'utf8'));
}
function chatgptConfiguration(binary, cwd, env, execute = spawnSync) {
  const status = execute(binary, ['login', 'status'], {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  });
  if (
    status.error ||
    status.status !== 0 ||
    !/Logged in using ChatGPT/i.test((status.stdout || '') + (status.stderr || ''))
  )
    throw new Error(
      'Sign in locally with codex login using ChatGPT; API-key authentication is not accepted by this pilot',
    );
  return ['-c', 'forced_login_method="chatgpt"', '-c', 'model_provider="openai"'];
}
function disableMcpServers(servers) {
  const entries = servers.map((server) => {
    if (typeof server.name !== 'string' || !/^[a-zA-Z0-9_:@/.-]+$/.test(server.name))
      throw new Error('Unsupported MCP server name; cannot safely address its CLI configuration');
    // Quote keys inside the TOML value; CLI dotted-key segments are not unquoted.
    return `${JSON.stringify(server.name)}={enabled=false}`;
  });
  return entries.length ? ['-c', `mcp_servers={${entries.join(',')}}`] : [];
}
function trackedHashes(root) {
  const files = command('git', ['ls-files', '-z'], root).split('\0').filter(Boolean);
  return Object.fromEntries(
    files.map((file) => [file, core.hash(fs.readFileSync(core.safePath(root, file)))]),
  );
}
function assertFrozen(root, hashes) {
  const now = trackedHashes(root);
  const fresh = command('git', ['ls-files', '--others', '--exclude-standard', '-z'], root);
  if (fresh || JSON.stringify(now) !== JSON.stringify(hashes))
    throw new Error('The protected repository changed during repair');
}
function changedFiles(root, baseline, role) {
  if (command('git', ['rev-parse', 'HEAD'], root) !== baseline)
    throw new Error('Agent changed the baseline commit');
  const fresh = command('git', ['ls-files', '--others', '--exclude-standard', '-z'], root)
    .split('\0')
    .filter(Boolean);
  core.validateChangedFiles(role, [
    ...command('git', ['diff', '--name-only', baseline], root).split('\n').filter(Boolean),
    ...fresh,
  ]);
  if (fresh.length) command('git', ['add', '--intent-to-add', '--', ...fresh], root);
  const files = command('git', ['diff', '--name-only', baseline], root).split('\n').filter(Boolean);
  for (const file of files)
    if (fs.lstatSync(core.safePath(root, file)).isSymbolicLink())
      throw new Error('Repair symlinks are forbidden');
  return files;
}
async function install(root, directory, label) {
  const result = await run(
    process.execPath,
    [npmCli(), 'ci', '--no-audit', '--no-fund'],
    root,
    path.join(directory, `${label}-install.log`),
  );
  if (result.code !== 0) throw new Error(`${label} dependency installation failed`);
}
async function buildWebsite(website, directory, label, env = websiteEnvironment()) {
  for (const [name, args] of [
    ['lint', [npmCli(), 'run', 'lint']],
    ['typecheck', [path.join(website, 'node_modules/typescript/bin/tsc'), '--noEmit']],
    ['build', [npmCli(), 'run', 'build']],
  ]) {
    const result = await run(
      process.execPath,
      args,
      website,
      path.join(directory, `${label}-${name}.log`),
      { env },
    );
    if (result.code !== 0) throw new Error(`Website ${name} failed; inspect ${label}-${name}.log`);
  }
}
async function startWebsite(website, directory, label, env = websiteEnvironment()) {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const value = server.address().port;
      server.close(() => resolve(value));
    });
  });
  const log = fs.openSync(path.join(directory, `${label}-server.log`), 'w');
  const server = spawn(
    process.execPath,
    [
      path.join(website, 'node_modules/next/dist/bin/next'),
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      String(port),
    ],
    { cwd: website, env, stdio: ['ignore', log, log] },
  );
  server.once('error', () => {});
  const url = `http://127.0.0.1:${port}`;
  const stop = () => {
    server.kill();
    fs.closeSync(log);
  };
  for (let attempt = 0; attempt < 150; attempt++) {
    if (server.exitCode !== null) {
      stop();
      throw new Error('Local website server exited before readiness');
    }
    try {
      const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return { url, stop };
    } catch {
      /* Readiness probe; no writes. */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  stop();
  throw new Error('Local website readiness timed out');
}
async function browserRun(
  framework,
  packet,
  directory,
  label,
  url,
  related = false,
  fullPublic = false,
) {
  const reportFile = path.join(directory, `${label}-results.json`);
  const files = fullPublic
    ? require('../run-ecommerce-read-only').files
    : [...new Set(packet.failures.map((item) => item.file))];
  if (related) files.push('tests/ecommerce/seed.spec.ts');
  if (related && packet.cases.some((item) => item.requirementIds.includes('CAT-01')))
    files.push(
      'tests/ecommerce/catalog-fixture.spec.ts',
      'tests/ecommerce/catalog-refinements-fixture.spec.ts',
      'tests/ecommerce/seed.spec.ts',
    );
  const titles = packet.failures
    .map((item) => item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const args = [
    path.join(framework, 'node_modules/@playwright/test/cli.js'),
    'test',
    ...new Set(files),
    '--project=ecommerce-chromium',
    '--workers=3',
    '--retries=0',
  ];
  if (!related && !fullPublic) args.push('--grep', titles);
  const result = await run(
    process.execPath,
    args,
    framework,
    path.join(directory, `${label}-runner.log`),
    {
      env: {
        ...cleanEnvironment(),
        ECOMMERCE_BASE_URL: url,
        ECOMMERCE_STAGING_CONFIRMED: 'false',
        PW_OUTPUT_DIR: path.join(framework, '..', `${label}-artifacts`),
        PW_HTML_REPORT_DIR: path.join(directory, label, 'html'),
        PW_JSON_REPORT_PATH: reportFile,
        PW_ALLURE_RESULTS_DIR: path.join(directory, label, 'allure'),
      },
    },
  );
  if (!fs.existsSync(reportFile)) throw new Error('Browser verification produced no report');
  // Keep raw report attachment paths intact and also archive the actual browser evidence.
  const artifacts = path.join(framework, '..', `${label}-artifacts`);
  if (fs.existsSync(artifacts))
    fs.cpSync(artifacts, path.join(directory, label, 'artifacts'), { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${label}-artifact-index.json`),
    JSON.stringify({ originalRoot: artifacts, archivedRoot: `${label}/artifacts` }, null, 2) + '\n',
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(framework, 'specs/ecommerce/requirements/check-links.json'), 'utf8'),
  );
  const expectedCheckIds =
    related || fullPublic
      ? manifest.checks.filter((item) => files.includes(item.file)).map((item) => item.id)
      : packet.failures.map((item) => item.checkId);
  return {
    code: result.code,
    report: JSON.parse(fs.readFileSync(reportFile, 'utf8')),
    reportFile,
    expectedCheckIds,
  };
}
function reproduced(packet, run) {
  if (run.code !== 1 || run.report.errors?.length) return false;
  const failures = new Set(
    collectChecks(run.report.suites)
      .filter(({ test }) => checkOutcome(test) === 'failed')
      .flatMap(({ test }) =>
        (test.annotations || [])
          .filter((item) => item.type === 'zeouf-check')
          .map((item) => item.description),
      ),
  );
  return (
    failures.size === packet.failures.length &&
    packet.failures.every((item) => failures.has(item.checkId))
  );
}

module.exports = {
  cleanEnvironment,
  websiteEnvironment,
  command,
  makeWorkspace,
  npmCli,
  run,
  snapshot,
  sourceEvidence,
  codex,
  disableMcpServers,
  chatgptConfiguration,
  trackedHashes,
  assertFrozen,
  changedFiles,
  install,
  buildWebsite,
  startWebsite,
  browserRun,
  reproduced,
};
