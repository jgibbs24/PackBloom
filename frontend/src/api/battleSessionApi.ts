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
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Saved battle session delete failed with status ${response.status}`);
  }
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
    },
    method,
  });

  if (!response.ok) {
    throw new Error(`Saved battle session request failed with status ${response.status}`);
  }

  return response.json();
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
