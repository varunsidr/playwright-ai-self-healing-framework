'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { chromium, expect } = require('@playwright/test');
const { loadPage } = require('./ecommerce-repair/benchmark');
const project = require('./ecommerce-project');
const root = path.resolve(__dirname, '..');

async function main(beforeFile = process.argv[2], output = process.argv[3]) {
  if (!beforeFile || !output)
    throw new Error('Supply the original page-object source and a new evidence directory');
  output = path.resolve(output);
  if (fs.existsSync(output)) throw new Error('Use a new evidence directory');
  fs.mkdirSync(output, { recursive: true });
  const before = fs.readFileSync(path.resolve(beforeFile), 'utf8');
  const after = fs.readFileSync(path.join(root, 'pages/ecommerce-storefront-page.ts'), 'utf8');
  const result = {
    status: 'running',
    stages: [],
    latencyMs: 6500,
    scope:
      'Controlled delay of a real read-only search RSC request. A fault injection timer, not a synchronization sleep in the page object.',
  };
  const browser = await chromium.launch();
  async function observe(label, source, delayed) {
    const context = await browser.newContext({ baseURL: project.publicOrigin });
    const writes = [],
      query = 'missing-' + randomUUID() + '-product';
    await context.route('**/*', (route) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        writes.push(route.request().method());
        return route.abort();
      }
      return route.continue();
    });
    await context.tracing.start({
      snapshots: { dom: true, aria: true },
      screenshots: true,
      sources: true,
    });
    const page = await context.newPage();
    let timer,
      release = () => {},
      heldRequests = 0;
    if (delayed)
      await page.route('**/search?*', async (route) => {
        const request = route.request();
        if (
          request.method() === 'GET' &&
          request.headers().rsc === '1' &&
          new URL(request.url()).searchParams.get('q') === query
        ) {
          heldRequests++;
          await new Promise((resolve) => {
            release = resolve;
            timer = setTimeout(resolve, result.latencyMs);
          });
        }
        await route.fallback().catch(() => {});
      });
    const started = Date.now();
    const stage = {
      label,
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      passed: false,
    };
    try {
      const Page = loadPage(source),
        view = new Page(page);
      await view.openHome();
      await view.searchFor(query);
      await view.expectUrl(new RegExp('/search\\?q=' + query));
      await expect(view.searchResultsHeading).toBeVisible();
      await expect(view.noSearchResults).toBeVisible();
      stage.passed = true;
    } catch (error) {
      stage.error = error.message;
    } finally {
      stage.finalUrl = page.url();
      stage.elapsedMs = Date.now() - started;
      stage.heldRequests = heldRequests;
      stage.attemptedWrites = writes;
      clearTimeout(timer);
      release();
      await context.tracing.stop({ path: path.join(output, label + '-trace.zip') });
      await context.close();
      result.stages.push(stage);
    }
    return stage;
  }
  try {
    const baseline = await observe('original-normal', before, false);
    if (!baseline.passed) throw new Error('Original normal-network baseline did not pass');
    const reproduced = await observe('original-delayed', before, true);
    if (reproduced.passed || reproduced.heldRequests !== 1 || !/toHaveURL/.test(reproduced.error))
      throw new Error(
        'The controlled response delay did not reproduce the original URL assertion failure',
      );
    const verified = await observe('corrected-delayed', after, true);
    if (
      !verified.passed ||
      verified.heldRequests !== 1 ||
      result.stages.some((stage) => stage.attemptedWrites.length)
    )
      throw new Error(
        'Corrected navigation did not preserve exact search outcomes and the zero-write boundary',
      );
    result.status = 'passed';
  } catch (error) {
    result.status = 'blocked';
    result.error = error.message;
    process.exitCode = 1;
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    console.log('Search navigation verification: ' + result.status + '. Evidence: ' + output);
  }
  return result;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
