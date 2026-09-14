import { env } from 'node:process';

const DEFAULT_BASE_URL = 'https://practice.expandtesting.com';
const DEFAULT_API_BASE = `${DEFAULT_BASE_URL}/notes/api/`;
const DEFAULT_HTTP_BASE = 'http://practice.expandtesting.com/notes/api';

export function resolveRuntimeConfig() {
  const environment = env.TEST_ENV || env.ENVIRONMENT || 'local';
  const baseURL = env.BASE_URL || DEFAULT_BASE_URL;
  const apiBaseURL = env.API_BASE_URL || env.API_BASE || `${baseURL}/notes/api/`;
  const httpBaseURL = env.HTTP_BASE_URL || env.HTTP_BASE || apiBaseURL.replace(/^https:/, 'http:');

  return {
    environment,
    baseURL,
    apiBaseURL,
    httpBaseURL,
  };
}

export const runtimeConfig = resolveRuntimeConfig();

export function assertRuntimeConfig() {
  if (!runtimeConfig.baseURL) {
    throw new Error('BASE_URL is required for the runtime configuration.');
  }

  if (!runtimeConfig.apiBaseURL) {
    throw new Error('API_BASE_URL is required for the runtime configuration.');
  }

  return runtimeConfig;
}