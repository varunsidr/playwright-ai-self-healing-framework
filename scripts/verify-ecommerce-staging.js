'use strict';

const urlText = process.env.ECOMMERCE_BASE_URL;
const confirmed = process.env.ECOMMERCE_STAGING_CONFIRMED === 'true';
const hasUser = !!process.env.ECOMMERCE_TEST_USER_EMAIL;
const hasPassword = !!process.env.ECOMMERCE_TEST_USER_PASSWORD;
let isSeparateUrl = false;

try {
  const url = new URL(urlText);
  isSeparateUrl =
    url.protocol === 'https:' &&
    !!url.hostname &&
    url.hostname !== 'zeouf-luxury-fashion-ecommerce.vercel.app';
} catch {
  // Invalid or missing URL is handled by the shared failure message below.
}

if (!confirmed || !isSeparateUrl || !hasUser || !hasPassword) {
  process.stderr.write(
    'Full Zeouf tests require a separate HTTPS staging URL, ECOMMERCE_STAGING_CONFIRMED=true, and disposable ECOMMERCE_TEST_USER_EMAIL/PASSWORD secrets. Confirm the staging Supabase project and cleanup before setting the flag.\n',
  );
  process.exitCode = 1;
} else {
  process.stdout.write('Zeouf staging configuration is present.\n');
}
