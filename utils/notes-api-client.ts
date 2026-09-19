import type { APIRequestContext, APIResponse } from '@playwright/test';

export type NotePayload = {
  title: string;
  description: string;
  category: string;
  completed?: boolean;
};

export type ParsedApiResult = {
  status: number;
  ok: boolean;
  body: unknown;
  text: string;
  headers: Record<string, string>;
};

function normalizeEndpoint(endpoint: string): string {
  return endpoint.replace(/^\/+/, '');
}

export function buildNotePayload(overrides: Partial<NotePayload> = {}): NotePayload {
  return {
    title: 'API note',
    description: 'Created by Playwright API test',
    category: 'Home',
    completed: false,
    ...overrides,
  };
}

export async function parseApiResult(response: APIResponse): Promise<ParsedApiResult> {
  const text = await response.text().catch(() => '');
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return {
    status: response.status(),
    ok: response.ok(),
    body,
    text,
    headers: response.headers() as Record<string, string>,
  };
}

export async function createNote(
  api: APIRequestContext,
  token: string,
  payload: Partial<NotePayload> = {},
): Promise<APIResponse> {
  return api.post(normalizeEndpoint('notes'), {
    data: buildNotePayload(payload),
    headers: {
      'x-auth-token': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export async function createNoteRaw(
  api: APIRequestContext,
  token: string | undefined,
  payload: unknown,
  options: { headers?: Record<string, string> } = {},
): Promise<ParsedApiResult> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['x-auth-token'] = token;
  }

  const response = await api.post(normalizeEndpoint('notes'), {
    data: payload,
    headers,
  });

  return parseApiResult(response);
}

export async function getNotes(api: APIRequestContext, token: string): Promise<APIResponse> {
  return api.get(normalizeEndpoint('notes'), {
    headers: {
      'x-auth-token': token,
      Accept: 'application/json',
    },
  });
}

export async function getNoteById(
  api: APIRequestContext,
  token: string,
  noteId: string,
): Promise<APIResponse> {
  return api.get(normalizeEndpoint(`notes/${noteId}`), {
    headers: {
      'x-auth-token': token,
      Accept: 'application/json',
    },
  });
}

export async function updateNote(
  api: APIRequestContext,
  token: string,
  noteId: string,
  payload: Partial<NotePayload>,
): Promise<APIResponse> {
  return api.patch(normalizeEndpoint(`notes/${noteId}`), {
    data: payload,
    headers: {
      'x-auth-token': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

export async function deleteNote(
  api: APIRequestContext,
  token: string,
  noteId: string,
): Promise<APIResponse> {
  return api.delete(normalizeEndpoint(`notes/${noteId}`), {
    headers: {
      'x-auth-token': token,
      Accept: 'application/json',
    },
  });
}
