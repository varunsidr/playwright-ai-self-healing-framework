import { test as base } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

// Configuration derived from the JSON you provided.
const API_BASE = process.env.API_BASE || 'https://practice.expandtesting.com/notes/api/';
const HTTP_BASE = process.env.HTTP_BASE || 'http://practice.expandtesting.com/notes/api';

const API_CONFIG = {
  endpoints: {
    healthCheck: '/health-check',
    login: '/users/login',
    register: '/users/register',
    deleteAccount: '/users/delete-account',
  },
  http: {
    accept: 'application/json',
    contentType: 'application/x-www-form-urlencoded',
    userAgent: 'Hybrid-Framework-API-Tests/1.0',
    authHeader: 'x-auth-token',
  },
  timeouts: {
    connectSeconds: 10,
    requestSeconds: 15,
  },
  retry: {
    maxAttempts: 2,
    delayMillis: 500,
  },
};

export const test = base.extend<{
  api: APIRequestContext;
  apiCall: (
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    endpoint: string,
    options?: { form?: Record<string, string>; headers?: Record<string, string>; data?: any; followRedirects?: boolean }
  ) => Promise<import('@playwright/test').APIResponse>;
  apiConfig: typeof API_CONFIG;
}>({
  api: [
    async ({ playwright }, use) => {
      const api = await playwright.request.newContext({
        baseURL: API_BASE,
        timeout: API_CONFIG.timeouts.requestSeconds * 1000,
        extraHTTPHeaders: {
          Accept: API_CONFIG.http.accept + ', text/plain, */*',
          'User-Agent': API_CONFIG.http.userAgent,
        },
      });
      await use(api);
      await api.dispose();
    },
    { auto: true },
  ],

  // apiCall helper implements retry and form encoding rules
  apiCall: [
    async ({ api }, use) => {
      async function call(
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        endpoint: string,
        options: { form?: Record<string, string>; headers?: Record<string, string>; data?: any; followRedirects?: boolean } = {}
      ) {
        const attempts = API_CONFIG.retry.maxAttempts;
        let lastErr: any;
        for (let i = 1; i <= attempts; i++) {
          try {
            const headers = { ...(options.headers || {}) };
            let body: any = undefined;
            const requestOpts: any = { headers };
            if (options.form) {
              const params = new URLSearchParams(options.form as Record<string, string>);
              body = params.toString();
              requestOpts.data = body;
              requestOpts.headers = { ...requestOpts.headers, 'content-type': API_CONFIG.http.contentType };
            } else if (options.data) {
              requestOpts.data = options.data;
            }
            // allow manual redirect handling
            if (typeof options.followRedirects === 'boolean') requestOpts.followRedirects = options.followRedirects;

            // sanitize headers: remove undefined/null and coerce values to strings
            if (requestOpts.headers) {
              for (const hk of Object.keys(requestOpts.headers)) {
                const hv = (requestOpts.headers as Record<string, any>)[hk];
                if (hv === undefined || hv === null) {
                  delete (requestOpts.headers as Record<string, any>)[hk];
                } else {
                  (requestOpts.headers as Record<string, any>)[hk] = String(hv);
                }
              }
            }

            // optional debug: log headers when debugging is enabled
            if (process.env.DEBUG_API_HEADERS) {
              // keep console usage minimal and informative
              // eslint-disable-next-line no-console
              console.error('API request', method.toUpperCase(), requestEndpoint, 'headers:', requestOpts.headers);
            }

            // normalize endpoint: remove leading slash so baseURL path segment is preserved
            let requestEndpoint = endpoint;
            if (!requestEndpoint.startsWith('http://') && !requestEndpoint.startsWith('https://')) {
              if (requestEndpoint.startsWith('/')) requestEndpoint = requestEndpoint.slice(1);
            }
            // call the API
            const resp = await (api as any)[method](requestEndpoint, requestOpts);
            return resp as import('@playwright/test').APIResponse;
          } catch (e) {
            lastErr = e;
            if (i < attempts) await new Promise((r) => setTimeout(r, API_CONFIG.retry.delayMillis));
          }
        }
        throw lastErr;
      }

      await use(call);
    },
    { auto: true },
  ],

  apiConfig: [API_CONFIG, { auto: true }],
});

export { expect } from '@playwright/test';
