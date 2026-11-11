'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { createWorkspace } = require('./ecommerce-workspace');

async function main() {
  const output = path.resolve(process.argv[2] || 'test-results/workspace-verification');
  if (fs.existsSync(output)) throw new Error('Use a new workspace verification directory');
  fs.mkdirSync(output, { recursive: true });
  const server = createWorkspace({ directory: path.join(output, 'workspace') });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch();
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const page = await context.newPage();
    await page.goto(origin);
    await expect(page.getByRole('heading', { name: 'From a case to its evidence.' })).toBeVisible();
    await expect(page.locator('#case-count')).toHaveText('140');
    await page.getByRole('searchbox', { name: 'Search cases' }).fill('TC-CNT-001-01');
    await page.getByRole('button', { name: /TC-CNT-001-01/ }).click();
    await page.getByRole('button', { name: 'Run read-only batch' }).click();
    await expect(page.locator('#runs')).toContainText('passed', { timeout: 120000 });
    const runs = await (await fetch(origin + '/api/runs')).json();
    if (runs.jobs.length !== 1 || runs.jobs[0].status !== 'passed')
      throw new Error('Expected one passing original public-safe batch');
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    const desktop = await new AxeBuilder({ page }).analyze();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('button', { name: 'Run read-only batch' })).toBeVisible();
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
      throw new Error('Workspace overflows the mobile viewport');
    const mobile = await new AxeBuilder({ page }).analyze();
    await page.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
    const result = {
      status: desktop.violations.length || mobile.violations.length ? 'failed' : 'passed',
      publicRun: runs.jobs[0],
      desktopViolations: desktop.violations,
      mobileViolations: mobile.violations,
      scope:
        'Framework workspace only; automated accessibility is not a conformance assessment. Public batch performs no server writes.',
    };
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    if (desktop.violations.length || mobile.violations.length)
      throw new Error('Workspace accessibility violations recorded; inspect result.json');
    console.log(
      'Workspace browser workflow, mobile layout and automated accessibility passed: ' + output,
    );
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
if (require.main === module)
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
