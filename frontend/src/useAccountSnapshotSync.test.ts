import { afterEach, describe, expect, it, vi } from 'vitest';
import { SnapshotSyncController } from './useAccountSnapshotSync';

type State = { value: string };

describe('SnapshotSyncController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hydrates from the canonical remote snapshot without overwriting it', async () => {
    vi.useFakeTimers();
    const applyRemote = vi.fn();
    const save = vi.fn();
    const controller = new SnapshotSyncController<State>({
      applyRemote,
      load: async () => ({ revision: 7, state: { value: 'remote' } }),
      onChange: vi.fn(),
      save,
    });

    await controller.start({ value: 'stale local' });
    expect(applyRemote).toHaveBeenCalledWith({ value: 'remote' });

    controller.update({ value: 'remote' });
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).not.toHaveBeenCalled();
  });

  it('allows one save in flight and sends only the newest successor', async () => {
    vi.useFakeTimers();
    let finishFirstSave: ((snapshot: { revision: number; state: State }) => void) | undefined;
    const save = vi.fn()
      .mockImplementationOnce((state: State) => new Promise((resolve) => {
        finishFirstSave = resolve;
      }))
      .mockResolvedValueOnce({ revision: 1, state: { value: 'newest' } });
    const controller = new SnapshotSyncController<State>({
      applyRemote: vi.fn(),
      load: async () => null,
      onChange: vi.fn(),
      save,
    });

    await controller.start({ value: 'initial' });
    await vi.advanceTimersByTimeAsync(1500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenNthCalledWith(1, { value: 'initial' }, null);

    controller.update({ value: 'intermediate' });
    controller.update({ value: 'newest' });
    await vi.advanceTimersByTimeAsync(3000);
    expect(save).toHaveBeenCalledTimes(1);

    finishFirstSave?.({ revision: 0, state: { value: 'initial' } });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(1500);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenNthCalledWith(2, { value: 'newest' }, 0);
  });

  it('never saves after hydration fails', async () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const views: string[] = [];
    const controller = new SnapshotSyncController<State>({
      applyRemote: vi.fn(),
      load: async () => {
        throw new Error('load failed');
      },
      onChange: (view) => views.push(view.status),
      save,
    });

    await controller.start({ value: 'local' });
    controller.update({ value: 'changed' });
    await vi.advanceTimersByTimeAsync(3000);

    expect(views).toEqual(['loading', 'error']);
    expect(save).not.toHaveBeenCalled();
  });
});
