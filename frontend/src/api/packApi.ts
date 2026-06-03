import type { BoosterType } from '../packLabels';
import type { OpenedPackDto, SupportedSetDto } from '../types/pack';
import { apiUrl } from './apiUrl';

const DEFAULT_REQUEST_TIMEOUT_MS = 12000;
const PACK_OPENING_TIMEOUT_MS = 90000;

export type WarmupStatusDto = {
  boosterType: BoosterType;
  loadedPools: number;
  setCode: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  totalPools: number;
};

export async function fetchApiHealth(): Promise<void> {
  const response = await fetchWithTimeout(apiUrl('/api/health'), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pack engine health check failed with status ${response.status}`);
  }
}

export async function fetchSupportedSets(): Promise<SupportedSetDto[]> {
  const response = await fetchWithTimeout(apiUrl('/api/sets'), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load supported sets with status ${response.status}`);
  }

  return response.json();
}

export async function openPack(setCode: string, boosterType: BoosterType): Promise<OpenedPackDto> {
  const searchParams = new URLSearchParams({ boosterType });

  try {
    const response = await fetchWithTimeout(apiUrl(`/api/packs/${setCode}/open?${searchParams.toString()}`), PACK_OPENING_TIMEOUT_MS, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message = typeof errorBody?.message === 'string'
        ? errorBody.message
        : `Pack opening failed with status ${response.status}`;

      throw new Error(message);
    }

    return response.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Opening this pack took too long. Please try again.');
    }
    throw error;
  }
}

export async function warmUpPack(setCode: string, boosterType: BoosterType): Promise<WarmupStatusDto> {
  const searchParams = new URLSearchParams({ boosterType });

  const response = await fetchWithTimeout(apiUrl(`/api/packs/${setCode}/warmup?${searchParams.toString()}`), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pack warmup failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchWarmupStatus(setCode: string, boosterType: BoosterType): Promise<WarmupStatusDto> {
  const searchParams = new URLSearchParams({ boosterType });

  const response = await fetchWithTimeout(apiUrl(`/api/packs/${setCode}/warmup/status?${searchParams.toString()}`), DEFAULT_REQUEST_TIMEOUT_MS, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pack warmup status failed with status ${response.status}`);
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
