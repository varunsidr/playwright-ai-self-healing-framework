'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { chromium, expect } = require('@playwright/test');
const runtime = require('./ecommerce-repair/runtime');
const { validateSource, revision } = require('./ecommerce-contracts/source');
const { loadPage, candidate, assess, offlinePrediction } = require('./ecommerce-repair/benchmark');
const root = path.resolve(__dirname, '..');
const hash = (source) => createHash('sha256').update(source).digest('hex');

async function main(args = process.argv.slice(2)) {
  if (
    ![2, 3].includes(args.length) ||
    (args[2] && !['--collect-only', '--offline'].includes(args[2]))
  )
    throw new Error(
      'Usage: benchmark:ecommerce:offline -- <clean-pinned-website> <new-evidence-directory> [--collect-only|--offline]',
    );
  const website = validateSource(args[0]),
    output = path.resolve(args[1]);
  if (!fs.existsSync(path.join(website, '.next-browser-tests/BUILD_ID')))
    throw new Error(
      'Benchmark needs a clean pinned isolated production build; use the websiteWorkspace from a successful isolated runner result',
    );
  if (fs.existsSync(output)) throw new Error('Use a new benchmark evidence directory');
  fs.mkdirSync(output, { recursive: true });
  const source = fs.readFileSync(path.join(root, 'pages/ecommerce-storefront-page.ts'), 'utf8');
  const assertionsHash = hash(source);
  const labels = [],
    packets = [],
    verifications = {};
  const result = {
    schemaVersion: 1,
    status: 'preparing',
    websiteRevision: revision,
    corpus: 'controlled-ui-faults-v1',
    modelCost: null,
    externalModelUsed: false,
    engine: 'offline-semantic-control-matching',
    scope:
      'Local browser observations, deterministic offline proposals, canonical locator-only gate and fresh-context verification. Synthetic faults; no AI-model accuracy, production repair or general reliability claim.',
  };
  const server = await runtime.startWebsite(website, output, 'website');
  const browser = await chromium.launch();
  const scenarios = [];
  for (const [flow, oldId] of [
    ['newsletter', 'footer-newsletter-submit'],
    ['newsletter', 'footer-newsletter-email'],
    ['cart', 'navbar-cart-toggle'],
    ['account', 'navbar-account-toggle'],
  ])
    for (let i = 0; i < 2; i++)
      scenarios.push({
        flow,
        oldId,
        newId: 'control-' + randomUUID(),
        classification: 'test',
        repairable: true,
      });
  scenarios.push(
    ...['Preview unavailable.', 'Your email was saved and a message was sent.'].map((notice) => ({
      flow: 'newsletter',
      notice,
      classification: 'application',
      repairable: false,
    })),
  );
  scenarios.push(
    ...['connectionrefused', 'internetdisconnected'].map((network) => ({
      flow: 'newsletter',
      network,
      classification: 'environment',
      repairable: false,
    })),
  );
  scenarios.push({
    flow: 'newsletter',
    oldId: 'footer-newsletter-submit',
    newId: 'control-' + randomUUID(),
    notice: 'Preview unavailable.',
    classification: 'unknown',
    repairable: false,
  });
  scenarios.push({
    flow: 'newsletter',
    oldId: 'footer-newsletter-submit',
    newId: 'control-' + randomUUID(),
    incomplete: true,
    classification: 'unknown',
    repairable: false,
  });

  async function observe(scenario, pageSource, diagnostic) {
    const context = await browser.newContext({
      baseURL: server.url,
      viewport: { width: 1440, height: 1000 },
    });
    const writes = [];
    await context.route('**/*', (route) => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        writes.push(route.request().method());
        return route.abort();
      }
      if (scenario.network && route.request().isNavigationRequest())
        return route.abort(scenario.network);
      return route.continue();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(1200);
    const PageObject = loadPage(pageSource);
    const view = new PageObject(page);
    let error = null,
      snapshot = [],
      probe = null;
    let previousSnapshot = [];
    const snapshotUi = () =>
      page
        .locator(
          '[data-testid^="footer-newsletter"], [data-testid^="navbar-account"], [data-testid^="navbar-cart"], [data-testid^="control-"]',
        )
        .evaluateAll((elements) =>
          elements.map((element) => ({
            id: element.getAttribute('data-testid'),
            tag: element.tagName,
            label: element.getAttribute('aria-label'),
            text: (element.textContent || '').slice(0, 240),
          })),
        );
    const act = async () => {
      if (scenario.flow === 'newsletter') {
        await view.submitNewsletterPreview('benchmark@example.invalid');
        if (scenario.notice)
          await page.getByTestId('footer-newsletter-success').evaluate((element, text) => {
            element.textContent = text;
          }, scenario.notice);
        await expect(view.newsletterPreviewNotice).toBeVisible({ timeout: 1200 });
      } else if (scenario.flow === 'cart') {
        await view.openCart();
        await expect(view.cartPanel).toHaveAttribute('data-state', 'open', { timeout: 1200 });
      } else {
        await view.openAccountPanel();
        await expect(view.loginPanel).toHaveAttribute('data-state', 'open', { timeout: 1200 });
      }
      assertNoWrites();
    };
    const assertNoWrites = () => {
      if (writes.length) throw new Error('Benchmark attempted a server write');
    };
    try {
      await view.openHome();
      previousSnapshot = await snapshotUi();
      if (scenario.oldId)
        await page
          .getByTestId(scenario.oldId)
          .evaluate((element, id) => element.setAttribute('data-testid', id), scenario.newId);
      snapshot = await snapshotUi();
      try {
        await act();
      } catch (failure) {
        error = failure.message.slice(0, 2400);
      }
      if (diagnostic && scenario.oldId) {
        try {
          if (scenario.flow === 'newsletter') {
            const currentEmail =
              scenario.oldId === 'footer-newsletter-email'
                ? scenario.newId
                : 'footer-newsletter-email';
            const currentSubmit =
              scenario.oldId === 'footer-newsletter-submit'
                ? scenario.newId
                : 'footer-newsletter-submit';
            await page.getByTestId(currentEmail).fill('benchmark@example.invalid');
            await page.getByTestId(currentSubmit).click();
            if (scenario.notice)
              await page.getByTestId('footer-newsletter-success').evaluate((element, text) => {
                element.textContent = text;
              }, scenario.notice);
            probe = {
              expectedBehaviorObserved: await view.newsletterPreviewNotice.isVisible(),
              notice: await page.getByTestId('footer-newsletter-success').textContent(),
            };
          } else {
            await page.getByTestId(scenario.newId).click();
            probe = {
              expectedBehaviorObserved:
                (await (scenario.flow === 'cart' ? view.cartPanel : view.loginPanel).getAttribute(
                  'data-state',
                )) === 'open',
            };
          }
        } catch (failure) {
          probe = { error: failure.message.slice(0, 500) };
        }
      }
      const afterSnapshot = await page
        .locator(
          '[data-testid^="footer-newsletter"], [data-testid^="navbar-account"], [data-testid^="navbar-cart"], [data-testid^="control-"]',
        )
        .evaluateAll((elements) =>
          elements.map((element) => ({
            id: element.getAttribute('data-testid'),
            tag: element.tagName,
            label: element.getAttribute('aria-label'),
            text: (element.textContent || '').slice(0, 240),
          })),
        );
      snapshot = [
        ...snapshot,
        ...afterSnapshot.filter((item) => !snapshot.some((previous) => previous.id === item.id)),
      ];
    } catch (failure) {
      error = failure.message.slice(0, 2400);
    } finally {
      assertNoWrites();
      await context.close();
    }
    return {
      passed: error === null,
      error,
      snapshot,
      previousSnapshot,
      probe,
      attemptedWrites: writes.length,
    };
  }
  try {
    for (const flow of ['newsletter', 'cart', 'account']) {
      const baseline = await observe({ flow }, source, false);
      if (!baseline.passed)
        throw new Error('Unmodified benchmark baseline failed: ' + flow + ': ' + baseline.error);
    }
    console.log('Collecting controlled failures for offline evaluation; no external model calls');
    for (const scenario of scenarios) {
      const id = randomUUID();
      scenario.id = id;
      const observed = await observe(scenario, source, true);
      if (observed.passed) throw new Error('Controlled fault did not fail its original assertion');
      labels.push({ id, classification: scenario.classification, repairable: scenario.repairable });
      packets.push({
        id,
        intent:
          scenario.flow === 'newsletter'
            ? 'Preview shows exactly: Newsletter preview only. Your email was not saved or sent.'
            : scenario.flow === 'cart'
              ? 'My Cart opens the shopping bag drawer.'
              : 'Account opens the My Account drawer on desktop.',
        error: observed.error,
        snapshot: scenario.incomplete ? null : observed.snapshot,
        previousSnapshot: scenario.incomplete ? null : observed.previousSnapshot,
        expectedNotice:
          scenario.flow === 'newsletter'
            ? 'Newsletter preview only. Your email was not saved or sent.'
            : null,
        functionalProbe: scenario.incomplete ? null : observed.probe,
      });
    }
    fs.writeFileSync(path.join(output, 'ground-truth.json'), JSON.stringify(labels, null, 2));
    fs.writeFileSync(path.join(output, 'observed-packets.json'), JSON.stringify(packets, null, 2));
    if (args[2] === '--collect-only') {
      result.status = 'collected';
      result.sourceInputsUnchanged =
        hash(fs.readFileSync(path.join(root, 'pages/ecommerce-storefront-page.ts'), 'utf8')) ===
        assertionsHash;
      result.casesCollected = packets.length;
      return result;
    }
    const started = Date.now();
    const response = { predictions: packets.map(offlinePrediction) };
    result.predictionElapsedMs = Date.now() - started;
    fs.writeFileSync(
      path.join(output, 'offline-predictions.json'),
      JSON.stringify(response, null, 2),
    );
    for (const prediction of response.predictions) {
      const scenario = scenarios.find((item) => item.id === prediction.id);
      if (!scenario || !prediction.replacement) continue;
      try {
        const patched = candidate(
          source,
          prediction.replacement,
          packets.find((packet) => packet.id === prediction.id).snapshot || [],
        );
        if (prediction.classification !== 'test' || !scenario.repairable)
          throw new Error('Repair rejected for a non-repairable scenario');
        verifications[prediction.id] = await observe(scenario, patched, false);
      } catch (failure) {
        verifications[prediction.id] = { passed: false, rejected: failure.message };
      }
    }
    result.metrics = assess(labels, response.predictions, verifications);
    result.sourceInputsUnchanged =
      hash(fs.readFileSync(path.join(root, 'pages/ecommerce-storefront-page.ts'), 'utf8')) ===
      assertionsHash;
    if (!result.sourceInputsUnchanged) throw new Error('Protected POM changed during benchmark');
    result.status = 'evaluated';
    result.verifications = verifications;
  } catch (error) {
    result.status = 'failed';
    result.error = error.message;
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.stop();
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log('Offline benchmark: ' + result.status + '. Evidence: ' + output);
  }
  return result;
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { main };
