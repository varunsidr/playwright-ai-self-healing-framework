'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateManifest } = require('./build-ecommerce-monitoring');
const root = path.resolve(__dirname, '..');
const catalog = require('../specs/ecommerce/requirements/case-catalog.json');
const manifest = require('../specs/ecommerce/requirements/check-links.json');
const native = require('../specs/ecommerce/requirements/non-browser-check-links.json');
validateManifest(catalog, manifest);
for (const id of [
  ...native.checks.flatMap((check) => check.caseIds),
  ...native.manualReviews.map((review) => review.caseId),
]) {
  if (!catalog.cases.some((item) => item.id === id))
    throw new Error('Unknown non-browser case: ' + id);
}

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
const nativeCases = new Set(native.checks.flatMap((check) => check.caseIds));
const automated = new Set([...mapped, ...nativeCases]);
const lines = [
  '# Zeouf automation backlog',
  '',
  `Generated from the reviewed catalog and manifest: ${catalog.cases.length} cases; ${mapped.size} have individual browser check mappings; ${catalog.cases.length - mapped.size} have no browser check mappings.`,
  '',
  `Across browser and native/local contract layers, ${automated.size}/${catalog.cases.length} cases (${((automated.size / catalog.cases.length) * 100).toFixed(1)}%) have scoped executable coverage. ${catalog.cases.length - automated.size} have no automation mapping. This is case linkage, not a project-completion or full-acceptance percentage.`,
  '',
  'Cases without executable mappings: ' +
    catalog.cases
      .filter((item) => !automated.has(item.id))
      .map((item) => '`' + item.id + '`')
      .join(', ') +
    '.',
  '',
  'No staging environment is available. Mapped checks cover their stated frontend/read-only scopes; full case acceptance remains unassessed. Isolated browser batches cover product options, checkout/account feedback, account-scoped bags, favorites, reviews, restock, currency, admin UI, stock recovery and reviewed analytics with placeholder services, plus actual local production denials. Historical shared-cart findings remain in the archived baseline. A mapped staging case still needs authenticated integration coverage; manual and website CI cases retain their own evidence requirements.',
  '',
  'Regenerate with `npm run cases:zeouf:backlog`. Execution results and failures are in `test-results/ecommerce-monitoring.md`; this inventory does not infer pass status.',
  '',
  'Separate native automation, real disposable local Supabase concurrency checks and dated source findings are registered in `requirements/non-browser-check-links.json`; see the project status for current evidence. They do not add browser check mappings or infer full acceptance. Inspect each stage result for execution status. Hosted integration, external providers/delivery and product decisions retain their separate prerequisites.',
  '',
];
for (const item of catalog.cases) {
  if (!Object.hasOwn(prerequisites, item.environment))
    throw new Error(`Case ${item.id} has no reviewed execution environment: ${item.environment}`);
}
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
    const other = native.checks.filter((check) => check.caseIds.includes(item.id));
    const review = native.manualReviews.find((entry) => entry.caseId === item.id);
    const next = checks.length
      ? `Mapped scope: ${item.automationScope}. Review remaining acceptance: ${item.scenario}`
      : other.length
        ? `Native automation available (${other.map((check) => check.id).join(', ')}): ${other.map((check) => check.scope).join(' ')} Remaining acceptance: ${item.scenario}`
        : review
          ? `Source review recorded (${review.outcome}): ${review.scope}`
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
