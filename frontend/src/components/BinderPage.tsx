import type { CardDto } from '../types/pack';

type BinderPageProps = {
  cards: CardDto[];
  onSelectCard: (card: CardDto) => void;
};

export function BinderPage({ cards, onSelectCard }: BinderPageProps) {
  if (cards.length === 0) {
    return (
      <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
        Your session binder will collect your best pulls after completed packs.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5 shadow-card">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Session binder</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Best pulls</h2>
        </div>
        <p className="text-sm text-stone-400">Top {cards.length} cards by estimated value</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((card, index) => (
          <button
            aria-label={`View ${card.name}`}
            className="group overflow-hidden rounded-lg border border-white/10 bg-stone-950/70 text-left shadow-card transition hover:-translate-y-1 hover:border-ember focus:border-ember focus:outline-none"
            key={card.id}
            onClick={() => onSelectCard(card)}
            type="button"
          >
            <div className="relative aspect-[488/680] overflow-hidden bg-stone-900">
              <img
                alt={card.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                src={card.imageUrl}
              />
              <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-ember">
                #{index + 1}
              </span>
            </div>
            <div className="space-y-2 p-3">
              <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">{card.name}</h3>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-[0.16em] text-stone-300">{card.rarity}</span>
                <span className="rounded bg-amethyst/20 px-2 py-1 font-semibold text-violet-100">
                  ${card.priceUsd.toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
