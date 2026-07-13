import { authHeaders } from './authApi';
import { apiUrl } from './apiUrl';

const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

export type SavedBattleSessionState = {
  battleHistory: unknown[];
  battleStats: unknown;
};

export type SavedBattleSessionResponse = {
  createdAt: string;
  displayName: string;
  id: string;
  state: SavedBattleSessionState;
  updatedAt: string;
};

export async function createSavedBattleSession(
  state: SavedBattleSessionState,
): Promise<SavedBattleSessionResponse> {
  return sendSavedBattleSessionRequest(apiUrl('/api/battle-sessions'), 'POST', state);
}

export async function updateSavedBattleSession(
  id: string,
  state: SavedBattleSessionState,
): Promise<SavedBattleSessionResponse> {
  return sendSavedBattleSessionRequest(apiUrl(`/api/battle-sessions/${id}`), 'PUT', state);
}

export async function deleteSavedBattleSession(id: string): Promise<void> {
  const response = await fetchWithTimeout(apiUrl(`/api/battle-sessions/${id}`), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: authHeaders(),
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(await readApiError(response) ?? `Saved battle session delete failed with status ${response.status}`);
  }
}

export async function fetchCurrentSavedBattleSession(): Promise<SavedBattleSessionResponse | null> {
  const response = await fetchWithTimeout(apiUrl('/api/battle-sessions/current'), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  });

  if (response.status === 404 || response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(await readApiError(response) ?? `Current saved battle session request failed with status ${response.status}`);
  }

  return response.json();
}

async function sendSavedBattleSessionRequest(
  url: string,
  method: 'POST' | 'PUT',
  state: SavedBattleSessionState,
): Promise<SavedBattleSessionResponse> {
  const response = await fetchWithTimeout(url, DEFAULT_REQUEST_TIMEOUT_MS, {
    body: JSON.stringify({
      displayName: 'PackBloom Battle Session',
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
    throw new Error(await readApiError(response) ?? `Saved battle session request failed with status ${response.status}`);
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
