'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Explicitly reviewed public-safe files. Never discover and run staging specs automatically.
const files = [
  'account-cart-checkout',
  'auth-confirmation-blank',
  'auth-confirmation-mismatch',
  'auth-password-visibility',
  'cart-browser-controls',
  'cart-guest-denial',
  'cart-malformed-storage',
  'cart-storage-fixture',
  'catalog-fixture',
  'catalog-boundaries-fixture',
  'catalog-refinements-fixture',
  'catalog',
  'category-membership-fixture',
  'currency-fixture',
  'footer-content',
  'guest-boundaries',
  'home-destinations',
  'home-hero',
  'legacy-category-redirects',
  'legal',
  'navigation-accessibility',
  'newsletter-preview',
  'not-found-admin-shell',
  'price-sorting',
  'product-card-fixture',
  'product-detail',
  'product-information',
  'search-fixture',
  'search-input',
  'seed',
];
const root = path.resolve(__dirname, '..');
function run(args = process.argv.slice(2)) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, 'node_modules/@playwright/test/cli.js'),
      'test',
      ...files.map((file) => `tests/ecommerce/${file}.spec.ts`),
      '--project=ecommerce-chromium',
      ...args,
    ],
    { cwd: root, stdio: 'inherit', env: { ...process.env, ECOMMERCE_STAGING_CONFIRMED: 'false' } },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status === null ? 1 : result.status;
}
if (require.main === module) run();
module.exports = { files: files.map((file) => `tests/ecommerce/${file}.spec.ts`), run };
