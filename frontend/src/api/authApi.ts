import { apiUrl } from './apiUrl';

const AUTH_STORAGE_KEY = 'packbloom-auth-v1';
const DEFAULT_REQUEST_TIMEOUT_MS = 12000;

export type AuthenticatedUser = {
  displayName: string;
  email: string;
  id: string;
};

export type AuthSession = {
  token: string;
  user: AuthenticatedUser;
};

export type AuthMode = 'login' | 'register';

export function loadAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsedSession = JSON.parse(rawSession) as Partial<AuthSession>;
    if (!parsedSession.token || !parsedSession.user?.id) {
      return null;
    }

    return parsedSession as AuthSession;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return loadAuthSession()?.token ?? null;
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function submitAuthRequest({
  displayName,
  email,
  mode,
  password,
}: {
  displayName: string;
  email: string;
  mode: AuthMode;
  password: string;
}): Promise<AuthSession> {
  const response = await fetchWithTimeout(apiUrl(`/api/auth/${mode}`), DEFAULT_REQUEST_TIMEOUT_MS, {
    body: JSON.stringify({
      displayName,
      email,
      password,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const error = await readApiError(response);
    throw new Error(error ?? `Authentication failed with status ${response.status}`);
  }

  const session = await response.json() as AuthSession;
  saveAuthSession(session);
  return session;
}

export async function logoutAuthSession(): Promise<void> {
  const token = getAuthToken();
  clearAuthSession();
  if (!token) {
    return;
  }

  await fetchWithTimeout(apiUrl('/api/auth/logout'), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: 'POST',
  }).catch(() => undefined);
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
