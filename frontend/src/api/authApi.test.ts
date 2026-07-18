import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthSessionExpiredError,
  loadAuthSession,
  saveAuthSession,
  subscribeToAuthSessionChanges,
  throwIfUnauthorized,
  validateStoredAuthSession,
} from './authApi';

const storedSession = {
  token: 'stored-token',
  user: {
    displayName: 'Old Name',
    email: 'player@test.dev',
    id: 'user-1',
  },
};

describe('authApi session lifecycle', () => {
  beforeEach(() => {
    vi.stubGlobal('window', new FakeWindow());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('validates a stored token with the server before returning the session', async () => {
    saveAuthSession(storedSession);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, {
      displayName: 'Current Name',
      email: 'player@test.dev',
      id: 'user-1',
    })));

    await expect(validateStoredAuthSession()).resolves.toEqual({
      token: 'stored-token',
      user: {
        displayName: 'Current Name',
        email: 'player@test.dev',
        id: 'user-1',
      },
    });
  });

  it('clears stored authentication and notifies the current tab on a 401', async () => {
    saveAuthSession(storedSession);
    const observedSessions: unknown[] = [];
    const unsubscribe = subscribeToAuthSessionChanges((session) => observedSessions.push(session));

    await expect(throwIfUnauthorized(jsonResponse(401, {
      code: 'AUTH_INVALID',
      message: 'Your sign-in has expired or is invalid.',
    }))).rejects.toBeInstanceOf(AuthSessionExpiredError);

    expect(loadAuthSession()).toBeNull();
    expect(observedSessions).toEqual([null]);
    unsubscribe();
  });

  it('clears an invalid stored token during startup validation', async () => {
    saveAuthSession(storedSession);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, {
      code: 'AUTH_INVALID',
      message: 'Expired',
    })));

    await expect(validateStoredAuthSession()).resolves.toBeNull();
    expect(loadAuthSession()).toBeNull();
  });
});

class FakeStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return Array.from(this.values.keys())[index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

class FakeWindow extends EventTarget {
  readonly localStorage: Storage = new FakeStorage();
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}
