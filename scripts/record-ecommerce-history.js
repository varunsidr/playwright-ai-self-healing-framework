'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { collectChecks, checkOutcome } = require('./build-ecommerce-monitoring');
const digest = (value) => createHash('sha256').update(value).digest('hex');

function record(reportFile, directory) {
  const bytes = fs.readFileSync(reportFile);
  const report = JSON.parse(bytes);
  const id = digest(bytes);
  const metadata = report.config?.metadata || {};
  let comparisonOrigin = metadata.ecommerceOrigin || null;
  if (metadata.ecommerceEnvironment === 'isolated-browser-fixture' && comparisonOrigin) {
    const target = new URL(comparisonOrigin);
    if (['127.0.0.1', 'localhost'].includes(target.hostname))
      comparisonOrigin = 'local:isolated-browser-fixture';
  }
  const completeIdentity =
    /^[a-f0-9]{40}$/.test(metadata.codeRevision || '') &&
    /^[a-f0-9]{40}$/.test(metadata.websiteRevision || '');
  const entry = {
    schemaVersion: 1,
    id,
    sourceReport: path.resolve(reportFile),
    startTime: report.stats?.startTime || null,
    frameworkRevision: metadata.codeRevision || null,
    websiteRevision: metadata.websiteRevision || null,
    origin: metadata.ecommerceOrigin || null,
    comparisonOrigin,
    environment: metadata.ecommerceEnvironment || null,
    caseCatalogSha256: metadata.caseCatalogSha256 || null,
    checkManifestSha256: metadata.checkManifestSha256 || null,
    comparisonEligible:
      completeIdentity && Boolean(metadata.caseCatalogSha256 && metadata.checkManifestSha256),
    runnerErrors: (report.errors || []).length,
    checks: collectChecks(report.suites || []).map(({ spec, test, title }) => ({
      file: spec.file,
      title,
      project: test.projectName,
      repeatIndex: test.repeatEachIndex || 0,
      checkId:
        (test.annotations || []).find((item) => item.type === 'zeouf-check')?.description || null,
      outcome: checkOutcome(test),
      firstAttempt: test.results?.[0]?.status || 'not-run',
      attempts: (test.results || []).map((item) => ({
        status: item.status,
        retry: item.retry || 0,
        durationMs: item.duration,
      })),
    })),
  };
  fs.mkdirSync(path.join(directory, 'runs'), { recursive: true });
  const destination = path.join(directory, 'runs', id + '.json');
  if (!fs.existsSync(destination))
    fs.writeFileSync(destination, JSON.stringify(entry, null, 2) + '\n', { flag: 'wx' });
  const runs = fs
    .readdirSync(path.join(directory, 'runs'))
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(directory, 'runs', file), 'utf8')))
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  const groups = new Map();
  for (const run of runs.filter((item) => item.comparisonEligible)) {
    for (const check of run.checks) {
      const key = JSON.stringify([
        run.frameworkRevision,
        run.websiteRevision,
        run.comparisonOrigin || run.origin,
        run.environment,
        run.caseCatalogSha256,
        run.checkManifestSha256,
        check.project,
        check.file,
        check.title,
      ]);
      const group = groups.get(key) || {
        frameworkRevision: run.frameworkRevision,
        websiteRevision: run.websiteRevision,
        comparisonOrigin: run.comparisonOrigin || run.origin,
        environment: run.environment,
        caseCatalogSha256: run.caseCatalogSha256,
        checkManifestSha256: run.checkManifestSha256,
        project: check.project,
        file: check.file,
        title: check.title,
        observations: 0,
        firstAttemptFailures: 0,
        flakyResults: 0,
      };
      group.observations++;
      if (['failed', 'timedOut', 'interrupted'].includes(check.firstAttempt))
        group.firstAttemptFailures++;
      if (check.outcome === 'flaky') group.flakyResults++;
      groups.set(key, group);
    }
  }
  const summary = {
    schemaVersion: 1,
    runs: runs.map(({ checks, ...run }) => ({
      ...run,
      testObservations: checks.length,
      failed: checks.filter((check) => check.outcome === 'failed').length,
      flaky: checks.filter((check) => check.outcome === 'flaky').length,
    })),
    comparableGroups: [...groups.values()],
    note: 'Unknown revisions are retained but excluded from comparative rates. Observations and repetitions are not testcase coverage.',
  };
  fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
  return entry;
}
if (require.main === module) {
  if (process.argv[2] === '--ci') {
    const reports = [
      'test-results/ecommerce-results.json',
      'test-results/ecommerce-read-only-results.json',
      'test-results/ecommerce-isolated/results.json',
    ].filter((file) => fs.existsSync(file));
    if (!reports.length)
      throw new Error('No Zeouf reports were produced; history cannot be recorded');
    for (const file of reports) {
      const entry = record(file, 'test-results/history');
      console.log('Recorded immutable test history: ' + entry.id);
    }
  } else {
    const entry = record(
      path.resolve(process.argv[2]),
      path.resolve(process.argv[3] || 'test-results/history'),
    );
    console.log('Recorded immutable test history: ' + entry.id);
  }
}
module.exports = { record };
