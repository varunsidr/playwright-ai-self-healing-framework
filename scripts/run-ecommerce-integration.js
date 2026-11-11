'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { randomUUID, randomBytes } = require('node:crypto');
const { createRequire } = require('node:module');
const { spawn } = require('node:child_process');
const runtime = require('./ecommerce-repair/runtime');
const { nativeEnvironment, tapStats } = require('./run-ecommerce-native');
const { validateSource, revision } = require('./ecommerce-contracts/source');
const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'node_modules/supabase/dist/supabase.js');
const migrations = [
  'supabase_schema.sql',
  'supabase_reviews_migration.sql',
  'supabase_checkout_security_migration.sql',
  'supabase_demo_catalog_migration.sql',
  'supabase_purchase_safeguards_migration.sql',
  'supabase_security_hardening_migration.sql',
  'supabase_admin_catalog_migration.sql',
  'supabase_order_lifecycle_migration.sql',
  'supabase_review_workflow_migration.sql',
  'supabase_restock_delivery_migration.sql',
];
const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });

async function main(args = process.argv.slice(2)) {
  if (args.length !== 2)
    throw new Error(
      'Usage: test:ecommerce:integration -- <clean-pinned-website> <new-evidence-directory>',
    );
  const source = validateSource(args[0]),
    output = path.resolve(args[1]);
  if (fs.existsSync(output)) throw new Error('Use a new integration evidence directory');
  runtime.command('docker', ['version', '--format', '{{.Server.Version}}'], root);
  fs.mkdirSync(output, { recursive: true });
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-integration-'));
  const projectId = 'zeouf-integration-' + randomUUID();
  const website = path.join(workspace, 'website');
  const backend = path.join(workspace, 'backend');
  fs.mkdirSync(path.join(backend, 'supabase'), { recursive: true });
  const [apiPort, dbPort, shadowPort, mailPort] = await Promise.all([
    freePort(),
    freePort(),
    freePort(),
    freePort(),
  ]);
  fs.writeFileSync(
    path.join(backend, 'supabase/config.toml'),
    `project_id = "${projectId}"
[api]
enabled = true
port = ${apiPort}
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000
[db]
port = ${dbPort}
shadow_port = ${shadowPort}
major_version = 17
[db.migrations]
enabled = false
[db.seed]
enabled = false
[realtime]
enabled = false
[studio]
enabled = false
[local_smtp]
enabled = true
port = ${mailPort}
[storage]
enabled = true
file_size_limit = "10MiB"
[auth]
enabled = true
site_url = "http://127.0.0.1:3000"
additional_redirect_urls = ["http://127.0.0.1:3000/**"]
jwt_expiry = 3600
enable_signup = true
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
[analytics]
enabled = false
[edge_runtime]
enabled = false
`,
  );
  const result = {
    schemaVersion: 1,
    status: 'preparing',
    projectId,
    websiteRevision: revision,
    environment: 'local-supabase-integration',
    workspace,
    migrations,
    tests: null,
  };
  let server,
    pool,
    network = false,
    startAttempted = false;
  try {
    runtime.command('git', ['clone', '--quiet', '--no-hardlinks', source, website], root);
    runtime.command('git', ['checkout', '--quiet', '--detach', revision], website);
    await runtime.install(website, output, 'website');
    runtime.command(
      'docker',
      [
        'network',
        'create',
        '-o',
        'com.docker.network.bridge.host_binding_ipv4=127.0.0.1',
        projectId,
      ],
      root,
    );
    network = true;
    console.log('Starting disposable local Supabase services');
    startAttempted = true;
    const stderr = fs.openSync(path.join(output, 'backend-start.log'), 'w');
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          cli,
          'start',
          '--workdir',
          backend,
          '--network-id',
          projectId,
          '--exclude',
          'realtime,imgproxy,studio,postgres-meta,edge-runtime,logflare,vector,supavisor',
        ],
        { cwd: root, env: nativeEnvironment(), stdio: ['ignore', 'ignore', stderr] },
      );
      const timer = setTimeout(() => child.kill(), 600000);
      child.once('error', reject);
      child.once('close', (code) => {
        clearTimeout(timer);
        fs.closeSync(stderr);
        resolve(code);
      });
    });
    if (code !== 0) throw new Error('Local Supabase startup failed; inspect backend-start.log');
    const status = JSON.parse(
      runtime.command(
        process.execPath,
        [cli, 'status', '--workdir', backend, '--output', 'json'],
        root,
      ),
    );
    const config = {
      projectId,
      website,
      apiUrl: status.API_URL || status.api_url,
      dbUrl: status.DB_URL || status.db_url,
      anonKey: status.ANON_KEY || status.anon_key,
      serviceKey: status.SERVICE_ROLE_KEY || status.service_role_key,
      mailUrl: `http://127.0.0.1:${mailPort}`,
      appUrl: 'http://127.0.0.1:3000',
    };
    require('./ecommerce-integration/target').validate(config);
    const { Pool } = createRequire(path.join(website, 'package.json'))('pg');
    pool = new Pool({ connectionString: config.dbUrl, max: 8 });
    for (const file of migrations)
      await pool.query(fs.readFileSync(path.join(website, file), 'utf8'));
    await pool.query("NOTIFY pgrst, 'reload schema'");
    const env = {
      ...nativeEnvironment(),
      ISOLATED_BROWSER_TESTS: '1',
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: config.apiUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: config.anonKey,
      SUPABASE_SERVICE_ROLE_KEY: config.serviceKey,
      RATE_LIMIT_SECRET: randomBytes(32).toString('hex'),
      ADMIN_SESSION_SECRET: randomBytes(32).toString('hex'),
      RESEND_API_KEY: '',
      GROQ_API_KEY: '',
      OPENAI_API_KEY: '',
      TEST_API_SECRET: '',
      DEV_CREATE_USER_KEY: '',
    };
    await runtime.buildWebsite(website, output, 'website', env);
    server = await runtime.startWebsite(website, output, 'website', env);
    config.appUrl = server.url;
    const configFile = path.join(workspace, 'connection.json');
    fs.writeFileSync(configFile, JSON.stringify(config), { mode: 0o600 });
    const tests = fs
      .readdirSync(path.join(root, 'tests/ecommerce/integration'))
      .filter((file) => file.endsWith('.test.js'));
    const execution = await runtime.run(
      process.execPath,
      [
        '--test',
        '--test-concurrency=1',
        '--test-reporter=tap',
        ...tests.map((file) => path.join(root, 'tests/ecommerce/integration', file)),
      ],
      root,
      path.join(output, 'integration.log'),
      { env: { ...nativeEnvironment(), ECOMMERCE_INTEGRATION_CONFIG: configFile } },
    );
    if (execution.code !== 0)
      throw new Error('Integrated services tests failed; inspect integration.log');
    result.tests = tapStats(fs.readFileSync(path.join(output, 'integration.log'), 'utf8'));
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    server?.stop();
    await pool?.end();
    if (startAttempted) {
      try {
        runtime.command(
          process.execPath,
          [cli, 'stop', '--workdir', backend, '--project-id', projectId, '--no-backup'],
          root,
        );
        result.backendStopped = true;
      } catch {
        result.backendStopped = false;
        result.status = 'failed';
        process.exitCode = 1;
        console.error('Could not stop own disposable backend: ' + projectId);
      }
    }
    if (network) {
      try {
        runtime.command('docker', ['network', 'rm', projectId], root);
      } catch {
        /* Own network retained for inspection. */
      }
    }
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('Local Supabase integration: ' + result.status + '. Evidence: ' + output);
  }
  return result;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
