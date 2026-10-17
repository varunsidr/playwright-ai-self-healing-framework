'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const core = require('./core');
const { validatePublication } = require('./publish');
const runtime = require('./runtime');
const { gateProposal } = require('./ci');

test('failure packets reject stale inventories, unmapped checks and mismatched test files', () => {
  const root = path.resolve(__dirname, '../..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-packet-test-'));
  const catalog = fs.readFileSync(
    path.join(root, 'specs/ecommerce/requirements/case-catalog.json'),
  );
  const manifest = fs.readFileSync(
    path.join(root, 'specs/ecommerce/requirements/check-links.json'),
  );
  fs.mkdirSync(path.join(temp, 'specs/ecommerce/requirements'), { recursive: true });
  fs.writeFileSync(path.join(temp, 'specs/ecommerce/requirements/case-catalog.json'), catalog);
  fs.writeFileSync(path.join(temp, 'specs/ecommerce/requirements/check-links.json'), manifest);
  for (const file of new Set(JSON.parse(manifest).checks.map((item) => item.file))) {
    fs.mkdirSync(path.dirname(path.join(temp, file)), { recursive: true });
    fs.writeFileSync(path.join(temp, file), '');
  }
  const check = JSON.parse(manifest).checks[0];
  const testResult = {
    projectName: 'ecommerce-chromium',
    expectedStatus: 'passed',
    status: 'unexpected',
    annotations: [{ type: 'zeouf-check', description: check.id }],
    results: [{ status: 'failed', errors: [{ message: 'Actual browser assertion failure' }] }],
  };
  const report = {
    config: {
      metadata: { caseCatalogSha256: core.hash(catalog), checkManifestSha256: core.hash(manifest) },
    },
    errors: [],
    suites: [{ specs: [{ file: check.file, title: 'Recorded failure', tests: [testResult] }] }],
  };
  const file = path.join(temp, 'report.json');
  const packet = () => {
    fs.writeFileSync(file, JSON.stringify(report));
    return core.packetFromReports(temp, [file]);
  };
  assert.equal(packet().failures[0].checkId, check.id);
  report.config.metadata.caseCatalogSha256 = 'old';
  assert.throws(packet, /fingerprint/);
  report.config.metadata.caseCatalogSha256 = core.hash(catalog);
  testResult.annotations[0].description = 'UNKNOWN';
  assert.match(packet().blockers[0], /Unmapped/);
  testResult.annotations[0].description = check.id;
  report.suites[0].specs[0].file = 'tests/ecommerce/wrong.spec.ts';
  assert.throws(packet, /file mismatch/);
});

test('publishing rejects forged success, missing checks and changed patch or report bytes', () => {
  const patch = Buffer.from('verified-patch');
  const report = {
    config: { metadata: { caseCatalogSha256: 'catalog', checkManifestSha256: 'manifest' } },
    errors: [],
    suites: [
      {
        specs: [
          {
            tests: [
              {
                projectName: 'ecommerce-chromium',
                expectedStatus: 'passed',
                status: 'expected',
                annotations: [{ type: 'zeouf-check', description: 'CHK-ORIGINAL' }],
                results: [{ status: 'passed' }],
              },
            ],
          },
        ],
      },
    ],
  };
  const raw = Buffer.from(JSON.stringify(report));
  const proposal = {
    status: 'verified-candidate',
    role: 'framework',
    files: ['pages/ecommerce-storefront-page.ts'],
    frameworkRevision: 'a'.repeat(40),
    websiteRevision: 'b'.repeat(40),
    patchSha256: core.hash(patch),
    verification: {
      passed: true,
      reportSha256: core.hash(raw),
      expectedCheckIds: ['CHK-ORIGINAL'],
      inventoryHashes: report.config.metadata,
    },
  };
  assert.equal(
    validatePublication(proposal, patch, raw),
    'varunsidr/playwright-ai-self-healing-framework',
  );
  assert.throws(
    () => validatePublication({ ...proposal, status: 'unverified-proposal' }, patch, raw),
    /independently/,
  );
  assert.throws(() => validatePublication(proposal, Buffer.from('changed'), raw), /patch digest/);
  assert.throws(() => validatePublication(proposal, patch, Buffer.from('{}')), /report digest/);
  proposal.verification.expectedCheckIds.push('CHK-MISSING');
  assert.throws(() => validatePublication(proposal, patch, raw), /complete clean/);
});

test('the proposal gate detects cross-repository edits and behavior changes in an isolated git checkout', () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'zeouf-gate-test-'));
  const framework = path.join(workspace, 'framework'),
    website = path.join(workspace, 'website');
  const page = 'pages/ecommerce-storefront-page.ts',
    source = 'src/components/ProductListing.tsx';
  const write = (root, file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), value);
  };
  const before = "class Page { submit() { return this.page.getByTestId('old-id').click(); } }";
  write(framework, page, before);
  write(framework, 'tests/ecommerce/unchanged.spec.ts', 'assert original expected behavior');
  write(website, source, 'return category.includes(subCategory);');
  for (const file of ['docs/BRD.md', 'docs/QA_TESTING_GUIDE.md'])
    write(website, file, '| CAT-01 | Women and Men remain distinct |\n');
  const baselines = {};
  for (const [role, root] of Object.entries({ framework, website })) {
    runtime.command('git', ['init', '--quiet'], root);
    runtime.command('git', ['add', '.'], root);
    runtime.command(
      'git',
      [
        '-c',
        'user.name=Repair Test',
        '-c',
        'user.email=test@example.invalid',
        '-c',
        'core.hooksPath=.disabled',
        'commit',
        '--quiet',
        '-m',
        'Baseline',
      ],
      root,
    );
    baselines[role] = { baseline: runtime.command('git', ['rev-parse', 'HEAD'], root) };
  }
  const state = {
    framework,
    website,
    role: 'framework',
    baselines,
    frozen: {
      framework: runtime.trackedHashes(framework),
      website: runtime.trackedHashes(website),
    },
  };
  write(framework, page, before.replace('old-id', 'current-id'));
  assert.deepEqual(gateProposal(state, { blockers: [] }, {}, { requirements: [] }), [page]);
  write(website, source, 'tampered other repository');
  assert.throws(
    () => gateProposal(state, { blockers: [] }, {}, { requirements: [] }),
    /protected repository/,
  );
  write(website, source, 'return category.includes(subCategory);');
  write(framework, page, before.replace('click()', 'evaluate(() => true)'));
  assert.throws(
    () => gateProposal(state, { blockers: [] }, {}, { requirements: [] }),
    /literal repairs only/,
  );
  assert.throws(
    () => gateProposal(state, { blockers: ['Unavailable'] }, {}, { requirements: [] }),
    /blockers/,
  );
});

test('website documentation can record a source review without weakening acceptance or retiring gaps', () => {
  const before = '| CAT-01 | Women and Men remain distinct |\n| G-01 | Staging unavailable |\n';
  core.validateWebsiteDocs(
    before,
    before + '\nCAT-01 source repair reviewed. Local verification pending.\n',
  );
  assert.throws(
    () => core.validateWebsiteDocs(before, before.replace('remain distinct', 'may overlap')),
    /acceptance rows/,
  );
  assert.throws(
    () => core.validateWebsiteDocs(before, before.replace('| G-01 | Staging unavailable |\n', '')),
    /acceptance rows/,
  );
});

test('candidate builds receive placeholder services and no inherited API or admin secrets', () => {
  const keys = [
    'OPENAI_API_KEY',
    'GH_TOKEN',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ECOMMERCE_TEST_USER_PASSWORD',
  ];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) process.env[key] = 'test-secret';
    const clean = runtime.cleanEnvironment(),
      website = runtime.websiteEnvironment();
    for (const key of keys) assert.equal(clean[key], undefined);
    assert.equal(website.OPENAI_API_KEY, '');
    assert.equal(website.SUPABASE_SERVICE_ROLE_KEY, '');
    assert.match(website.NEXT_PUBLIC_SUPABASE_URL, /\.invalid$/);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
