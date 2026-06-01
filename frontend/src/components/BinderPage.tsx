import type { CardDto } from '../types/pack';

type BinderPageProps = {
  cards: CardDto[];
  onSelectCard: (card: CardDto) => void;
};

type BinderEntry = {
  bestCopy: CardDto;
  quantity: number;
};

export function BinderPage({ cards, onSelectCard }: BinderPageProps) {
  const binderEntries = summarizeBinder(cards);
  const totalCards = cards.length;

  if (binderEntries.length === 0) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
        Your session binder will collect every completed pull, including duplicates.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Session binder</p>
          <h2 className="mt-1 text-2xl font-bold text-white">All Pulls</h2>
        </div>
        <p className="text-sm text-stone-400">
          {totalCards} cards, {binderEntries.length} unique
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {binderEntries.map((entry, index) => (
          <button
            aria-label={`View ${entry.bestCopy.name}`}
            className="group overflow-hidden rounded-lg border border-white/10 bg-stone-950/70 text-left shadow-card transition hover:-translate-y-1 hover:border-ember focus:border-ember focus:outline-none"
            key={entry.bestCopy.id}
            onClick={() => onSelectCard(entry.bestCopy)}
            type="button"
          >
            <div className="relative aspect-[488/680] overflow-hidden bg-stone-900">
              <img
                alt={entry.bestCopy.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                src={entry.bestCopy.imageUrl}
              />
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-ember">
                #{index + 1}
              </span>
              {entry.quantity > 1 && (
                <span className="absolute right-2 top-2 rounded bg-emerald-400 px-2 py-1 text-xs font-black text-stone-950">
                  x{entry.quantity}
                </span>
              )}
            </div>
            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">
                {entry.bestCopy.name}
              </h3>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-[0.16em] text-stone-300">{entry.bestCopy.rarity}</span>
                <span className="rounded bg-amethyst/20 px-2 py-1 font-semibold text-violet-100">
                  ${entry.bestCopy.priceUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function summarizeBinder(cards: CardDto[]): BinderEntry[] {
  const entriesByCardId = new Map<string, BinderEntry>();

  for (const card of cards) {
    const existingEntry = entriesByCardId.get(card.id);
    if (!existingEntry) {
      entriesByCardId.set(card.id, { bestCopy: card, quantity: 1 });
      continue;
    }

    entriesByCardId.set(card.id, {
      bestCopy: card.priceUsd > existingEntry.bestCopy.priceUsd ? card : existingEntry.bestCopy,
      quantity: existingEntry.quantity + 1,
    });
  }

  return Array.from(entriesByCardId.values()).sort((left, right) => {
    if (right.bestCopy.priceUsd !== left.bestCopy.priceUsd) {
      return right.bestCopy.priceUsd - left.bestCopy.priceUsd;
    }
    return left.bestCopy.name.localeCompare(right.bestCopy.name);
  });
}
