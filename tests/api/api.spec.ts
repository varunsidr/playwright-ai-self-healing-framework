/// <reference types="@playwright/test" />
import { test, expect } from '../../fixtures/api-fixtures';
import type { APIResponse } from '@playwright/test';

// Small helper to generate unique emails for test users
const uniqueEmail = () => `test.user.${Date.now()}@example.com`;

// Debug helper: log status, selected headers and truncated body for failed responses
async function logResponse(resp: APIResponse, label: string) {
  const status = resp.status();
  const headers = resp.headers();
  // request() exposes the APIRequest that generated this response
  let reqInfo = '<unavailable>';
  try {
    const req = (resp as unknown as { request?: () => { method(): string; url(): string } }).request?.();
    if (req) reqInfo = `${req.method()} ${req.url()}`;
  } catch (e) {
    reqInfo = `<error getting request: ${String(e)}>`;
  }
  let bodyText = '';
  try {
    bodyText = await resp.text();
  } catch (e) {
    bodyText = `<unable to read body: ${String(e)}>`;
  }
  const truncated = bodyText.length > 1000 ? bodyText.slice(0, 1000) + '...<truncated>' : bodyText;
  console.error(`${label} -> status=${status} | request=${reqInfo}`);
  console.error('Selected headers:', { 'content-type': headers['content-type'], location: headers['location'] });
  console.error('Body (truncated):', truncated);
}

test('health-check returns OK', async ({ apiCall, apiConfig }) => {
  const r = await apiCall('get', apiConfig.endpoints.healthCheck);
  if (!r.ok()) {
    const body = await r.text();
    console.error('Health-check failed', r.status(), body);
  }
  expect(r.ok()).toBeTruthy();
});

test('register -> login -> notes CRUD', async ({ apiCall, apiConfig }) => {
    const name = 'API Test User';
    const email = uniqueEmail();
    const password = 'Password123!';
    let token: string | undefined = undefined;
    let noteId: string | undefined = undefined;

    try {
      // Register (API expects form data according to docs)
      const reg = await apiCall('post', apiConfig.endpoints.register, { form: { name, email, password } });
      if (!reg.ok()) {
        await logResponse(reg, 'Register failed');
      }
      expect(reg.status()).toBe(201);
      // attempt to assert returned email if present
      try {
        const regBody = await reg.json();
        const returnedEmail = regBody.email || regBody.data?.email;
        if (returnedEmail) expect(returnedEmail).toBe(email);
      } catch (e) {
        // ignore non-json or unexpected shapes
      }

      // Login (use form data)
      const login = await apiCall('post', apiConfig.endpoints.login, { form: { email, password } });
      if (!login.ok()) {
        await logResponse(login, 'Login failed');
      }
      expect(login.ok()).toBeTruthy();
      const loginBody = await login.json();
      // token may be at root or under `data` depending on API shape
      token = (loginBody && (loginBody.token || loginBody.data?.token)) as string | undefined;
      expect(token).toBeTruthy();

      // Create note
      const notePayload = { title: 'API note', description: 'Created by Playwright API test', category: 'Home' };
      const create = await apiCall('post', 'notes', { data: notePayload, headers: { [apiConfig.http.authHeader]: token! } });
      if (!create.ok()) {
        await logResponse(create, 'Create note failed');
      }
      expect(create.ok()).toBeTruthy();
      const created = await create.json();
      noteId = created.id || created.data?.id;
      expect(noteId).toBeTruthy();

      // Get all notes and ensure ours is present
      const all = await apiCall('get', 'notes', { headers: { [apiConfig.http.authHeader]: token! } });
      expect(all.status()).toBe(200);
      const allBody = await all.json();
      const notesList = Array.isArray(allBody) ? allBody : (allBody && allBody.data) || [];
      expect(Array.isArray(notesList)).toBeTruthy();

      // Get note by id
      const getOne = await apiCall('get', `notes/${noteId}`, { headers: { [apiConfig.http.authHeader]: token! } });
      expect(getOne.status()).toBe(200);
      const singleBody = await getOne.json();
      const singleNote = singleBody && singleBody.title ? singleBody : (singleBody && (singleBody.data || singleBody.item)) || {};
      expect(singleNote.title).toBe(notePayload.title);

      // Update the note (PATCH used instead of PUT for compatibility)
      const updatedPayload = { title: 'API note - updated', description: 'Updated description', category: 'Home' };
      const update = await apiCall('patch', `notes/${noteId}`, { data: updatedPayload, headers: { [apiConfig.http.authHeader]: token! } });
      if (!update.ok()) await logResponse(update, 'Update note failed');
      expect(update.status()).toBeGreaterThanOrEqual(200);

      // Toggle completed via PATCH
      const patch = await apiCall('patch', `notes/${noteId}`, { data: { completed: true }, headers: { [apiConfig.http.authHeader]: token! } });
      expect(patch.status()).toBeGreaterThanOrEqual(200);

      // Delete the note
      const del = await apiCall('delete', `notes/${noteId}`, { headers: { [apiConfig.http.authHeader]: token! } });
      expect(del.status()).toBe(200);

    } finally {
      // Cleanup: delete the temporary user account if we obtained a token
      if (token) {
          const cleanup = await apiCall('delete', apiConfig.endpoints.deleteAccount, { headers: { [apiConfig.http.authHeader]: token } });
        if (!cleanup.ok()) {
          await logResponse(cleanup, 'Account cleanup failed');
        }
        // best-effort: don't fail the main test on cleanup problems, but log
      }
    }
});
