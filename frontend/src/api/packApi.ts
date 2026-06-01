import type { BoosterType } from '../packLabels';
import type { OpenedPackDto, SupportedSetDto } from '../types/pack';
import { apiUrl } from './apiUrl';

export async function fetchSupportedSets(): Promise<SupportedSetDto[]> {
  const response = await fetch(apiUrl('/api/sets'), {
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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);
  const searchParams = new URLSearchParams({ boosterType });

  try {
    const response = await fetch(apiUrl(`/api/packs/${setCode}/open?${searchParams.toString()}`), {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
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
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function warmUpPack(setCode: string, boosterType: BoosterType): Promise<void> {
  const searchParams = new URLSearchParams({ boosterType });

  const response = await fetch(apiUrl(`/api/packs/${setCode}/warmup?${searchParams.toString()}`), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Pack warmup failed with status ${response.status}`);
  }
}
