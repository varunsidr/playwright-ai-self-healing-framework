/* eslint-disable no-console */
import { test, expect } from '../../fixtures/api-fixtures';
import { createNoteRaw, buildNotePayload } from '../../utils/notes-api-client';

type NoteResponseBody = {
  id?: string;
  data?: { id?: string };
};

test.describe('@api notes contract', () => {
  test('missing auth sees 401 when creating a note', async ({ api, apiSeed }) => {
    const user = await apiSeed.ensureUser('notes-contract-401', true);
    const result = await createNoteRaw(api, undefined, buildNotePayload(), {
      headers: { Accept: 'application/json' },
    });

    expect(result.status).toBe(401);
    expect(result.ok).toBeFalsy();
    const authMessage =
      typeof result.body === 'string'
        ? result.body
        : JSON.stringify(result.body ?? result.text ?? '');
    expect(authMessage).toMatch(/auth|token/i);

    const cleanup = await api.delete('users/delete-account', {
      headers: { 'x-auth-token': user.token, Accept: 'application/json' },
    });
    if (!cleanup.ok()) {
      console.warn('Cleanup warning', cleanup.status(), await cleanup.text().catch(() => ''));
    }
  });

  test('invalid note payload is rejected with 400', async ({ api, apiSeed }) => {
    const user = await apiSeed.ensureUser('notes-contract-400', true);
    const payload = {
      title: 'ab',
      description: 'Valid desc',
      category: 'Home',
      completed: 'not-a-boolean',
    };

    const result = await createNoteRaw(api, user.token, payload);

    expect(result.status).toBe(400);
    expect(result.ok).toBeFalsy();
    const invalidMessage =
      typeof result.body === 'string'
        ? result.body
        : JSON.stringify(result.body ?? result.text ?? '');
    expect(invalidMessage).toMatch(/title|boolean|invalid|must/i);

    const cleanup = await api.delete('users/delete-account', {
      headers: { 'x-auth-token': user.token, Accept: 'application/json' },
    });
    if (!cleanup.ok()) {
      console.warn('Cleanup warning', cleanup.status(), await cleanup.text().catch(() => ''));
    }
  });

  test('invalid note update payload is rejected with 400', async ({ api, apiSeed }) => {
    const user = await apiSeed.ensureUser('notes-contract-update-400', true);
    const created = await createNoteRaw(api, user.token, {
      title: 'Valid Note',
      description: 'Valid description',
      category: 'Home',
    });
    expect(created.status).toBe(200);

    const responseBody = created.body as NoteResponseBody | null;
    const noteId = responseBody?.data?.id ?? responseBody?.id;
    expect(noteId).toBeTruthy();

    const update = await api.patch(`notes/${noteId}`, {
      data: { title: 'ab', completed: 'not-a-boolean' },
      headers: {
        'x-auth-token': user.token,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    const updateText = await update.text().catch(() => '');
    expect(update.status()).toBe(400);
    expect(update.ok()).toBeFalsy();
    expect(updateText).toMatch(/title|boolean|invalid|must/i);

    const cleanup = await api.delete('users/delete-account', {
      headers: { 'x-auth-token': user.token, Accept: 'application/json' },
    });
    if (!cleanup.ok()) {
      console.warn('Cleanup warning', cleanup.status(), await cleanup.text().catch(() => ''));
    }
  });
});
