import { afterEach, describe, expect, it, vi } from 'vitest';
import { openPack } from './packApi';

describe('openPack', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns opened pack data from the API', async () => {
    const packResponse = {
      cards: [],
      setCode: 'blb',
      totalValueUsd: 0,
    };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, packResponse));
    vi.stubGlobal('fetch', fetchMock);

    await expect(openPack('blb', 'play')).resolves.toEqual(packResponse);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retries transient Scryfall-backed pack failures', async () => {
    vi.useFakeTimers();
    const packResponse = {
      cards: [],
      setCode: 'otj',
      totalValueUsd: 0,
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(503, { message: 'Scryfall is temporarily unavailable.' }))
      .mockResolvedValueOnce(jsonResponse(200, packResponse));
    vi.stubGlobal('fetch', fetchMock);

    const packPromise = openPack('otj', 'collector');
    await vi.advanceTimersByTimeAsync(1200);

    await expect(packPromise).resolves.toEqual(packResponse);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient pack failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(400, { message: 'Unsupported pack definition.' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(openPack('zzz', 'play')).rejects.toThrow('Unsupported pack definition.');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}
