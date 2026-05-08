import type { OpenedPackDto } from '../types/pack';

type PackSummaryProps = {
  pack: OpenedPackDto | null;
  isLoading: boolean;
};

export function PackSummary({ pack, isLoading }: PackSummaryProps) {
  const mythics = pack?.cards.filter((card) => card.rarity === 'mythic').length ?? 0;
  const rares = pack?.cards.filter((card) => card.rarity === 'rare').length ?? 0;

  return (
    <aside className="rounded-lg border border-ember/20 bg-stone-950/80 p-5 shadow-card lg:sticky lg:top-8">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Pack summary</p>
      <div className="mt-5 rounded-md border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm text-stone-400">Total value</p>
        <p className="mt-1 text-4xl font-bold text-white">
          {pack ? `$${pack.totalValueUsd.toFixed(2)}` : isLoading ? '...' : '$0.00'}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Set</dt>
          <dd className="mt-1 font-semibold uppercase text-white">{pack?.setCode ?? 'BLB'}</dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Cards</dt>
          <dd className="mt-1 font-semibold text-white">{pack?.cards.length ?? 15}</dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Rares</dt>
          <dd className="mt-1 font-semibold text-white">{rares}</dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Mythics</dt>
          <dd className="mt-1 font-semibold text-white">{mythics}</dd>
        </div>
      </dl>
    </aside>
  );
}
