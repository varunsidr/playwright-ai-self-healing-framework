'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
function validate(config) {
  if (!/^zeouf-integration-[a-z0-9-]+$/.test(config.projectId || ''))
    throw new Error('Missing disposable integration project identity');
  for (const key of ['apiUrl', 'dbUrl', 'appUrl', 'mailUrl']) {
    const url = new URL(config[key]);
    if (
      !['127.0.0.1', 'localhost'].includes(url.hostname) ||
      !url.port ||
      !['http:', 'postgresql:', 'postgres:'].includes(url.protocol)
    )
      throw new Error('Integration endpoints must be explicit loopback services');
  }
  if (!config.anonKey || !config.serviceKey || !config.website)
    throw new Error('Missing local service configuration');
  return config;
}
function target() {
  if (!process.env.ECOMMERCE_INTEGRATION_CONFIG)
    throw new Error('Use test:ecommerce:integration; production is never a fallback');
  const config = validate(
    JSON.parse(fs.readFileSync(process.env.ECOMMERCE_INTEGRATION_CONFIG, 'utf8')),
  );
  return { config, requireWebsite: createRequire(path.join(config.website, 'package.json')) };
}
module.exports = { validate, target };
