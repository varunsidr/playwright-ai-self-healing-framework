import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

const files = [
  'tests/ecommerce/seed.spec.ts',
  'tests/ecommerce/legal.spec.ts',
  'tests/ecommerce/auth-confirmation-mismatch.spec.ts',
  'tests/ecommerce/auth-confirmation-blank.spec.ts',
  'tests/ecommerce/auth-password-visibility.spec.ts',
];
const baseURL =
  process.env.ECOMMERCE_BASE_URL || 'https://zeouf-luxury-fashion-ecommerce.vercel.app';
export default defineConfig({
  ...base,
  retries: 0,
  workers: 1,
  metadata: { ...base.metadata, verificationLayer: 'cross-browser-smoke' },
  projects: [
    {
      name: 'ecommerce-chromium',
      testMatch: files,
      use: { ...devices['Desktop Chrome'], baseURL },
    },
    {
      name: 'ecommerce-firefox',
      testMatch: files,
      use: { ...devices['Desktop Firefox'], baseURL },
    },
    { name: 'ecommerce-webkit', testMatch: files, use: { ...devices['Desktop Safari'], baseURL } },
    {
      name: 'ecommerce-mobile-chromium',
      testMatch: files,
      use: { ...devices['Pixel 7'], baseURL },
    },
  ],
});
