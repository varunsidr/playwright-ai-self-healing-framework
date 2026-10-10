/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtimeConfig } from './utils/runtime-config';

const headedRun = process.argv.includes('--headed');

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  metadata: {
    codeRevision: process.env.GITHUB_SHA || process.env.ECOMMERCE_CODE_REVISION || null,
    websiteRevision: process.env.ECOMMERCE_BUILD_REVISION || null,
    ecommerceOrigin: new URL(
      process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app',
    ).origin,
    ecommerceEnvironment:
      process.env.ECOMMERCE_STAGING_CONFIRMED === 'true'
        ? 'isolated-staging-declared'
        : 'public-read-only',
    repairEvaluationStage: process.env.ECOMMERCE_REPAIR_STAGE || null,
    repairEvaluationSourceSha256: process.env.ECOMMERCE_REPAIR_SOURCE_SHA256 || null,
    caseCatalogSha256: createHash('sha256')
      .update(readFileSync(join(__dirname, 'specs/ecommerce/requirements/case-catalog.json')))
      .digest('hex'),
    checkManifestSha256: createHash('sha256')
      .update(readFileSync(join(__dirname, 'specs/ecommerce/requirements/check-links.json')))
      .digest('hex'),
  },
  testDir: './tests',
  testMatch: /.*\.(?:spec|test)\.ts$/,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['list'],
        [
          'html',
          { outputFolder: process.env.PW_HTML_REPORT_DIR || 'playwright-report', open: 'never' },
        ],
        ['junit', { outputFile: process.env.PW_JUNIT_REPORT_PATH || 'test-results/junit.xml' }],
        [
          'json',
          { outputFile: process.env.PW_JSON_REPORT_PATH || 'test-results/playwright-results.json' },
        ],
        [
          'allure-playwright',
          { resultsDir: process.env.PW_ALLURE_RESULTS_DIR || 'allure-results' },
        ],
      ]
    : [
        [
          'html',
          { outputFolder: process.env.PW_HTML_REPORT_DIR || 'playwright-report', open: 'never' },
        ],
        ['list'],
        [
          'json',
          { outputFile: process.env.PW_JSON_REPORT_PATH || 'test-results/playwright-results.json' },
        ],
        [
          'allure-playwright',
          { resultsDir: process.env.PW_ALLURE_RESULTS_DIR || 'allure-results' },
        ],
      ],
  outputDir: process.env.PW_OUTPUT_DIR || 'test-results',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: runtimeConfig.baseURL,

    /* Collect debugging evidence for failed tests. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  expect: {
    timeout: 5000,
  },

  /* Configure projects for major browsers */
  projects: [
    // API-only project: run tests that target API endpoints without browser automation.
    {
      name: 'api',
      testMatch: /api\/.*\.(?:spec|test)\.ts$/,
      testIgnore: /ecommerce[\\/]api[\\/]/,
      use: {},
    },

    {
      name: 'ecommerce-api',
      testMatch: /ecommerce[\\/]api[\\/].*\.spec\.ts$/,
      use: {
        baseURL:
          process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app',
      },
    },

    {
      name: 'chromium',
      testIgnore: /(?:api|ecommerce)\/.*\.(?:spec|test)\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testIgnore: /(?:api|ecommerce)\/.*\.(?:spec|test)\.ts$/,
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testIgnore: /(?:api|ecommerce)\/.*\.(?:spec|test)\.ts$/,
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'ecommerce-chromium',
      testMatch: 'tests/ecommerce/**/*.spec.ts',
      testIgnore: [
        /ecommerce[\\/]api[\\/]/,
        ...(process.env.ECOMMERCE_REPAIR_EVALUATION === 'true'
          ? []
          : ['**/repair-evaluation.spec.ts']),
      ],
      workers: 3,
      use: {
        ...devices['Desktop Chrome'],
        ...(headedRun
          ? {
              viewport: null,
              launchOptions: { args: ['--start-maximized'] },
            }
          : {}),
        baseURL:
          process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app',
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
