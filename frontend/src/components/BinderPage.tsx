import { useMemo, useState } from 'react';
import { formatCardPrice } from '../cardPrice';
import type { CardDto, PackHistoryEntry } from '../types/pack';

type BinderPageProps = {
  cards: CardDto[];
  packHistory: PackHistoryEntry[];
  onSelectCard: (card: CardDto) => void;
};

type BinderSort = 'value' | 'pull-order' | 'rarity' | 'name' | 'set';

type BinderRecord = {
  boosterType: string;
  card: CardDto;
  openedAt: string;
  packNumber: number;
  pullOrder: number;
  setCode: string;
};

type BinderEntry = {
  bestCopy: BinderRecord;
  firstPulled: BinderRecord;
  quantity: number;
  totalValue: number;
};

const rarityRank: Record<string, number> = {
  mythic: 4,
  rare: 3,
  uncommon: 2,
  common: 1,
};

export function BinderPage({ cards, packHistory, onSelectCard }: BinderPageProps) {
  const [selectedSetCode, setSelectedSetCode] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [selectedBoosterType, setSelectedBoosterType] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<BinderSort>('value');

  const records = useMemo(() => createBinderRecords(cards, packHistory), [cards, packHistory]);
  const binderEntries = useMemo(() => summarizeBinder(records), [records]);
  const bestPulls = useMemo(
    () => [...records]
      .sort((left, right) => right.card.priceUsd - left.card.priceUsd || left.card.name.localeCompare(right.card.name))
      .slice(0, 20),
    [records],
  );

  const setOptions = useMemo(
    () => [...new Set(records.map((record) => record.setCode))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    [records],
  );
  const boosterOptions = useMemo(
    () => [...new Set(records.map((record) => record.boosterType))]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right)),
    [records],
  );

  const filteredEntries = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const minimumValue = Number.parseFloat(minValue);

    return binderEntries
      .filter((entry) => selectedSetCode === 'all' || entry.bestCopy.setCode === selectedSetCode)
      .filter((entry) => selectedRarity === 'all' || entry.bestCopy.card.rarity === selectedRarity)
      .filter((entry) => selectedBoosterType === 'all' || entry.bestCopy.boosterType === selectedBoosterType)
      .filter((entry) => Number.isNaN(minimumValue) || entry.bestCopy.card.priceUsd >= minimumValue)
      .filter((entry) => !normalizedSearch || entry.bestCopy.card.name.toLowerCase().includes(normalizedSearch))
      .sort((left, right) => compareBinderEntries(left, right, sortBy));
  }, [binderEntries, minValue, searchTerm, selectedBoosterType, selectedRarity, selectedSetCode, sortBy]);

  if (binderEntries.length === 0) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
        Your session binder will collect every completed pull, including duplicates.
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Session binder</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Best Pulls Gallery</h2>
          </div>
          <p className="text-sm text-stone-400">
            Top {bestPulls.length} of {records.length} cards
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {bestPulls.map((record, index) => (
            <button
              aria-label={`View ${record.card.name}`}
              className="group overflow-hidden rounded-lg border border-white/10 bg-stone-950/70 text-left transition hover:-translate-y-1 hover:border-ember focus:border-ember focus:outline-none"
              key={`${record.card.id}-${record.pullOrder}`}
              onClick={() => onSelectCard(record.card)}
              type="button"
            >
              <div className="relative aspect-[488/680] overflow-hidden bg-stone-900">
                <img
                  alt={record.card.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                  src={record.card.imageUrl}
                />
                <span className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-xs font-black text-ember">
                  #{index + 1}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">{record.card.name}</p>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold uppercase tracking-[0.12em] text-stone-400">{record.setCode}</span>
                  <span className="font-bold text-violet-100">{formatCardPrice(record.card)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Full binder</p>
            <h2 className="mt-1 text-2xl font-bold text-white">All Pulls</h2>
          </div>
          <p className="text-sm text-stone-400">
            {filteredEntries.length} shown, {binderEntries.length} unique, {records.length} total
          </p>
        </div>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))]">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="binder-search">
            Search
            <input
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
              id="binder-search"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Card name"
              type="search"
              value={searchTerm}
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="binder-set-filter">
            Set
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="binder-set-filter"
              onChange={(event) => setSelectedSetCode(event.target.value)}
              value={selectedSetCode}
            >
              <option value="all">All sets</option>
              {setOptions.map((setCode) => (
                <option key={setCode} value={setCode}>{setCode.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="binder-rarity-filter">
            Rarity
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="binder-rarity-filter"
              onChange={(event) => setSelectedRarity(event.target.value)}
              value={selectedRarity}
            >
              <option value="all">All rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="mythic">Mythic</option>
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="binder-booster-filter">
            Booster
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="binder-booster-filter"
              onChange={(event) => setSelectedBoosterType(event.target.value)}
              value={selectedBoosterType}
            >
              <option value="all">All boosters</option>
              {boosterOptions.map((boosterType) => (
                <option key={boosterType} value={boosterType}>{formatBoosterType(boosterType)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="binder-min-value-filter">
            Min value
            <input
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
              id="binder-min-value-filter"
              min="0"
              onChange={(event) => setMinValue(event.target.value)}
              placeholder="$0"
              step="0.25"
              type="number"
              value={minValue}
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500" htmlFor="binder-sort">
            Sort
            <select
              className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
              id="binder-sort"
              onChange={(event) => setSortBy(event.target.value as BinderSort)}
              value={sortBy}
            >
              <option value="value">Value</option>
              <option value="pull-order">Pull order</option>
              <option value="rarity">Rarity</option>
              <option value="name">Name</option>
              <option value="set">Set</option>
            </select>
          </label>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="flex min-h-[14rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
            No pulls match those filters.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredEntries.map((entry) => (
              <button
                aria-label={`View ${entry.bestCopy.card.name}`}
                className="group overflow-hidden rounded-lg border border-white/10 bg-stone-950/70 text-left shadow-card transition hover:-translate-y-1 hover:border-ember focus:border-ember focus:outline-none"
                key={entry.bestCopy.card.id}
                onClick={() => onSelectCard(entry.bestCopy.card)}
                type="button"
              >
                <div className="relative aspect-[488/680] overflow-hidden bg-stone-900">
                  <img
                    alt={entry.bestCopy.card.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                    src={entry.bestCopy.card.imageUrl}
                  />
                  <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-bold uppercase text-ember">
                    {entry.bestCopy.setCode}
                  </span>
                  {entry.quantity > 1 && (
                    <span className="absolute right-2 top-2 rounded bg-emerald-400 px-2 py-1 text-xs font-black text-stone-950">
                      x{entry.quantity}
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">
                    {entry.bestCopy.card.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold uppercase tracking-[0.16em] text-stone-300">{entry.bestCopy.card.rarity}</span>
                    <span className="rounded bg-amethyst/20 px-2 py-1 font-semibold text-violet-100">
                      {formatCardPrice(entry.bestCopy.card)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-stone-500">
                    <span>{formatBoosterType(entry.bestCopy.boosterType)}</span>
                    <span className="text-right">${entry.totalValue.toFixed(2)} total</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function createBinderRecords(cards: CardDto[], packHistory: PackHistoryEntry[]): BinderRecord[] {
  if (packHistory.length === 0) {
    return cards.map((card, index) => ({
      boosterType: 'unknown',
      card,
      openedAt: '',
      packNumber: 0,
      pullOrder: index,
      setCode: 'unknown',
    }));
  }

  return [...packHistory]
    .sort((left, right) => left.packNumber - right.packNumber)
    .flatMap((entry) => entry.cards.map((card, index) => ({
      boosterType: entry.boosterType,
      card,
      openedAt: entry.openedAt,
      packNumber: entry.packNumber,
      pullOrder: entry.packNumber * 100 + index,
      setCode: entry.setCode,
    })));
}

function summarizeBinder(records: BinderRecord[]): BinderEntry[] {
  const entriesByCardId = new Map<string, BinderEntry>();

  for (const record of records) {
    const existingEntry = entriesByCardId.get(record.card.id);
    if (!existingEntry) {
      entriesByCardId.set(record.card.id, {
        bestCopy: record,
        firstPulled: record,
        quantity: 1,
        totalValue: record.card.priceUsd,
      });
      continue;
    }

    entriesByCardId.set(record.card.id, {
      bestCopy: record.card.priceUsd > existingEntry.bestCopy.card.priceUsd ? record : existingEntry.bestCopy,
      firstPulled: record.pullOrder < existingEntry.firstPulled.pullOrder ? record : existingEntry.firstPulled,
      quantity: existingEntry.quantity + 1,
      totalValue: existingEntry.totalValue + record.card.priceUsd,
    });
  }

  return Array.from(entriesByCardId.values());
}

function compareBinderEntries(left: BinderEntry, right: BinderEntry, sortBy: BinderSort): number {
  if (sortBy === 'pull-order') {
    return right.firstPulled.pullOrder - left.firstPulled.pullOrder;
  }

  if (sortBy === 'rarity') {
    return (rarityRank[right.bestCopy.card.rarity] ?? 0) - (rarityRank[left.bestCopy.card.rarity] ?? 0)
      || right.bestCopy.card.priceUsd - left.bestCopy.card.priceUsd
      || left.bestCopy.card.name.localeCompare(right.bestCopy.card.name);
  }

  if (sortBy === 'name') {
    return left.bestCopy.card.name.localeCompare(right.bestCopy.card.name);
  }

  if (sortBy === 'set') {
    return left.bestCopy.setCode.localeCompare(right.bestCopy.setCode)
      || left.bestCopy.card.name.localeCompare(right.bestCopy.card.name);
  }

  return right.bestCopy.card.priceUsd - left.bestCopy.card.priceUsd
    || left.bestCopy.card.name.localeCompare(right.bestCopy.card.name);
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
