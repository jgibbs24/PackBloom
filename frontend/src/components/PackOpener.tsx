import { useState } from 'react';
import { openBloomburrowPack } from '../api/packApi';
import type { OpenedPackDto } from '../types/pack';
import { CardGrid } from './CardGrid';
import { PackSummary } from './PackSummary';

export function PackOpener() {
  const [pack, setPack] = useState<OpenedPackDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenPack() {
    setIsLoading(true);
    setError(null);

    try {
      const openedPack = await openBloomburrowPack();
      setPack(openedPack);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to open pack.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="min-w-0">
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Stage 1 pack opener</h2>
            <p className="mt-1 text-sm text-stone-300">Backend to Scryfall, no database, no cache.</p>
          </div>
          <button
            className="rounded-md bg-ember px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            disabled={isLoading}
            onClick={handleOpenPack}
            type="button"
          >
            {isLoading ? 'Opening...' : 'Open BLB Pack'}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {pack ? (
          <CardGrid cards={pack.cards} />
        ) : (
          <div className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
            Your opened Bloomburrow cards will appear here.
          </div>
        )}
      </div>

      <PackSummary pack={pack} isLoading={isLoading} />
    </div>
  );
}
