'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { createRequire } = require('node:module');
const ts = require('typescript');
const runtime = require('../ecommerce-repair/runtime');

const revision = require('../ecommerce-project').websiteRevision;
const environment = Object.freeze({
  NEXT_PUBLIC_SUPABASE_URL: 'https://contract-fixture.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'contract-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'contract-service-key',
});

function validateSource(value) {
  if (!value) throw new Error('Supply a clean pinned Zeouf checkout; no public target is used.');
  const source = path.resolve(value);
  if (
    runtime.command('git', ['rev-parse', 'HEAD'], source) !== revision ||
    runtime.command('git', ['status', '--porcelain', '--untracked-files=no'], source)
  )
    throw new Error('Contract tests require the clean reviewed Zeouf revision ' + revision);
  return source;
}

const source = () => validateSource(process.env.ECOMMERCE_CONTRACT_SOURCE);
const websiteRequire = () => createRequire(path.join(source(), 'package.json'));
const read = (file) => fs.readFileSync(path.join(source(), file), 'utf8');
const fingerprint = (files) =>
  Object.fromEntries(
    files.map((file) => [file, createHash('sha256').update(read(file)).digest('hex')]),
  );

/** Execute the actual pinned handler with explicit local dependencies; unknown imports fail. */
function load(file, dependencies = {}, env = environment) {
  const compiled = ts.transpileModule(read(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require(name) {
      if (!Object.hasOwn(dependencies, name)) throw new Error('Unmocked contract import: ' + name);
      return dependencies[name];
    },
    process: { env: { ...env } },
    Request,
    Response,
    Headers,
    URL,
    console,
    fetch() {
      throw new Error('Contract tests must never make network requests');
    },
  });
  new vm.Script(compiled, { filename: file }).runInContext(context, { timeout: 10000 });
  return module.exports;
}

function handler(file, createClient, options = {}) {
  return load(
    file,
    {
      'next/server': { NextResponse: websiteRequire()('next/server').NextResponse },
      '@supabase/supabase-js': { createClient },
      '@/lib/rateLimit': {
        getClientAddress: () => 'contract-fixture',
        isRateLimited: async () => (options.limited === undefined ? false : options.limited),
      },
      '@/lib/reviewImages': load('src/lib/reviewImages.ts'),
    },
    { ...environment, ...options.env },
  );
}

module.exports = {
  revision,
  environment,
  validateSource,
  source,
  websiteRequire,
  read,
  fingerprint,
  handler,
};
