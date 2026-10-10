'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const inventoryDir = path.join(root, 'specs/ecommerce/requirements');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const normalize = (value) => value.replace(/\\/g, '/');

function validateManifest(
  catalog,
  manifest,
  fileExists = (file) => fs.existsSync(path.join(root, file)),
) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.checks)) {
    throw new Error('Unsupported check manifest');
  }
  const cases = new Map(catalog.cases.map((item) => [item.id, item]));
  const ids = new Set();
  for (const check of manifest.checks) {
    if (!/^CHK-[A-Z0-9-]+$/.test(check.id) || ids.has(check.id)) {
      throw new Error(`Invalid or duplicate check ID: ${check.id}`);
    }
    ids.add(check.id);
    if (
      check.project !== 'ecommerce-chromium' ||
      !/^tests\/ecommerce\/[^.].*\.spec\.ts$/.test(check.file) ||
      check.file.includes('..') ||
      !fileExists(check.file)
    ) {
      throw new Error(`Invalid check location: ${check.id}`);
    }
    if (
      typeof check.scope !== 'string' ||
      !check.scope.trim() ||
      !Array.isArray(check.caseIds) ||
      !check.caseIds.length ||
      new Set(check.caseIds).size !== check.caseIds.length
    ) {
      throw new Error(`Missing scope or invalid case IDs: ${check.id}`);
    }
    for (const id of check.caseIds) {
      const item = cases.get(id);
      if (!item) throw new Error(`Unknown case ${id} for ${check.id}`);
      const files = item.automationFiles || [item.automationFile];
      if (!files.includes(check.file))
        throw new Error(`Check ${check.id} is outside case ${id}'s reviewed file links`);
    }
  }
}

function collectChecks(suites, parentTitles = []) {
  const entries = [];
  for (const suite of suites || []) {
    const titles = [...parentTitles, suite.title].filter(Boolean);
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        entries.push({ spec, test, title: [...titles, spec.title].join(' > ') });
      }
    }
    entries.push(...collectChecks(suite.suites, titles));
  }
  return entries;
}

function checkOutcome(test) {
  const final = test.results?.at(-1);
  if (!final) return 'not-run';
  if (test.status === 'skipped' || final.status === 'skipped') return 'skipped';
  if (final.status === 'interrupted') return 'interrupted';
  if (test.status === 'unexpected') return 'failed';
  if (!test.expectedStatus) return 'unknown';
  if (test.expectedStatus !== 'passed') return 'expected-failure';
  if (test.status === 'flaky' && final.status === 'passed') return 'flaky';
  if (test.status === 'expected' && final.status === 'passed') return 'passed';
  return 'unknown';
}

function combinedOutcome(values) {
  if (!values.length || values.every((value) => value === 'not-run')) return 'not-run';
  for (const outcome of ['failed', 'interrupted', 'unknown', 'expected-failure', 'flaky']) {
    if (values.includes(outcome)) return outcome;
  }
  if (values.every((value) => value === 'passed')) return 'passed';
  if (values.every((value) => value === 'skipped')) return 'skipped';
  return 'partial-run';
}

function buildMonitoring(catalog, manifest, inputs, fingerprints = {}) {
  validateManifest(catalog, manifest);
  const observations = new Map(manifest.checks.map((check) => [check.id, []]));
  const byId = new Map(manifest.checks.map((check) => [check.id, check]));
  const reports = [];
  const seenReports = new Set();
  for (const input of inputs) {
    if (!input.report) {
      reports.push({ file: input.file, available: false });
      continue;
    }
    if (seenReports.has(input.file)) throw new Error(`Duplicate report input: ${input.file}`);
    seenReports.add(input.file);
    const report = input.report;
    if (!Array.isArray(report.suites))
      throw new Error(`Invalid Playwright JSON report: ${input.file}`);
    const metadata = report.config?.metadata || {};
    for (const key of ['caseCatalogSha256', 'checkManifestSha256']) {
      if (metadata[key] && fingerprints[key] && metadata[key] !== fingerprints[key]) {
        throw new Error(
          `${input.file}: ${key} differs from the current inventory; use the original revision`,
        );
      }
    }
    const projects = (report.config?.projects || []).filter((project) =>
      ['ecommerce-chromium', 'ecommerce-api'].includes(project.name),
    );
    const environments = projects.map((project) => {
      // Preserve only origin, never credentials or query parameters.
      const raw = project.use?.baseURL;
      return { project: project.name, origin: raw ? new URL(raw).origin : null };
    });
    let unmappedTests = 0;
    const identities = new Map();
    for (const { spec, test, title } of collectChecks(report.suites)) {
      const annotations = (test.annotations || []).filter((item) => item.type === 'zeouf-check');
      if (!annotations.length) {
        if (['ecommerce-chromium', 'ecommerce-api'].includes(test.projectName)) unmappedTests += 1;
        continue;
      }
      if (annotations.length !== 1) throw new Error(`Expected one check ID on ${title}`);
      const check = byId.get(annotations[0].description);
      if (!check) throw new Error(`Unknown check annotation: ${annotations[0].description}`);
      const file = normalize(spec.file || '');
      const absoluteFile = path.posix.join(
        normalize(report.config?.rootDir || path.join(root, 'tests')),
        file,
      );
      const matches = file === check.file || absoluteFile.endsWith(`/${check.file}`);
      if (!matches || test.projectName !== check.project)
        throw new Error(`Report location differs for ${check.id}`);
      const identity = `${file}:${spec.id || title}`;
      if (identities.has(check.id) && identities.get(check.id) !== identity)
        throw new Error(`Check ID reused by different tests: ${check.id}`);
      identities.set(check.id, identity);
      observations.get(check.id).push({
        reportFile: input.file,
        testId: spec.id || null,
        title,
        outcome: checkOutcome(test),
        expectedStatus: test.expectedStatus || null,
        attempts: (test.results || []).map((result) => ({
          retry: result.retry || 0,
          status: result.status,
          durationMs: result.duration,
          startTime: result.startTime || null,
          attachments: (result.attachments || []).map((attachment) => ({
            name: attachment.name,
            contentType: attachment.contentType,
            path: attachment.path ? normalize(attachment.path) : null,
          })),
        })),
      });
    }
    reports.push({
      file: input.file,
      available: true,
      sha256: input.sha256 || null,
      startTime: report.stats?.startTime || null,
      codeRevision: metadata.codeRevision || null,
      websiteRevision: metadata.websiteRevision || null,
      ecommerceOrigin: metadata.ecommerceOrigin || null,
      ecommerceEnvironment: metadata.ecommerceEnvironment || null,
      inventoryRecordedAtExecution: Boolean(
        metadata.caseCatalogSha256 && metadata.checkManifestSha256,
      ),
      environments,
      runnerErrors: (report.errors || []).length,
      unmappedTests,
    });
  }
  const checks = manifest.checks.map((check) => {
    const evidence = observations.get(check.id);
    return {
      ...check,
      outcome: combinedOutcome(evidence.map((item) => item.outcome)),
      observations: evidence,
    };
  });
  const cases = catalog.cases.map((item) => {
    const linkedChecks = checks.filter((check) => check.caseIds.includes(item.id));
    return {
      id: item.id,
      requirementIds: item.requirementIds,
      environment: item.environment,
      mapping: linkedChecks.length
        ? 'checks-mapped'
        : item.automationFile
          ? 'file-linked-only'
          : 'unlinked',
      acceptance: 'not-assessed',
      checkOutcome: linkedChecks.length
        ? combinedOutcome(linkedChecks.map((check) => check.outcome))
        : 'not-run',
      checkIds: linkedChecks.map((check) => check.id),
      automationScope: item.automationScope,
    };
  });
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baseline: catalog.source,
    inventoryFingerprints: fingerprints,
    evidenceComplete:
      reports.length > 0 &&
      reports.every((report) => report.available && report.runnerErrors === 0),
    reports,
    checks,
    cases,
    summary: {
      requirements: catalog.requirementCount,
      cases: cases.length,
      checks: checks.length,
      mappedCases: cases.filter((item) => item.mapping === 'checks-mapped').length,
      fileLinkedOnlyCases: cases.filter((item) => item.mapping === 'file-linked-only').length,
      unlinkedCases: cases.filter((item) => item.mapping === 'unlinked').length,
      checkOutcomes: Object.fromEntries(
        [...new Set(checks.map((check) => check.outcome))].map((outcome) => [
          outcome,
          checks.filter((check) => check.outcome === outcome).length,
        ]),
      ),
    },
  };
}

const cell = (value) =>
  String(value ?? 'unknown')
    .replace(/\|/g, '\\|')
    .replace(/[\r\n]/g, ' ');

function renderMonitoring(data) {
  const lines = [
    '## Zeouf case execution evidence',
    '',
    `Generated: ${data.generatedAt}. Baseline: ${data.baseline}.`,
    '',
    `Cases: ${data.summary.cases}; individually mapped: ${data.summary.mappedCases}; file links only: ${data.summary.fileLinkedOnlyCases}; unlinked: ${data.summary.unlinkedCases}.`,
    '',
    'Check outcomes describe only the stated automation scope. Full case and requirement acceptance remains **not assessed**. Missing tests are not-run; skips, expected failures and retry passes are separate outcomes. No environment blocker is inferred from a skipped test.',
    '',
    `Check outcomes: ${Object.entries(data.summary.checkOutcomes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')}.`,
    '',
    `All requested reports available without runner errors: **${data.evidenceComplete}**. This does not mean all checks ran or passed.`,
    '',
    '### Reports',
    '',
    '| Report | Available | Started | Origin | Environment | Code revision | Website revision | Runner errors | Unmapped tests |',
    '| --- | --- | --- | --- | --- | --- | --- | ---: | ---: |',
  ];
  for (const report of data.reports)
    lines.push(
      `| ${cell(report.file)} | ${report.available} | ${cell(report.startTime)} | ${cell(report.ecommerceOrigin)} | ${cell(report.ecommerceEnvironment)} | ${cell(report.codeRevision)} | ${cell(report.websiteRevision)} | ${cell(report.runnerErrors)} | ${cell(report.unmappedTests)} |`,
    );
  lines.push(
    '',
    '### Individually mapped checks',
    '',
    '| Check | Cases | Outcome | Scope |',
    '| --- | --- | --- | --- |',
  );
  for (const check of data.checks)
    lines.push(
      `| ${check.id} | ${check.caseIds.join(', ')} | ${check.outcome} | ${cell(check.scope)} |`,
    );
  lines.push(
    '',
    '### Case inventory',
    '',
    '| Case | Requirements | Planned environment | Mapping | Check outcome | Acceptance |',
    '| --- | --- | --- | --- | --- | --- |',
  );
  for (const item of data.cases)
    lines.push(
      `| ${item.id} | ${item.requirementIds.join(', ')} | ${cell(item.environment)} | ${item.mapping} | ${item.checkOutcome} | ${item.acceptance} |`,
    );
  lines.push(
    '',
    'The companion JSON retains report hashes, test identities, retry attempts and attachment paths. Download the CI test-results and Playwright-report artifacts together to inspect evidence. Reports are a batch snapshot; this command does not provide historical trend storage.',
    '',
  );
  return lines.join('\n');
}

function main() {
  const catalogText = fs.readFileSync(path.join(inventoryDir, 'case-catalog.json'), 'utf8');
  const manifestText = fs.readFileSync(path.join(inventoryDir, 'check-links.json'), 'utf8');
  const reportFiles = process.argv.slice(2);
  if (!reportFiles.length) throw new Error('Supply one or more Playwright JSON report paths');
  const inputs = reportFiles.map((file) => {
    if (!fs.existsSync(file)) return { file, report: null };
    const contents = fs.readFileSync(file, 'utf8');
    return { file, report: JSON.parse(contents), sha256: hash(contents) };
  });
  const data = buildMonitoring(JSON.parse(catalogText), JSON.parse(manifestText), inputs, {
    caseCatalogSha256: hash(catalogText),
    checkManifestSha256: hash(manifestText),
  });
  fs.mkdirSync(path.join(root, 'test-results'), { recursive: true });
  const markdown = renderMonitoring(data);
  fs.writeFileSync(
    path.join(root, 'test-results/ecommerce-monitoring.json'),
    `${JSON.stringify(data, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(root, 'test-results/ecommerce-monitoring.md'), markdown);
  process.stdout.write(markdown);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${markdown}`);
  if (!data.evidenceComplete)
    console.warn(
      '::warning::Zeouf monitoring has missing reports or runner errors; inspect the report inventory.',
    );
}

if (require.main === module) main();
module.exports = {
  collectChecks,
  validateManifest,
  checkOutcome,
  combinedOutcome,
  buildMonitoring,
  renderMonitoring,
};
