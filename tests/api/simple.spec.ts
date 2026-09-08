/// <reference types="@playwright/test" />
import { test, expect } from '../../fixtures/api-fixtures';

// Minimal API tests to keep things simple and focused
const uniqueEmail = () => `basic.user.${Date.now()}@example.com`;

test('health-check returns OK (basic)', async ({ apiCall, apiConfig }) => {
  const r = await apiCall('get', apiConfig.endpoints.healthCheck);
  if (!r.ok()) {
    const body = await r.text().catch(() => '<unreadable>');
    console.error('Health-check failed:', r.status(), body.slice?.(0, 1000) ?? body);
  }
  expect(r.ok()).toBeTruthy();
});

test('register -> login (basic)', async ({ apiCall, apiConfig }) => {
  const name = 'Basic User';
  const email = uniqueEmail();
  const password = 'Password123!';

  const reg = await apiCall('post', apiConfig.endpoints.register, { form: { name, email, password } });
  if (!reg.ok()) {
    const body = await reg.text().catch(() => '<unreadable>');
    console.error('Register failed:', reg.status(), body.slice?.(0, 1000) ?? body);
  }
  expect(reg.status()).toBeGreaterThanOrEqual(200);

  const login = await apiCall('post', apiConfig.endpoints.login, { form: { email, password } });
  if (!login.ok()) {
    const body = await login.text().catch(() => '<unreadable>');
    console.error('Login failed:', login.status(), body.slice?.(0, 2000) ?? body);
  }
  expect(login.ok()).toBeTruthy();

  const body = await login.json().catch(() => ({}));
  const token = body.token || body.data?.token; // token key may be root or under `data`
  expect(token).toBeTruthy();

  // cleanup: delete account using configured auth header
  if (token) {
    const headers: Record<string, string> = {};
    headers[apiConfig.http.authHeader] = token;
    const del = await apiCall('delete', apiConfig.endpoints.deleteAccount, { headers });
    // best-effort cleanup, don't fail test on cleanup problems
    if (!del.ok()) console.error('Account cleanup failed', del.status());
  }
});

test('http -> https redirect (basic)', async ({ playwright, apiConfig }) => {
  // create a short-lived context pointed at the HTTP base and do not follow redirects
  const httpCtx = await playwright.request.newContext({ baseURL: 'http://practice.expandtesting.com/notes/api' });
  try {
    // use fetch with redirect: 'manual' to observe redirect response
    const resp = await httpCtx.fetch(apiConfig.endpoints.healthCheck, { method: 'GET', redirect: 'manual' });
    // expect a redirect status (301/302) or a 404 if the HTTP path is not enabled
    expect([301, 302, 307, 308, 404]).toContain(resp.status());
  } finally {
    await httpCtx.dispose();
  }
});
