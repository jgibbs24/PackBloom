import type { CardDto, PackHistoryEntry } from '../types/pack';

type PackHistoryPageProps = {
  entries: PackHistoryEntry[];
  onSelectCard: (card: CardDto) => void;
};

export function PackHistoryPage({ entries, onSelectCard }: PackHistoryPageProps) {
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
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Pack history</p>
        <h2 className="mt-1 text-2xl font-bold text-white">{entries.length} completed packs</h2>
      </div>

      {entries.map((entry) => {
        const bestCard = findBestCard(entry.cards);

        return (
          <article className="rounded-lg border border-white/10 bg-stone-950/70 p-4 shadow-card" key={entry.id}>
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                  Pack #{entry.packNumber} / {entry.setCode} / {entry.boosterType}
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">${entry.totalValueUsd.toFixed(2)}</h3>
                <p className="mt-1 text-sm text-stone-400">{new Date(entry.openedAt).toLocaleString()}</p>
                {entry.chaseHitCardName && (
                  <p className="mt-2 inline-flex rounded bg-emerald-400/10 px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-200">
                    Chase hit: {entry.chaseHitCardName}
                  </p>
                )}
              </div>
              {bestCard && (
                <button
                  className="rounded-md border border-ember/30 px-3 py-2 text-left text-sm transition hover:border-ember hover:bg-ember/10"
                  onClick={() => onSelectCard(bestCard)}
                  type="button"
                >
                  <span className="block text-xs font-bold uppercase tracking-[0.14em] text-ember">Best pull</span>
                  <span className="mt-1 block font-semibold text-white">{bestCard.name}</span>
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
              {entry.cards.map((card, index) => (
                <button
                  aria-label={`View ${card.name}`}
                  className="overflow-hidden rounded border border-white/10 bg-stone-900 transition hover:-translate-y-0.5 hover:border-ember focus:border-ember focus:outline-none"
                  key={`${entry.id}-${card.id}-${index}`}
                  onClick={() => onSelectCard(card)}
                  type="button"
                >
                  <img alt={card.name} className="aspect-[488/680] w-full object-cover" loading="lazy" src={card.imageUrl} />
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function findBestCard(cards: CardDto[]): CardDto | null {
  return cards.reduce<CardDto | null>((best, card) => {
    if (!best || card.priceUsd > best.priceUsd) {
      return card;
    }
    return best;
  }, null);
}
