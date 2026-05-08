import type { SessionStats } from '../types/pack';
import { AnimatedCurrency } from './AnimatedCurrency';

type SessionStatsPanelProps = {
  stats: SessionStats;
};

export function SessionStatsPanel({ stats }: SessionStatsPanelProps) {
  const isProfitable = stats.netProfitLoss >= 0;
  const netPrefix = isProfitable ? '+' : '-';
  const netValue = Math.abs(stats.netProfitLoss);

  return (
    <section className="rounded-lg border border-white/10 bg-stone-950/70 p-5 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Session stats</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Packs opened</dt>
          <dd className="mt-1 font-semibold text-white">{stats.packsOpened}</dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Total value</dt>
          <dd className="mt-1 font-semibold text-white">
            <AnimatedCurrency value={stats.totalEstimatedValue} />
          </dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Net profit/loss</dt>
          <dd className={`mt-1 font-semibold ${isProfitable ? 'text-emerald-300' : 'text-red-300'}`}>
            <AnimatedCurrency prefix={`${netPrefix}$`} value={netValue} />
          </dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Average pack</dt>
          <dd className="mt-1 font-semibold text-white">
            <AnimatedCurrency value={stats.averagePackValue} />
          </dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Best pack</dt>
          <dd className="mt-1 font-semibold text-white">
            <AnimatedCurrency value={stats.bestPackValue} />
          </dd>
        </div>
        <div className="rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Mythics</dt>
          <dd className="mt-1 font-semibold text-white">{stats.mythicsPulled}</dd>
        </div>
        <div className="col-span-2 rounded-md bg-white/[0.04] p-3">
          <dt className="text-stone-400">Best card</dt>
          <dd className="mt-3">
            {stats.bestCard ? (
              <div className="flex items-center gap-3">
                <img
                  alt={stats.bestCard.name}
                  className="h-20 w-14 rounded border border-white/10 object-cover"
                  src={stats.bestCard.imageUrl}
                />
                <div className="min-w-0">
                  <p className="line-clamp-2 font-semibold text-white">{stats.bestCard.name}</p>
                  <p className="mt-1 font-semibold text-ember">${stats.bestCard.priceUsd.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <span className="font-semibold text-white">None yet</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
