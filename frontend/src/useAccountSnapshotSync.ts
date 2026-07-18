import { useEffect, useRef, useState } from 'react';

export type SnapshotSyncStatus = 'idle' | 'loading' | 'syncing' | 'saved' | 'error';

export type RemoteSnapshot<T> = {
  revision: number;
  state: T;
};

type SnapshotSyncControllerOptions<T> = {
  applyRemote: (state: T) => void;
  debounceMs?: number;
  load: () => Promise<RemoteSnapshot<T> | null>;
  onChange: (state: SnapshotSyncView) => void;
  save: (state: T, expectedRevision: number | null) => Promise<RemoteSnapshot<T>>;
  serialize?: (state: T) => string;
};

export type SnapshotSyncView = {
  error: string | null;
  isHydrated: boolean;
  status: SnapshotSyncStatus;
};

export class SnapshotSyncController<T> {
  private readonly applyRemote: (state: T) => void;
  private readonly debounceMs: number;
  private readonly loadSnapshot: () => Promise<RemoteSnapshot<T> | null>;
  private readonly onChange: (state: SnapshotSyncView) => void;
  private readonly saveSnapshot: (state: T, expectedRevision: number | null) => Promise<RemoteSnapshot<T>>;
  private readonly serialize: (state: T) => string;
  private acknowledged: string | null = null;
  private applyingRemote = false;
  private blocked: string | null = null;
  private disposed = false;
  private hydrated = false;
  private inFlight = false;
  private latest: T | null = null;
  private revision: number | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SnapshotSyncControllerOptions<T>) {
    this.applyRemote = options.applyRemote;
    this.debounceMs = options.debounceMs ?? 1500;
    this.loadSnapshot = options.load;
    this.onChange = options.onChange;
    this.saveSnapshot = options.save;
    this.serialize = options.serialize ?? JSON.stringify;
  }

  async start(initial: T): Promise<void> {
    this.latest = initial;
    this.publish('loading', null);
    try {
      const remote = await this.loadSnapshot();
      if (this.disposed) return;

      this.hydrated = true;
      if (remote) {
        this.revision = remote.revision;
        this.acknowledged = this.serialize(remote.state);
        this.applyingRemote = true;
        this.applyRemote(remote.state);
        this.publish('saved', null);
      } else {
        this.publish('idle', null);
        this.schedule();
      }
    } catch (error) {
      if (!this.disposed) {
        this.publish('error', errorMessage(error, 'Unable to load your account save.'));
      }
    }
  }

  update(state: T): void {
    this.latest = state;
    if (!this.hydrated || this.disposed) return;

    const serialized = this.serialize(state);
    if (this.applyingRemote) {
      if (serialized === this.acknowledged) this.applyingRemote = false;
      return;
    }
    if (serialized === this.acknowledged || serialized === this.blocked) return;
    this.schedule();
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
  }

  private schedule(): void {
    if (this.inFlight || this.disposed || !this.latest) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.debounceMs);
  }

  private async flush(): Promise<void> {
    if (this.inFlight || this.disposed || !this.latest) return;
    const state = this.latest;
    const serialized = this.serialize(state);
    if (serialized === this.acknowledged || serialized === this.blocked) return;

    this.inFlight = true;
    this.publish('syncing', null);
    try {
      const saved = await this.saveSnapshot(state, this.revision);
      if (this.disposed) return;
      this.revision = saved.revision;
      this.acknowledged = serialized;
      this.blocked = null;
      this.publish('saved', null);
    } catch (error) {
      if (!this.disposed) {
        this.blocked = serialized;
        this.publish('error', errorMessage(error, 'Unable to save your account state.'));
      }
    } finally {
      this.inFlight = false;
      if (!this.disposed && this.latest && this.serialize(this.latest) !== serialized) {
        this.schedule();
      }
    }
  }

  private publish(status: SnapshotSyncStatus, error: string | null): void {
    this.onChange({ error, isHydrated: this.hydrated, status });
  }
}

type UseAccountSnapshotSyncOptions<T> = {
  accountId: string | null;
  applyRemote: (state: T) => void;
  load: () => Promise<RemoteSnapshot<T> | null>;
  payload: T;
  save: (state: T, expectedRevision: number | null) => Promise<RemoteSnapshot<T>>;
};

export function useAccountSnapshotSync<T>(options: UseAccountSnapshotSyncOptions<T>): SnapshotSyncView {
  const [view, setView] = useState<SnapshotSyncView>({
    error: null,
    isHydrated: options.accountId === null,
    status: 'idle',
  });
  const callbacks = useRef(options);
  callbacks.current = options;
  const controller = useRef<SnapshotSyncController<T> | null>(null);

  useEffect(() => {
    if (options.accountId === null) {
      controller.current = null;
      setView({ error: null, isHydrated: true, status: 'idle' });
      return;
    }

    const nextController = new SnapshotSyncController<T>({
      applyRemote: (state) => callbacks.current.applyRemote(state),
      load: () => callbacks.current.load(),
      onChange: setView,
      save: (state, revision) => callbacks.current.save(state, revision),
    });
    controller.current = nextController;
    void nextController.start(callbacks.current.payload);
    return () => nextController.dispose();
  }, [options.accountId]);

  useEffect(() => {
    controller.current?.update(options.payload);
  }, [options.payload]);

  return view;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
