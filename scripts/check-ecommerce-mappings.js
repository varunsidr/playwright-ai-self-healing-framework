'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { collectChecks, validateManifest } = require('./build-ecommerce-monitoring');

const root = path.resolve(__dirname, '..');
const inventory = path.join(root, 'specs/ecommerce/requirements');

function validateDiscovery(catalog, manifest, report) {
  validateManifest(catalog, manifest);
  if (report.errors?.length) throw new Error(JSON.stringify(report.errors));
  const tests = collectChecks(report.suites).filter(
    ({ test }) => test.projectName === 'ecommerce-chromium',
  );
  const normalizeFile = (file) => file.replace(/\\/g, '/').replace(/^tests\//, '');
  for (const check of manifest.checks) {
    const matches = tests.filter(
      ({ spec, test }) =>
        normalizeFile(spec.file) === normalizeFile(check.file) &&
        (check.testTitle
          ? spec.title === check.testTitle
          : (test.annotations || []).some(
              (annotation) =>
                annotation.type === 'zeouf-check' && annotation.description === check.id,
            )),
    );
    if (matches.length !== 1)
      throw new Error(`${check.id}: expected one discovered test, found ${matches.length}`);
    const annotations = (matches[0].test.annotations || []).filter(
      (item) => item.type === 'zeouf-check',
    );
    if (annotations.length && (annotations.length !== 1 || annotations[0].description !== check.id))
      throw new Error(`${check.id}: conflicting source annotation`);
  }
  const selectors = new Set();
  for (const check of manifest.checks.filter((item) => item.testTitle)) {
    const key = `${check.file}:${check.testTitle}`;
    if (selectors.has(key)) throw new Error(`Duplicate test selector: ${key}`);
    selectors.add(key);
  }
  return {
    checks: manifest.checks.length,
    cases: new Set(manifest.checks.flatMap((check) => check.caseIds)).size,
  };
}

function main() {
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, 'node_modules/@playwright/test/cli.js'),
      'test',
      '--project=ecommerce-chromium',
      '--list',
      '--reporter=json',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const catalog = JSON.parse(fs.readFileSync(path.join(inventory, 'case-catalog.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(inventory, 'check-links.json'), 'utf8'));
  const counts = validateDiscovery(catalog, manifest, JSON.parse(result.stdout));
  console.log(
    `Validated ${counts.checks} unique executable checks for ${counts.cases}/${catalog.cases.length} cases. Acceptance remains separately assessed.`,
  );
}

if (require.main === module) main();
module.exports = { validateDiscovery };
