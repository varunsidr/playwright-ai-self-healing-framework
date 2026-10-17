'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateManifest } = require('./build-ecommerce-monitoring');
const root = path.resolve(__dirname, '..');
const catalog = require('../specs/ecommerce/requirements/case-catalog.json');
const manifest = require('../specs/ecommerce/requirements/check-links.json');
validateManifest(catalog, manifest);

const prerequisites = {
  'public-read-only': 'Read-only deployed Zeouf; block non-read requests.',
  'isolated-fixture':
    'Controlled local Zeouf runtime/configuration and deterministic responses; no live backend credentials. Mocks establish frontend behavior only.',
  'isolated-staging':
    'Separate Zeouf HTTPS site and database; disposable customer/admin identities, seeded products/stock, verified reset/cleanup and test inbox where relevant.',
  'website-repository-ci':
    'Zeouf website checkout and its native documentation/build/browser CI. Collect native evidence separately from browser case monitoring.',
  'manual-review':
    'Business/QA review of scope or unused functionality; automated checks cannot replace the decision.',
};
const escape = (text) =>
  String(text || '')
    .replaceAll('|', '\\|')
    .replace(/\r?\n/g, ' ');
const mapped = new Set(manifest.checks.flatMap((check) => check.caseIds));
const lines = [
  '# Zeouf automation backlog',
  '',
  `Generated from the reviewed catalog and manifest: ${catalog.cases.length} cases; ${mapped.size} have individual automated check mappings; ${catalog.cases.length - mapped.size} have no individual checks.`,
  '',
  'No staging environment is available. Mapped checks cover their stated frontend/read-only scopes; full case acceptance remains unassessed. A mapped staging case still needs authenticated integration coverage. Local fixture work remains a separate next batch; manual and website CI cases retain their own evidence requirements.',
  '',
  'Regenerate with `npm run cases:zeouf:backlog`. Execution results and failures are in `test-results/ecommerce-monitoring.md`; this inventory does not infer pass status.',
  '',
];
for (const environment of Object.keys(prerequisites)) {
  const cases = catalog.cases.filter((item) => item.environment === environment);
  lines.push(
    `## ${environment}`,
    '',
    prerequisites[environment],
    '',
    '| Case | Requirements | Checks | Remaining scope / next action |',
    '| --- | --- | ---: | --- |',
  );
  for (const item of cases) {
    const checks = manifest.checks.filter((check) => check.caseIds.includes(item.id));
    const next = checks.length
      ? `Mapped scope: ${item.automationScope}. Review remaining acceptance: ${item.scenario}`
      : `Pending automation: ${item.scenario}`;
    lines.push(
      `| ${item.id} | ${item.requirementIds.join(', ')} | ${checks.length} | ${escape(next)} |`,
    );
  }
  lines.push('');
}
fs.writeFileSync(path.join(root, 'specs/ecommerce/automation-backlog.md'), lines.join('\n'));
console.log(
  `Wrote backlog for ${catalog.cases.length} cases (${mapped.size} individually mapped).`,
);
