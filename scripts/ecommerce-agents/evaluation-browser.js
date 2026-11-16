'use strict';

const { expect: playwrightExpect } = require('@playwright/test');
const { loadPage } = require('../ecommerce-repair/benchmark');
const { redact } = require('../ecommerce-repair/evidence');
const { flows } = require('./evaluation');

const expect = playwrightExpect.configure({ timeout: 1800 });
const notice = 'Newsletter preview only. Your email was not saved or sent.';

async function observe(browser, origin, scenario, source) {
  const context = await browser.newContext({
    baseURL: origin,
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
  });
  const writes = [];
  const data = {
    passed: false,
    stage: 'navigation',
    injectionApplied: false,
    injectedDocuments: 0,
    omittedVisualResources: 0,
    previousSnapshot: [],
    snapshot: [],
    failureSnapshot: [],
    navigation: [],
  };
  await context.route('**/*', async (route) => {
    const request = route.request();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      writes.push(request.method());
      return route.abort();
    }
    // This corpus checks input and dialog contracts; decorative downloads must not
    // determine script readiness. These omissions do not apply to ordinary tests.
    if (['image', 'media', 'font'].includes(request.resourceType())) {
      data.omittedVisualResources++;
      return route.abort();
    }
    if (request.isNavigationRequest() && (scenario.network || scenario.httpStatus)) {
      data.injectedDocuments++;
      if (scenario.network) return route.abort(scenario.network);
      return route.fulfill({
        status: scenario.httpStatus,
        contentType: 'text/html',
        body: '<h1>Service unavailable</h1>',
      });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(1800);
  page.setDefaultNavigationTimeout(20000);
  page.on('requestfailed', (request) => {
    if (request.isNavigationRequest())
      data.navigation.push({ url: request.url(), failure: request.failure()?.errorText });
  });
  page.on('response', (response) => {
    if (response.request().isNavigationRequest())
      data.navigation.push({ url: response.url(), status: response.status() });
  });
  const Page = loadPage(source),
    view = new Page(page);
  const contract = flows[scenario.flow];
  const relevantIds = [...contract.targets, 'footer-newsletter-success'];
  const snapshotUi = () =>
    page.locator('[data-testid]').evaluateAll(
      (elements, ids) =>
        elements
          .filter(
            (element) =>
              ids.includes(element.getAttribute('data-testid')) ||
              element.getAttribute('data-testid').startsWith('control-'),
          )
          .map((element) => ({
            id: element.getAttribute('data-testid'),
            tag: element.tagName,
            label: element.getAttribute('aria-label'),
            text: (element.textContent || '').trim().slice(0, 240),
            type: element.getAttribute('type'),
            role: element.getAttribute('role'),
            disabled: element.hasAttribute('disabled'),
            ariaModal: element.getAttribute('aria-modal'),
          })),
      relevantIds,
    );
  let preparedSearch = false,
    preparedRegistration = false;
  try {
    const response = await page.goto('/', { waitUntil: 'load' });
    if (!response || !response.ok())
      throw new Error('Document navigation failed: HTTP ' + response?.status());
    data.stage = 'preparation';
    if (scenario.flow === 'search' && scenario.oldId === 'navbar-search-input') {
      await view.openSearch();
      preparedSearch = true;
    }
    if (scenario.flow === 'registration') {
      await view.openAccountButton.click();
      await expect(view.loginPanel).toHaveAttribute('data-state', 'open');
      if (scenario.oldId === 'navbar-register-fullname') {
        await view.switchToRegister();
        preparedRegistration = true;
      }
    }
    // These checks separate a pre-existing live-site failure from an applied synthetic fault.
    const targetId = scenario.oldId || contract.action;
    await expect(page.getByTestId(targetId)).toHaveCount(1);
    data.previousSnapshot = await snapshotUi();
    if (['drift', 'ambiguous', 'incomplete', 'mixed'].includes(scenario.kind)) {
      await page.getByTestId(scenario.oldId).evaluate(
        (element, args) => {
          element.setAttribute('data-testid', args.newId);
          if (args.ambiguous) {
            const clone = element.cloneNode(true);
            clone.setAttribute('data-testid', args.otherId);
            element.parentElement.appendChild(clone);
          }
        },
        {
          newId: scenario.newId,
          otherId: scenario.otherId,
          ambiguous: scenario.kind === 'ambiguous',
        },
      );
      data.injectionApplied = true;
    } else if (scenario.kind === 'disabled') {
      await page.getByTestId(targetId).evaluate((element) => element.setAttribute('disabled', ''));
      data.injectionApplied = true;
    }
    data.snapshot = await snapshotUi();
    data.stage = 'contract';
    const mutateOutput = async (element) => {
      if (!['output', 'mixed'].includes(scenario.kind)) return;
      await element.evaluate((node, isNewsletter) => {
        if (isNewsletter)
          node.textContent = 'Preview unavailable; original output contract was violated.';
        else node.setAttribute('aria-modal', 'false');
      }, scenario.flow === 'newsletter');
      data.injectionApplied = true;
    };
    if (scenario.flow === 'newsletter') {
      await view.submitNewsletterPreview('held-out@example.invalid');
      const result = page.getByTestId('footer-newsletter-success');
      await expect(result).toBeVisible();
      await mutateOutput(result);
      await expect(result).toHaveText(notice);
      await expect(view.newsletterPreviewNotice).toBeVisible();
    } else if (scenario.flow === 'cart') {
      await view.cartToggle.click();
      await expect(view.cartPanel).toHaveAttribute('data-state', 'open');
      await expect(view.cartPanel).toBeInViewport();
      await mutateOutput(view.cartPanel);
      await expect(view.cartPanel).toHaveAttribute('aria-modal', 'true');
      await expect(view.navigationDialog('cart')).toBeVisible();
      await expect(view.emptyCartMessage).toBeVisible();
    } else if (scenario.flow === 'account') {
      await view.openAccountButton.click();
      await expect(view.loginPanel).toHaveAttribute('data-state', 'open');
      await mutateOutput(view.loginPanel);
      await expect(view.loginPanel).toHaveAttribute('aria-modal', 'true');
      await expect(view.navigationDialog('account')).toBeVisible();
      await expect(view.loginEmail).toBeVisible();
    } else if (scenario.flow === 'registration') {
      if (!preparedRegistration) await view.switchToRegister();
      await expect(view.registerForm).toBeVisible();
      await view.registerFullName.fill(scenario.query);
      await expect(view.registerFullName).toHaveValue(scenario.query);
      await mutateOutput(view.loginPanel);
      await expect(view.loginPanel).toHaveAttribute('aria-modal', 'true');
    } else if (scenario.flow === 'search') {
      if (!preparedSearch) await view.openSearch();
      await expect(view.searchInput).toBeFocused();
      await view.searchInput.fill(scenario.query);
      await expect(view.searchInput).toHaveValue(scenario.query);
      const dialog = view.navigationDialog('search');
      await mutateOutput(dialog);
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(view.searchToggle).toBeFocused();
    }
    data.passed = true;
  } catch (error) {
    data.error = redact(error.message.slice(0, 3200));
  } finally {
    if (data.stage !== 'navigation') data.failureSnapshot = await snapshotUi().catch(() => []);
    data.attemptedWrites = writes.length;
    await context.close();
  }
  return data;
}

module.exports = { observe };
