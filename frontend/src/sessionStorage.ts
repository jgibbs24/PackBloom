import type { BoosterType } from './packLabels';
import type { CardDto, SessionStats } from './types/pack';

export type PersistedSessionState = {
  activeView: 'opener' | 'binder';
  binderCards: CardDto[];
  boosterTypesBySetCode: Record<string, BoosterType>;
  chaseCardName: string;
  isFastMode: boolean;
  revealMode: 'all' | 'one-by-one';
  selectedSetCode: string;
  sessionStats: SessionStats;
};

const SESSION_STORAGE_KEY = 'packbloom-session-v1';
const SESSION_STORAGE_VERSION = 1;

type StoredSessionState = PersistedSessionState & {
  version: number;
};

export function loadPersistedSession(): PersistedSessionState | null {
  try {
    const rawSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawSession) {
      return null;
    }

    const parsedSession = JSON.parse(rawSession) as Partial<StoredSessionState>;
    if (parsedSession.version !== SESSION_STORAGE_VERSION) {
      return null;
    }

    if (
      !parsedSession.sessionStats
      || !parsedSession.selectedSetCode
      || !parsedSession.revealMode
      || !parsedSession.activeView
    ) {
      return null;
    }

    return {
      activeView: parsedSession.activeView,
      binderCards: parsedSession.binderCards ?? [],
      boosterTypesBySetCode: parsedSession.boosterTypesBySetCode ?? {},
      chaseCardName: parsedSession.chaseCardName ?? '',
      isFastMode: parsedSession.isFastMode ?? false,
      revealMode: parsedSession.revealMode,
      selectedSetCode: parsedSession.selectedSetCode,
      sessionStats: parsedSession.sessionStats,
    };
  } catch {
    return null;
  }
}

export function savePersistedSession(session: PersistedSessionState) {
  const storedSession: StoredSessionState = {
    ...session,
    version: SESSION_STORAGE_VERSION,
  };

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedSession));
}

export function clearPersistedSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}
