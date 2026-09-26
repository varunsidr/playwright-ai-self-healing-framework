'use strict';

const fs = require('node:fs');
const path = require('node:path');

function collectTests(suites, parentTitles = []) {
  const tests = [];

  for (const suite of suites || []) {
    const titles = suite.title ? [...parentTitles, suite.title] : parentTitles;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        tests.push({
          title: [...titles, spec.title].filter(Boolean).join(' > '),
          project: test.projectName || test.projectId || 'unknown',
          status: test.status || 'unknown',
          results: test.results || [],
        });
      }
    }
    tests.push(...collectTests(suite.suites, titles));
  }

  return tests;
}

function resultErrors(result) {
  const errors = Array.isArray(result.errors) ? result.errors : result.error ? [result.error] : [];
  return errors
    .map((error) => {
      if (typeof error === 'string') return error;
      return [error.message, error.stack].filter(Boolean).join('\n');
    })
    .filter(Boolean);
}

function classifyFailure(message) {
  if (
    /net::|\bECONN(?:RESET|REFUSED)?\b|\bENOTFOUND\b|socket hang up|fetch failed/i.test(message)
  ) {
    return 'Network';
  }
  if (/timeout|timed out|exceeded.*\bms\b/i.test(message)) return 'Timeout';
  if (
    /strict mode violation|locator\.|waiting for locator|no element|not visible|not attached/i.test(
      message,
    )
  ) {
    return 'Locator';
  }
  if (/expect\(|assertion|toBe(?:Visible|Hidden|Truthy|Falsy|Equal)|toHave/i.test(message)) {
    return 'Assertion';
  }
  if (
    /browser.*(?:closed|crash)|failed to launch|executable doesn't exist|target page, context or browser has been closed/i.test(
      message,
    )
  ) {
    return 'Browser/environment';
  }
  if (message) return 'Application/runtime';
  return 'Unknown';
}

function summarizeResults(report) {
  const tests = collectTests(report.suites);
  const summary = {
    total: tests.length,
    passed: 0,
    flaky: 0,
    failed: 0,
    skipped: 0,
    retries: 0,
    repeatedFailures: [],
    categories: new Map(),
  };

  for (const test of tests) {
    if (test.status === 'expected') summary.passed += 1;
    else if (test.status === 'flaky') summary.flaky += 1;
    else if (test.status === 'unexpected') summary.failed += 1;
    else if (test.status === 'skipped') summary.skipped += 1;

    summary.retries += test.results.filter((result) => Number(result.retry) > 0).length;

    if (!['unexpected', 'flaky'].includes(test.status)) continue;
    const failedResults = test.results.filter(
      (result) => !['passed', 'skipped'].includes(result.status),
    );

    for (const result of failedResults) {
      const errors = resultErrors(result);
      const category = classifyFailure(errors.join('\n'));
      summary.categories.set(category, (summary.categories.get(category) || 0) + 1);
    }

    if (failedResults.length >= 2) {
      summary.repeatedFailures.push({
        title: test.title,
        project: test.project,
        failedAttempts: failedResults.length,
      });
    }
  }

  return summary;
}

function renderSummary(summary) {
  const lines = [
    '## Playwright Stability Summary',
    '',
    `- Tests: ${summary.total}`,
    `- Passed: ${summary.passed}`,
    `- Flaky: ${summary.flaky}`,
    `- Failed: ${summary.failed}`,
    `- Skipped: ${summary.skipped}`,
    `- Retry attempts: ${summary.retries}`,
    `- Tests with repeated failures: ${summary.repeatedFailures.length}`,
    '',
    'Failure categories are heuristic labels based on error text, not root-cause diagnoses.',
    '',
    '### Failure Categories',
    '',
  ];
  const categories = [...summary.categories.entries()].sort((left, right) => right[1] - left[1]);

  if (categories.length) {
    lines.push('| Category | Failed attempts |', '| --- | ---: |');
    for (const [category, count] of categories) lines.push(`| ${category} | ${count} |`);
  } else {
    lines.push('No failed attempts to categorize.');
  }

  lines.push('', '### Repeated Failures', '');
  if (summary.repeatedFailures.length) {
    lines.push('| Test | Project | Failed attempts |', '| --- | --- | ---: |');
    for (const failure of summary.repeatedFailures) {
      const title = failure.title.replace(/\|/g, '\\|');
      lines.push(`| ${title} | ${failure.project} | ${failure.failedAttempts} |`);
    }
  } else {
    lines.push('No test had more than one failed attempt.');
  }

  return `${lines.join('\n')}\n`;
}

function main() {
  const reportPath = path.resolve(process.argv[2] || 'test-results/playwright-results.json');
  if (!fs.existsSync(reportPath)) {
    const warning = `Playwright JSON report not found at ${reportPath}; stability summary was not generated.`;
    console.warn(`::warning::${warning}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `## Playwright Stability Summary\n\n${warning}\n`,
      );
    }
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const output = renderSummary(summarizeResults(report));
  process.stdout.write(output);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `\n${output}`);
  }
}

if (require.main === module) main();

module.exports = { classifyFailure, collectTests, renderSummary, summarizeResults };
