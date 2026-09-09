import { test as base } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { withSharedState } from '../utils/api-state-cache';
import { runtimeConfig } from '../utils/runtime-config';

const API_BASE = runtimeConfig.apiBaseURL;
const HTTP_BASE = runtimeConfig.httpBaseURL;

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

export type ApiRequestOptions = {
  form?: Record<string, string>;
  headers?: Record<string, string>;
  data?: any;
  followRedirects?: boolean;
};

export type ApiRawResult = {
  status: number;
  ok: boolean;
  body: any;
  text: string;
  headers: Record<string, string>;
  error?: string;
};

export type ApiSeedUser = {
  name: string;
  email: string;
  password: string;
  token: string;
  createdAt: number;
};

export function normalizeApiEndpoint(endpoint: string): string {
  let requestEndpoint = endpoint;
  if (!requestEndpoint.startsWith('http://') && !requestEndpoint.startsWith('https://')) {
    if (requestEndpoint.startsWith('/')) requestEndpoint = requestEndpoint.slice(1);
  }
  return requestEndpoint;
}

export async function parseApiResponse(resp: APIResponse): Promise<ApiRawResult> {
  const text = await resp.text().catch(() => '');
  let body: any = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    status: resp.status(),
    ok: resp.ok(),
    body,
    text,
    headers: resp.headers() as Record<string, string>,
  };
}

export const test = base.extend<{
  api: APIRequestContext;
  apiCall: (
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    endpoint: string,
    options?: ApiRequestOptions
  ) => Promise<APIResponse>;
  apiClient: {
    strict: (
      method: 'get' | 'post' | 'put' | 'delete' | 'patch',
      endpoint: string,
      options?: ApiRequestOptions
    ) => Promise<APIResponse>;
    raw: (
      method: 'get' | 'post' | 'put' | 'delete' | 'patch',
      endpoint: string,
      options?: ApiRequestOptions
    ) => Promise<ApiRawResult>;
    request: APIRequestContext;
    config: typeof API_CONFIG;
  };
  apiSeed: {
    ensureUser: (prefix?: string, forceRefresh?: boolean) => Promise<ApiSeedUser>;
  };
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
        options: ApiRequestOptions = {}
      ) {
        const attempts = API_CONFIG.retry.maxAttempts;
        let lastErr: any;
        for (let i = 1; i <= attempts; i++) {
          try {
            const headers = { ...(options.headers || {}) };
            const requestOpts: any = { headers };
            if (options.form) {
              const params = new URLSearchParams(options.form as Record<string, string>);
              requestOpts.data = params.toString();
              requestOpts.headers = { ...requestOpts.headers, 'content-type': API_CONFIG.http.contentType };
            } else if (options.data) {
              requestOpts.data = options.data;
            }
            if (typeof options.followRedirects === 'boolean') requestOpts.followRedirects = options.followRedirects;

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

            if (process.env.DEBUG_API_HEADERS) {
              // eslint-disable-next-line no-console
              console.error('API request', method.toUpperCase(), normalizeApiEndpoint(endpoint), 'headers:', requestOpts.headers);
            }

            const requestEndpoint = normalizeApiEndpoint(endpoint);
            const resp = await (api as any)[method](requestEndpoint, requestOpts);
            return resp as APIResponse;
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

  apiClient: [
    async ({ api, apiConfig }, use) => {
      const strict = async (
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        endpoint: string,
        options: ApiRequestOptions = {}
      ) => {
        const headers = { ...(options.headers || {}) };
        const requestOpts: any = { headers };
        if (options.form) {
          const params = new URLSearchParams(options.form as Record<string, string>);
          requestOpts.data = params.toString();
          requestOpts.headers = { ...requestOpts.headers, 'content-type': API_CONFIG.http.contentType };
        } else if (options.data) {
          requestOpts.data = options.data;
        }
        if (typeof options.followRedirects === 'boolean') requestOpts.followRedirects = options.followRedirects;

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

        const requestEndpoint = normalizeApiEndpoint(endpoint);
        return (api as any)[method](requestEndpoint, requestOpts) as Promise<APIResponse>;
      };

      const raw = async (
        method: 'get' | 'post' | 'put' | 'delete' | 'patch',
        endpoint: string,
        options: ApiRequestOptions = {}
      ): Promise<ApiRawResult> => {
        try {
          const response = await strict(method, endpoint, options);
          return parseApiResponse(response);
        } catch (error) {
          return {
            status: 0,
            ok: false,
            body: null,
            text: String(error),
            headers: {},
            error: String(error),
          };
        }
      };

      await use({ strict, raw, request: api, config: apiConfig });
    },
    { auto: true },
  ],

  apiSeed: [
    async ({ api, apiConfig }, use) => {
      const buildSeedUser = async (): Promise<ApiSeedUser> => {
        const name = 'Seeded API User';
        const email = `seed.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;
        const password = 'Password123!';

        const registerEndpoint = normalizeApiEndpoint(apiConfig.endpoints.register);
        const loginEndpoint = normalizeApiEndpoint(apiConfig.endpoints.login);

        const reg = await api.post(registerEndpoint, { form: { name, email, password } });
        if (!reg.ok()) {
          throw new Error(`Seed registration failed: ${reg.status()} ${await reg.text().catch(() => '')}`);
        }

        const login = await api.post(loginEndpoint, { form: { email, password } });
        if (!login.ok()) {
          throw new Error(`Seed login failed: ${login.status()} ${await login.text().catch(() => '')}`);
        }

        const loginBody = await login.json();
        const token = loginBody.token || loginBody.data?.token;
        if (!token) {
          throw new Error('Seed login response did not include a token.');
        }

        return {
          name,
          email,
          password,
          token,
          createdAt: Date.now(),
        };
      };

      const ensureUser = async (prefix = 'default-user-seed', forceRefresh = false): Promise<ApiSeedUser> => {
        if (forceRefresh) {
          const { clearStateCache } = await import('../utils/api-state-cache');
          clearStateCache('api-users');
          return withSharedState(prefix, 'api-users', buildSeedUser);
        }

        const user = await withSharedState(prefix, 'api-users', buildSeedUser);
        const staleAfterMs = 15 * 60 * 1000;

        if (!user?.token || Date.now() - (user.createdAt || 0) > staleAfterMs) {
          const { clearStateCache } = await import('../utils/api-state-cache');
          clearStateCache('api-users');
          return withSharedState(prefix, 'api-users', buildSeedUser);
        }

        return user;
      };

      await use({ ensureUser });
    },
    { auto: true },
  ],

  apiConfig: [API_CONFIG, { auto: true }],
});

export { expect } from '@playwright/test';
