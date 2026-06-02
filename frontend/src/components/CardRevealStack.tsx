import type { CardDto } from '../types/pack';

type CardRevealStackProps = {
  cards: CardDto[];
  isFastMode: boolean;
  onSelectCard: (card: CardDto) => void;
  totalCards: number;
};

const rarityGlowStyles: Record<string, string> = {
  common: 'border-stone-600 shadow-[0_0_30px_rgba(87,83,78,0.28)]',
  uncommon: 'border-slate-100 shadow-[0_0_36px_rgba(226,232,240,0.28)]',
  rare: 'border-yellow-300 shadow-[0_0_44px_rgba(253,224,71,0.38)]',
  mythic: 'border-orange-300 shadow-[0_0_52px_rgba(251,146,60,0.48)]',
};

export function CardRevealStack({ cards, isFastMode, onSelectCard, totalCards }: CardRevealStackProps) {
  const currentCard = cards.length > 0 ? cards[cards.length - 1] : null;
  const stackedCards = cards.slice(Math.max(cards.length - 5, 0), -1);
  const isMythicReveal = currentCard?.rarity === 'mythic';

  return (
    <section className="relative flex min-h-[34rem] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.16),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-10 shadow-card">
      <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent" />
      {isMythicReveal && <div className="mythic-reveal-burst" />}
      <div className="absolute left-4 top-4 rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-300 backdrop-blur">
        {cards.length > 0 ? `Card ${cards.length} of ${totalCards}` : 'Ready'}
      </div>
      {isFastMode && (
        <div className="absolute right-4 top-4 rounded-md border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100 backdrop-blur">
          Fast Mode
        </div>
      )}
      <div className="relative flex h-[30rem] w-full max-w-md items-center justify-center">
        {stackedCards.map((card, index) => {
          const stackDepth = stackedCards.length - index;
          return (
            <img
              alt=""
              aria-hidden="true"
              className="absolute w-[min(72vw,20rem)] rounded-xl border border-white/10 object-cover opacity-45 shadow-card transition-all duration-300"
              key={`${card.id}-${index}`}
              src={card.imageUrl}
              style={{
                transform: `translate(${stackDepth * -8}px, ${stackDepth * 9}px) rotate(${stackDepth * -2.5}deg)`,
                zIndex: index,
              }}
            />
          );
        })}

        {currentCard ? (
          <button
            aria-label={`View ${currentCard.name}`}
            className={`group absolute z-20 w-[min(76vw,22rem)] rounded-xl border-2 bg-stone-950 p-1 transition duration-300 hover:-translate-y-1 focus:outline-none ${rarityGlowStyles[currentCard.rarity] ?? rarityGlowStyles.common}`}
            onClick={() => onSelectCard(currentCard)}
            type="button"
          >
            <img
              alt={currentCard.name}
              className="aspect-[488/680] w-full rounded-lg object-cover"
              src={currentCard.imageUrl}
            />
            <div className="absolute inset-x-4 bottom-4 rounded-md border border-white/10 bg-black/70 px-3 py-2 text-left backdrop-blur">
              <p className="line-clamp-1 text-sm font-semibold text-white">{currentCard.name}</p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold uppercase tracking-[0.16em] text-ember">{currentCard.rarity}</span>
                <span className="font-semibold text-violet-100">${currentCard.priceUsd.toFixed(2)}</span>
              </div>
            </div>
          </button>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center text-stone-400">
            Pack is ready. Reveal the first card when you are set.
          </div>
        )}
      </div>
    </section>
  );
}
