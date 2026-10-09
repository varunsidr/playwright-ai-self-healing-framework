'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium, expect } = require('@playwright/test');

const baseURL = (
  process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app'
).replace(/\/$/, '');
const runsPerScenario = Number(process.env.ECOMMERCE_PERF_RUNS || 3);
const selectedProfile = process.env.ECOMMERCE_PERF_PROFILE;
const observationMs = 1500;
const outputPath = path.join(process.cwd(), 'test-results', 'ecommerce-browser-metrics.json');
const profiles = {
  desktop: { viewport: { width: 1365, height: 768 }, deviceScaleFactor: 1 },
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function maxClsSession(shifts) {
  let max = 0;
  let sessionStart = 0;
  let lastShift = 0;
  let sessionValue = 0;
  for (const shift of shifts.filter((entry) => !entry.hadRecentInput)) {
    if (
      !sessionStart ||
      shift.startTime - lastShift > 1000 ||
      shift.startTime - sessionStart > 5000
    ) {
      sessionStart = shift.startTime;
      sessionValue = 0;
    }
    lastShift = shift.startTime;
    sessionValue += shift.value;
    max = Math.max(max, sessionValue);
  }
  return max;
}

async function discoverPerfumeProduct(browser, target) {
  const context = await browser.newContext(profiles.desktop);
  try {
    const page = await context.newPage();
    const response = await page.goto(new URL('/perfume', target).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    if (!response || response.status() !== 200) {
      throw new Error('Perfume collection is unavailable for product discovery.');
    }
    const link = page.getByTestId('product-card-link').first();
    await link.waitFor({ timeout: 15_000 });
    const href = await link.getAttribute('href');
    if (!href) throw new Error('The perfume collection has no product link.');
    const product = new URL(href, target);
    if (product.origin !== target.origin || !product.pathname.startsWith('/perfume/')) {
      throw new Error('The first perfume card does not link to a local product detail page.');
    }
    return product.pathname;
  } finally {
    await context.close();
  }
}

function addPerformanceObservers(context) {
  return context.addInitScript(() => {
    const entries = { lcpMs: null, shifts: [], longTasks: [] };
    const observers = [];
    function observe(type, record) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) record(entry);
        });
        observer.observe({ type, buffered: true });
        observers.push({ observer, record });
      } catch {
        // Unsupported entry types remain empty in the report.
      }
    }
    observe('largest-contentful-paint', (entry) => {
      entries.lcpMs = entry.startTime;
    });
    observe('layout-shift', (entry) => {
      entries.shifts.push({
        startTime: entry.startTime,
        value: entry.value,
        hadRecentInput: entry.hadRecentInput,
      });
    });
    observe('longtask', (entry) => {
      entries.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
    });
    window.__zeoufReadPerformance = () => {
      for (const { observer, record } of observers) {
        for (const entry of observer.takeRecords()) record(entry);
      }
      return entries;
    };
  });
}

async function waitForContent(page, scenario) {
  if (scenario === 'home') {
    await page.getByTestId('home-hero').getByRole('heading', { level: 1 }).waitFor({
      timeout: 15_000,
    });
    await page.waitForFunction(
      () => {
        const poster = document.querySelector('[data-testid="home-hero"] img');
        return poster instanceof HTMLImageElement && poster.complete && poster.naturalWidth > 0;
      },
      null,
      { timeout: 15_000 },
    );
  } else if (['women', 'perfume', 'search'].includes(scenario)) {
    await page.getByTestId('product-card').first().waitFor({ timeout: 15_000 });
  } else if (scenario === 'perfume-product') {
    await page.getByTestId('product-detail-add-to-cart').waitFor({ timeout: 15_000 });
  } else if (scenario === 'checkout-guest') {
    await page.getByRole('heading', { name: 'Complete your order' }).waitFor({
      timeout: 15_000,
    });
    await page
      .getByText('Please sign in from the account menu before placing an order.')
      .waitFor({ timeout: 15_000 });
  }
}

async function measureScenario(browser, target, profile, scenario, run) {
  const context = await browser.newContext(profiles[profile]);
  await addPerformanceObservers(context);
  const serverErrors = [];
  try {
    const page = await context.newPage();
    page.on('response', (response) => {
      if (response.status() >= 500 && new URL(response.url()).origin === target.origin) {
        serverErrors.push({ status: response.status(), path: new URL(response.url()).pathname });
      }
    });
    const response = await page.goto(new URL(scenario.path, target).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    if (!response || response.status() !== 200) {
      throw new Error(
        scenario.path + ' returned HTTP ' + (response ? response.status() : 'no response'),
      );
    }
    await waitForContent(page, scenario.name);
    const contentReadyMs = await page.evaluate(() => performance.now());
    // Observe paints and layout shifts for the same fixed window after content appears.
    await page.waitForTimeout(observationMs);
    const browserMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (!navigation) throw new Error('Navigation timing is unavailable.');
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const resources = performance.getEntriesByType('resource');
      const sameOriginBytes = resources
        .filter((resource) => new URL(resource.name).origin === location.origin)
        .reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
      return {
        ttfbMs: navigation.responseStart - navigation.startTime,
        domContentLoadedMs: navigation.domContentLoadedEventEnd - navigation.startTime,
        loadMs: navigation.loadEventEnd > 0 ? navigation.loadEventEnd - navigation.startTime : null,
        fcpMs: fcp ? fcp.startTime : null,
        resourceCount: resources.length,
        sameOriginTransferBytes: sameOriginBytes + (navigation.transferSize || 0),
        observed: window.__zeoufReadPerformance(),
      };
    });
    if (serverErrors.length > 0) {
      throw new Error(scenario.name + ' had server errors: ' + JSON.stringify(serverErrors));
    }
    const { observed, ...navigation } = browserMetrics;
    const longTaskBlockingMs = observed.longTasks
      .filter((task) => navigation.fcpMs === null || task.startTime >= navigation.fcpMs)
      .reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0);
    let cartOpenMs = null;
    if (scenario.name === 'home') {
      const startedAt = await page.evaluate(() => performance.now());
      await page.getByTestId('navbar-cart-toggle').click();
      await expect(page.getByTestId('navbar-cart-panel')).toHaveAttribute('data-state', 'open');
      await page.getByText('Your cart is empty').waitFor({ timeout: 5000 });
      cartOpenMs = (await page.evaluate(() => performance.now())) - startedAt;
    }
    return {
      profile,
      scenario: scenario.name,
      path: scenario.path,
      run,
      contentReadyMs,
      ...navigation,
      lcpMs: observed.lcpMs,
      loadCls: maxClsSession(observed.shifts),
      longTaskBlockingMs,
      cartOpenMs,
    };
  } finally {
    await context.close();
  }
}

function summarize(samples) {
  const summary = {};
  const metrics = [
    'ttfbMs',
    'domContentLoadedMs',
    'loadMs',
    'contentReadyMs',
    'fcpMs',
    'lcpMs',
    'loadCls',
    'longTaskBlockingMs',
    'resourceCount',
    'sameOriginTransferBytes',
    'cartOpenMs',
  ];
  for (const sample of samples) {
    const key = sample.profile + '.' + sample.scenario;
    if (!summary[key]) summary[key] = {};
  }
  for (const key of Object.keys(summary)) {
    const group = samples.filter((sample) => sample.profile + '.' + sample.scenario === key);
    summary[key].sampleCount = group.length;
    for (const metric of metrics) {
      const values = group.map((sample) => sample[metric]).filter(Number.isFinite);
      summary[key][metric] = values.length === group.length ? median(values) : null;
    }
    summary[key].worstTtfbMs = Math.max(...group.map((sample) => sample.ttfbMs));
    summary[key].worstContentReadyMs = Math.max(...group.map((sample) => sample.contentReadyMs));
    summary[key].worstLcpMs = group.every((sample) => Number.isFinite(sample.lcpMs))
      ? Math.max(...group.map((sample) => sample.lcpMs))
      : null;
  }
  return summary;
}

async function checkOptionalBudgets(summary) {
  const budgetFile = process.env.ECOMMERCE_PERF_BUDGET_FILE;
  if (!budgetFile) return { file: null, failures: [] };
  const budgetText = await fs.readFile(path.resolve(budgetFile), 'utf8');
  const budgets = JSON.parse(budgetText.replace(/^\uFEFF/, ''));
  const failures = [];
  for (const [scenario, limits] of Object.entries(budgets)) {
    if (!summary[scenario]) throw new Error('Unknown budget scenario: ' + scenario);
    for (const [metric, limit] of Object.entries(limits)) {
      if (!(metric in summary[scenario])) throw new Error('Unknown budget metric: ' + metric);
      if (!Number.isFinite(limit) || limit < 0) {
        throw new Error('Budget limits must be nonnegative numbers.');
      }
      const measured = summary[scenario][metric];
      if (measured === null || measured > limit) {
        failures.push({ scenario, metric, measured, limit });
      }
    }
  }
  return { file: budgetFile, failures };
}

async function main() {
  if (process.argv.includes('--check-budget')) {
    if (!process.env.ECOMMERCE_PERF_BUDGET_FILE) {
      throw new Error('ECOMMERCE_PERF_BUDGET_FILE is required for --check-budget.');
    }
    const report = JSON.parse(await fs.readFile(outputPath, 'utf8'));
    const budgets = await checkOptionalBudgets(report.summary);
    if (budgets.failures.length > 0) {
      throw new Error('Performance budgets exceeded: ' + JSON.stringify(budgets.failures));
    }
    console.log('Performance budgets passed for ' + outputPath);
    return;
  }
  const target = new URL(baseURL);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('ECOMMERCE_BASE_URL must be an HTTP or HTTPS URL.');
  }
  if (!Number.isInteger(runsPerScenario) || runsPerScenario < 1 || runsPerScenario > 5) {
    throw new Error('ECOMMERCE_PERF_RUNS must be an integer from 1 to 5.');
  }
  if (selectedProfile && !profiles[selectedProfile]) {
    throw new Error('ECOMMERCE_PERF_PROFILE must be desktop or mobile.');
  }
  const browser = await chromium.launch();
  const samples = [];
  const failures = [];
  try {
    let productPath = null;
    try {
      productPath = await discoverPerfumeProduct(browser, target);
    } catch (error) {
      failures.push({ stage: 'product-discovery', error: error.message });
    }
    const scenarios = [
      { name: 'home', path: '/' },
      { name: 'women', path: '/women' },
      { name: 'perfume', path: '/perfume' },
      { name: 'search', path: '/arama?q=perfume' },
      ...(productPath ? [{ name: 'perfume-product', path: productPath }] : []),
      { name: 'checkout-guest', path: '/checkout' },
    ];
    for (const profile of selectedProfile ? [selectedProfile] : Object.keys(profiles)) {
      for (const scenario of scenarios) {
        for (let run = 1; run <= runsPerScenario; run += 1) {
          try {
            samples.push(await measureScenario(browser, target, profile, scenario, run));
          } catch (error) {
            const failure = { profile, scenario: scenario.name, run, error: error.message };
            failures.push(failure);
            console.error('Measurement failed: ' + JSON.stringify(failure));
          }
        }
        console.log('Measured ' + profile + ' ' + scenario.name);
      }
    }
    const summary = summarize(samples);
    let budgets = { file: null, failures: [] };
    try {
      budgets = await checkOptionalBudgets(summary);
    } catch (error) {
      failures.push({ stage: 'budget', error: error.message });
    }
    const report = {
      schemaVersion: 2,
      target: baseURL,
      measuredAt: new Date().toISOString(),
      browser: browser.version(),
      profiles,
      runsPerScenario,
      observationMs,
      note: 'Synthetic Chromium measurements from fresh contexts. LCP and CLS cover page load plus the observation window; this is not field Core Web Vitals or an INP measurement. No network throttling is applied.',
      scenarios,
      samples,
      summary,
      budgets,
      failures,
    };
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');
    for (const [scenario, metrics] of Object.entries(summary)) {
      console.log(
        scenario +
          ': median content ' +
          metrics.contentReadyMs.toFixed(0) +
          ' ms, LCP ' +
          (metrics.lcpMs === null ? 'n/a' : metrics.lcpMs.toFixed(0) + ' ms') +
          ', worst TTFB ' +
          metrics.worstTtfbMs.toFixed(0) +
          ' ms' +
          ', load CLS ' +
          metrics.loadCls.toFixed(3),
      );
    }
    console.log('Saved ' + outputPath);
    if (budgets.failures.length > 0) {
      throw new Error('Performance budgets exceeded: ' + JSON.stringify(budgets.failures));
    }
    if (failures.length > 0) {
      throw new Error(failures.length + ' performance measurement(s) failed; see ' + outputPath);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
