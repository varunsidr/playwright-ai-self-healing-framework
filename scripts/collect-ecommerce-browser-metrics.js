'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const baseURL = (
  process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app'
).replace(/\/$/, '');
const routes = [
  { name: 'home', path: '/' },
  { name: 'women', path: '/women' },
  { name: 'perfume', path: '/perfume' },
];
const runsPerRoute = 3;
const outputPath = path.join(process.cwd(), 'test-results', 'ecommerce-browser-metrics.json');

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

async function main() {
  const target = new URL(baseURL);
  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('ECOMMERCE_BASE_URL must be an HTTP or HTTPS URL.');
  }

  const browser = await chromium.launch();
  const samples = [];

  try {
    for (const route of routes) {
      for (let run = 1; run <= runsPerRoute; run += 1) {
        const context = await browser.newContext({
          viewport: { width: 1365, height: 768 },
          deviceScaleFactor: 1,
        });

        try {
          const page = await context.newPage();
          const response = await page.goto(new URL(route.path, target).toString(), {
            waitUntil: 'load',
            timeout: 30_000,
          });

          if (!response || response.status() !== 200) {
            throw new Error(
              `${route.path} returned HTTP ${response ? response.status() : 'no response'}`,
            );
          }

          const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (!navigation) throw new Error('Navigation timing is unavailable.');

            return {
              ttfbMs: navigation.responseStart - navigation.startTime,
              domContentLoadedMs: navigation.domContentLoadedEventEnd - navigation.startTime,
              loadMs: navigation.loadEventEnd - navigation.startTime,
              resourceCount: performance.getEntriesByType('resource').length,
            };
          });

          samples.push({ route: route.name, path: route.path, run, ...metrics });
        } finally {
          await context.close();
        }
      }
    }

    const report = {
      target: baseURL,
      measuredAt: new Date().toISOString(),
      browser: browser.version(),
      viewport: { width: 1365, height: 768 },
      runsPerRoute,
      note: 'Lab navigation timings. These are baseline measurements, not Core Web Vitals or pass/fail budgets.',
      samples,
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2) + '\n');

    for (const route of routes) {
      const routeSamples = samples.filter((sample) => sample.route === route.name);
      const ttfb = median(routeSamples.map((sample) => sample.ttfbMs));
      const load = median(routeSamples.map((sample) => sample.loadMs));
      console.log(`${route.name}: median TTFB ${ttfb.toFixed(0)} ms, load ${load.toFixed(0)} ms`);
    }
    console.log(`Saved ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
