import type { PersistedSessionState } from '../sessionStorage';
import { authHeaders } from './authApi';
import { apiUrl } from './apiUrl';

const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

export type SavedSessionResponse = {
  createdAt: string;
  displayName: string;
  id: string;
  state: PersistedSessionState;
  updatedAt: string;
};

export async function createSavedSession(state: PersistedSessionState): Promise<SavedSessionResponse> {
  return sendSavedSessionRequest(apiUrl('/api/sessions'), 'POST', state);
}

export async function updateSavedSession(
  id: string,
  state: PersistedSessionState,
): Promise<SavedSessionResponse> {
  return sendSavedSessionRequest(apiUrl(`/api/sessions/${id}`), 'PUT', state);
}

export async function fetchCurrentSavedSession(): Promise<SavedSessionResponse | null> {
  const response = await fetchWithTimeout(apiUrl('/api/sessions/current'), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  });

  if (response.status === 404 || response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readApiError(response) ?? `Current saved session request failed with status ${response.status}`);
  }

  return response.json();
}

async function sendSavedSessionRequest(
  url: string,
  method: 'POST' | 'PUT',
  state: PersistedSessionState,
): Promise<SavedSessionResponse> {
  const response = await fetchWithTimeout(url, DEFAULT_REQUEST_TIMEOUT_MS, {
    body: JSON.stringify({
      displayName: 'PackBloom Session',
      state,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    method,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response) ?? `Saved session request failed with status ${response.status}`);
  }

  return response.json();
}

async function readApiError(response: Response): Promise<string | null> {
  try {
    const body = await response.json() as Partial<{ message: string }>;
    return body.message ?? null;
  } catch {
    return null;
  }
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  timeoutMs: number,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => {
    window.clearTimeout(timeoutId);
  });
}
