const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const targetRoots = ['fixtures', 'flows', 'pages', 'tests'];
const targetExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dirPath) {
  const entries = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'playwright-report' || entry.name === 'test-results') {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walk(fullPath));
      continue;
    }

    if (targetExtensions.has(path.extname(entry.name))) {
      entries.push(fullPath);
    }
  }

  return entries;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function isInTargetRoots(filePath) {
  const normalized = normalizePath(filePath);
  return targetRoots.some((root) => normalized.includes(`/${root}/`) || normalized.endsWith(`/${root}`));
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function addIssue(issues, filePath, line, rule, message) {
  issues.push({ filePath: normalizePath(filePath), line, rule, message });
}

function scanFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  if (normalizePath(filePath).includes('/tests/') && /from ['"]@playwright\/test['"]/.test(source)) {
    addIssue(
      issues,
      filePath,
      1,
      'tests-import-fixtures-base',
      'Specs should import `test` and `expect` from `fixtures/base.ts`, not directly from `@playwright/test`.'
    );
  }

  if (normalizePath(filePath).includes('/tests/')) {
    const disallowedLocatorPatterns = [
      /getByRole\s*\(/g,
      /getByText\s*\(/g,
      /locator\s*\(/g,
      /page\.goto\s*\(/g,
    ];

    for (const pattern of disallowedLocatorPatterns) {
      for (const match of source.matchAll(pattern)) {
        addIssue(
          issues,
          filePath,
          lineNumber(source, match.index || 0),
          'tests-no-ui-details',
          'Specs should stay behavior-focused and avoid hardcoded locator or navigation details.'
        );
      }
    }
  }

  if (normalizePath(filePath).includes('/flows/')) {
    for (const match of source.matchAll(/expect\s*\(/g)) {
      addIssue(
        issues,
        filePath,
        lineNumber(source, match.index || 0),
        'flows-no-assertions',
        'Flows should orchestrate steps only; assertions belong in specs or page helpers.'
      );
    }
  }

  if (normalizePath(filePath).includes('/pages/')) {
    for (const match of source.matchAll(/from ['"].*\/tests\//g)) {
      addIssue(
        issues,
        filePath,
        lineNumber(source, match.index || 0),
        'pages-no-test-imports',
        'Page objects should not import test files.'
      );
    }
  }

  return issues;
}

function main() {
  const files = targetRoots.flatMap((root) => {
    const rootPath = path.join(repoRoot, root);
    return fs.existsSync(rootPath) ? walk(rootPath) : [];
  });

  const issues = files
    .filter(isInTargetRoots)
    .flatMap((filePath) => scanFile(filePath));

  if (issues.length === 0) {
    console.log('Static analysis passed: no project-specific issues found.');
    return;
  }

  console.log(`Static analysis found ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.log(`${issue.filePath}:${issue.line} [${issue.rule}] ${issue.message}`);
  }

  process.exitCode = 1;
}

main();