import { useEffect, useMemo, useState } from 'react';
import type { CardDto, PackHistoryEntry } from '../types/pack';

type PackHistoryPageProps = {
  entries: PackHistoryEntry[];
  onSelectCard: (card: CardDto) => void;
};

type HistorySort = 'newest' | 'oldest' | 'value' | 'pack-number';

export function PackHistoryPage({ entries, onSelectCard }: PackHistoryPageProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(entries[0]?.id ?? null);
  const [selectedSetCode, setSelectedSetCode] = useState('all');
  const [selectedBoosterType, setSelectedBoosterType] = useState('all');
  const [chaseFilter, setChaseFilter] = useState('all');
  const [sortBy, setSortBy] = useState<HistorySort>('newest');

  const setOptions = useMemo(
    () => [...new Set(entries.map((entry) => entry.setCode))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    [entries],
  );
  const boosterOptions = useMemo(
    () => [...new Set(entries.map((entry) => entry.boosterType))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    [entries],
  );

  const filteredEntries = useMemo(() => entries
    .filter((entry) => selectedSetCode === 'all' || entry.setCode === selectedSetCode)
    .filter((entry) => selectedBoosterType === 'all' || entry.boosterType === selectedBoosterType)
    .filter((entry) => {
      if (chaseFilter === 'hits') {
        return Boolean(entry.chaseHitCardName);
      }
      if (chaseFilter === 'misses') {
        return !entry.chaseHitCardName;
      }
      return true;
    })
    .sort((left, right) => compareHistoryEntries(left, right, sortBy)), [
    chaseFilter,
    entries,
    selectedBoosterType,
    selectedSetCode,
    sortBy,
  ]);

  useEffect(() => {
    if (filteredEntries.length === 0) {
      setExpandedEntryId(null);
      return;
    }

    if (!expandedEntryId || !filteredEntries.some((entry) => entry.id === expandedEntryId)) {
      setExpandedEntryId(filteredEntries[0].id);
    }
  }, [expandedEntryId, filteredEntries]);

  if (entries.length === 0) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
        Pack history will appear after you complete your first pack.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Pack history</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{entries.length} completed packs</h2>
          </div>
          <p className="text-sm text-stone-400">
            {filteredEntries.length} shown
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="history-set-filter">
            Set
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="history-set-filter"
              onChange={(event) => setSelectedSetCode(event.target.value)}
              value={selectedSetCode}
            >
              <option value="all">All sets</option>
              {setOptions.map((setCode) => (
                <option key={setCode} value={setCode}>{setCode.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="history-booster-filter">
            Booster
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="history-booster-filter"
              onChange={(event) => setSelectedBoosterType(event.target.value)}
              value={selectedBoosterType}
            >
              <option value="all">All boosters</option>
              {boosterOptions.map((boosterType) => (
                <option key={boosterType} value={boosterType}>{formatBoosterType(boosterType)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="history-chase-filter">
            Chase
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="history-chase-filter"
              onChange={(event) => setChaseFilter(event.target.value)}
              value={chaseFilter}
            >
              <option value="all">All packs</option>
              <option value="hits">Chase hits</option>
              <option value="misses">No chase hit</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="history-sort">
            Sort
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="history-sort"
              onChange={(event) => setSortBy(event.target.value as HistorySort)}
              value={sortBy}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="value">Highest value</option>
              <option value="pack-number">Pack number</option>
            </select>
          </label>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
          No packs match those filters.
        </div>
      ) : (
        filteredEntries.map((entry) => {
          const bestCard = findBestCard(entry.cards);
          const isExpanded = expandedEntryId === entry.id;
          const rarityCounts = countRarities(entry.cards);

          return (
            <article className="rounded-lg border border-white/10 bg-stone-950/70 shadow-card" key={entry.id}>
              <button
                className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-white/[0.03] focus:outline-none sm:flex-row sm:items-start sm:justify-between"
                onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                    Pack #{entry.packNumber} / {entry.setCode} / {formatBoosterType(entry.boosterType)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black text-white">${entry.totalValueUsd.toFixed(2)}</h3>
                    {entry.chaseHitCardName && (
                      <span className="rounded bg-emerald-400/10 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-200">
                        Chase hit
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-stone-400">{new Date(entry.openedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.12em] text-stone-300 sm:justify-end">
                  <span className="rounded bg-white/[0.06] px-2 py-1">{entry.cards.length} cards</span>
                  <span className="rounded bg-white/[0.06] px-2 py-1">{rarityCounts.rare} rare</span>
                  <span className="rounded bg-white/[0.06] px-2 py-1">{rarityCounts.mythic} mythic</span>
                  <span className="rounded border border-ember/30 px-2 py-1 text-ember">
                    {isExpanded ? 'Hide details' : 'View details'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-white/10 p-4">
                  <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
                    <div className="rounded-md bg-black/20 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Best pull</p>
                      {bestCard ? (
                        <button
                          className="mt-2 text-left transition hover:text-ember"
                          onClick={() => onSelectCard(bestCard)}
                          type="button"
                        >
                          <span className="block text-lg font-bold text-white">{bestCard.name}</span>
                          <span className="text-sm font-semibold text-violet-100">${bestCard.priceUsd.toFixed(2)}</span>
                        </button>
                      ) : (
                        <p className="mt-2 text-sm text-stone-400">No cards found.</p>
                      )}
                    </div>
                    <div className="rounded-md bg-black/20 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Rarity mix</p>
                      <p className="mt-2 text-sm font-semibold text-stone-300">
                        {rarityCounts.common} common / {rarityCounts.uncommon} uncommon / {rarityCounts.rare} rare / {rarityCounts.mythic} mythic
                      </p>
                      {entry.chaseHitCardName && (
                        <p className="mt-2 text-sm font-semibold text-emerald-100">Chase: {entry.chaseHitCardName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {entry.cards.map((card, index) => (
                      <button
                        aria-label={`View ${card.name}`}
                        className="group overflow-hidden rounded-lg border border-white/10 bg-stone-900 text-left transition hover:-translate-y-0.5 hover:border-ember focus:border-ember focus:outline-none"
                        key={`${entry.id}-${card.id}-${index}`}
                        onClick={() => onSelectCard(card)}
                        type="button"
                      >
                        <img alt={card.name} className="aspect-[488/680] w-full object-cover" loading="lazy" src={card.imageUrl} />
                        <div className="space-y-1 p-2">
                          <p className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-white">{card.name}</p>
                          <div className="flex items-center justify-between gap-2 text-[0.68rem]">
                            <span className="font-bold uppercase tracking-[0.12em] text-stone-400">{card.rarity}</span>
                            <span className="font-semibold text-violet-100">${card.priceUsd.toFixed(2)}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </section>
  );
}

function compareHistoryEntries(left: PackHistoryEntry, right: PackHistoryEntry, sortBy: HistorySort): number {
  if (sortBy === 'oldest') {
    return new Date(left.openedAt).getTime() - new Date(right.openedAt).getTime();
  }

  if (sortBy === 'value') {
    return right.totalValueUsd - left.totalValueUsd;
  }

  if (sortBy === 'pack-number') {
    return right.packNumber - left.packNumber;
  }

  return new Date(right.openedAt).getTime() - new Date(left.openedAt).getTime();
}

function countRarities(cards: CardDto[]) {
  return cards.reduce(
    (counts, card) => ({
      common: counts.common + (card.rarity === 'common' ? 1 : 0),
      mythic: counts.mythic + (card.rarity === 'mythic' ? 1 : 0),
      rare: counts.rare + (card.rarity === 'rare' ? 1 : 0),
      uncommon: counts.uncommon + (card.rarity === 'uncommon' ? 1 : 0),
    }),
    { common: 0, mythic: 0, rare: 0, uncommon: 0 },
  );
}

function formatBoosterType(boosterType: string): string {
  if (boosterType === 'collector') {
    return 'Collector';
  }

  if (boosterType === 'play') {
    return 'Play';
  }

  return boosterType;
}

function findBestCard(cards: CardDto[]): CardDto | null {
  return cards.reduce<CardDto | null>((best, card) => {
    if (!best || card.priceUsd > best.priceUsd) {
      return card;
    }
    return best;
  }, null);
}
