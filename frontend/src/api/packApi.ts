import type { OpenedPackDto } from '../types/pack';

export async function openBloomburrowPack(): Promise<OpenedPackDto> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('/api/packs/blb/open', {
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
