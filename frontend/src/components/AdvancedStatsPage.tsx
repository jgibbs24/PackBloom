import type { PackHistoryEntry, SessionStats } from '../types/pack';

type AdvancedStatsPageProps = {
  entries: PackHistoryEntry[];
  stats: SessionStats;
};

export function AdvancedStatsPage({ entries, stats }: AdvancedStatsPageProps) {
  if (entries.length === 0) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
        Advanced stats will appear after you complete your first pack.
      </section>
    );
  }

  const chronologicalEntries = [...entries].sort((left, right) => left.packNumber - right.packNumber);
  const mythicCount = entries.reduce(
    (count, entry) => count + entry.cards.filter((card) => card.rarity === 'mythic').length,
    0,
  );
  const mythicRate = entries.length > 0 ? mythicCount / entries.length : 0;
  const setAverages = averageBy(entries, (entry) => entry.setCode);
  const boosterAverages = averageBy(entries, (entry) => entry.boosterType);
  const maxProfitMagnitude = Math.max(
    1,
    ...chronologicalEntries.map((entry) => Math.abs(runningProfitAt(chronologicalEntries, entry.packNumber, stats.totalSpent / stats.packsOpened))),
  );
  const packMsrp = stats.packsOpened > 0 ? stats.totalSpent / stats.packsOpened : 0;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Advanced stats</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Session Trends</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <StatCard label="Mythic rate" value={`${(mythicRate * 100).toFixed(1)}%`} />
          <StatCard label="Average pack" value={`$${stats.averagePackValue.toFixed(2)}`} />
          <StatCard label="Net profit/loss" value={formatSignedCurrency(stats.netProfitLoss)} />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Profit/loss</p>
            <h3 className="mt-1 text-xl font-bold text-white">Over Time</h3>
          </div>
          <p className="text-sm font-semibold text-stone-400">{entries.length} packs</p>
        </div>
        <div className="flex h-44 items-end gap-2 border-b border-white/10">
          {chronologicalEntries.map((entry) => {
            const runningProfit = runningProfitAt(chronologicalEntries, entry.packNumber, packMsrp);
            const height = Math.max(8, Math.min(100, Math.abs(runningProfit / maxProfitMagnitude) * 100));
            return (
              <div className="flex flex-1 flex-col items-center justify-end gap-2" key={entry.id}>
                <span className="text-[0.65rem] font-semibold text-stone-500">{formatSignedCurrency(runningProfit)}</span>
                <div
                  className={`w-full max-w-8 rounded-t ${runningProfit >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}
                  style={{ height: `${height}%` }}
                  title={`Pack ${entry.packNumber}: ${formatSignedCurrency(runningProfit)}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AverageTable entries={setAverages} title="Average Value By Set" />
        <AverageTable entries={boosterAverages} title="Average Value By Booster" />
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-stone-950/70 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function AverageTable({ entries, title }: { entries: Array<{ average: number; key: string; packs: number }>; title: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <div className="flex items-center justify-between gap-3 rounded-md bg-black/20 p-3" key={entry.key}>
            <div>
              <p className="font-bold uppercase tracking-[0.14em] text-stone-200">{entry.key}</p>
              <p className="text-xs text-stone-500">{entry.packs} packs</p>
            </div>
            <p className="font-bold text-violet-100">${entry.average.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function averageBy(entries: PackHistoryEntry[], getKey: (entry: PackHistoryEntry) => string) {
  const groups = new Map<string, { packs: number; total: number }>();

  for (const entry of entries) {
    const key = getKey(entry);
    const existingGroup = groups.get(key) ?? { packs: 0, total: 0 };
    groups.set(key, {
      packs: existingGroup.packs + 1,
      total: existingGroup.total + entry.totalValueUsd,
    });
  }

  return Array.from(groups.entries())
    .map(([key, group]) => ({
      average: group.total / group.packs,
      key,
      packs: group.packs,
    }))
    .sort((left, right) => right.average - left.average);
}

function runningProfitAt(entries: PackHistoryEntry[], packNumber: number, packMsrp: number): number {
  const entriesToPack = entries.filter((entry) => entry.packNumber <= packNumber);
  const totalValue = entriesToPack.reduce((sum, entry) => sum + entry.totalValueUsd, 0);
  return totalValue - entriesToPack.length * packMsrp;
}

function formatSignedCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}
