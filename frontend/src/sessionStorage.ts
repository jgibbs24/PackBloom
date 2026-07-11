import type { BoosterType } from './packLabels';
import type { CardDto, PackHistoryEntry, SessionStats } from './types/pack';

export type PersistedActiveView = 'opener' | 'binder' | 'history';

export type PersistedSessionState = {
  activeView: PersistedActiveView;
  allPulledCards: CardDto[];
  binderCards: CardDto[];
  boosterTypesBySetCode: Record<string, BoosterType>;
  chaseCardName: string;
  isAudioMuted: boolean;
  isAudioEnabled: boolean;
  audioVolume: number;
  isFastMode: boolean;
  isMusicEnabled: boolean;
  isSfxEnabled: boolean;
  packHistory: PackHistoryEntry[];
  revealMode: 'all' | 'one-by-one';
  selectedSetCode: string;
  sessionStats: SessionStats;
};

const SESSION_STORAGE_KEY = 'packbloom-session-v1';
const REMOTE_SESSION_ID_KEY = 'packbloom-remote-session-id-v1';
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
      activeView: isPersistedActiveView(parsedSession.activeView) ? parsedSession.activeView : 'opener',
      allPulledCards: parsedSession.allPulledCards ?? parsedSession.binderCards ?? [],
      binderCards: parsedSession.binderCards ?? [],
      boosterTypesBySetCode: parsedSession.boosterTypesBySetCode ?? {},
      chaseCardName: parsedSession.chaseCardName ?? '',
      isAudioMuted: parsedSession.isAudioMuted ?? !(parsedSession.isAudioEnabled ?? false),
      isAudioEnabled: parsedSession.isAudioEnabled ?? false,
      audioVolume: normalizeAudioVolume(parsedSession.audioVolume),
      isFastMode: parsedSession.isFastMode ?? false,
      isMusicEnabled: parsedSession.isMusicEnabled ?? false,
      isSfxEnabled: parsedSession.isSfxEnabled ?? parsedSession.isAudioEnabled ?? true,
      packHistory: parsedSession.packHistory ?? [],
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
  clearRemoteSessionId();
}

export function loadRemoteSessionId(): string | null {
  return window.localStorage.getItem(REMOTE_SESSION_ID_KEY);
}

export function saveRemoteSessionId(id: string) {
  window.localStorage.setItem(REMOTE_SESSION_ID_KEY, id);
}

export function clearRemoteSessionId() {
  window.localStorage.removeItem(REMOTE_SESSION_ID_KEY);
}

function isPersistedActiveView(activeView: unknown): activeView is PersistedActiveView {
  return activeView === 'opener' || activeView === 'binder' || activeView === 'history';
}

function normalizeAudioVolume(audioVolume: unknown): number {
  if (typeof audioVolume !== 'number' || Number.isNaN(audioVolume)) {
    return 0.7;
  }

  return Math.min(Math.max(audioVolume, 0), 1);
}
