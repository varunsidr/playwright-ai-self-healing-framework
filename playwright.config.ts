/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import { runtimeConfig } from './utils/runtime-config';

const headedRun = process.argv.includes('--headed');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
        ['json', { outputFile: 'test-results/playwright-results.json' }],
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
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
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/playwright-results.json' }],
      ]
    : [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  outputDir: 'test-results',
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
      use: {},
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
      workers: 3,
      use: {
        ...devices['Desktop Chrome'],
        ...(headedRun
          ? {
              viewport: null,
              launchOptions: { args: ['--start-maximized'] },
            }
          : {}),
        baseURL: process.env.ECOMMERCE_BASE_URL || 'http://localhost:3000',
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
