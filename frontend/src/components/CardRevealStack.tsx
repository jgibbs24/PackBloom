import type { CardDto } from '../types/pack';

type CardRevealStackProps = {
  cards: CardDto[];
  suspenseCard?: CardDto | null;
  onSelectCard: (card: CardDto) => void;
};

const rarityGlowStyles: Record<string, string> = {
  common: 'border-stone-600 shadow-[0_0_30px_rgba(87,83,78,0.28)]',
  uncommon: 'border-slate-100 shadow-[0_0_36px_rgba(226,232,240,0.28)]',
  rare: 'border-yellow-300 shadow-[0_0_44px_rgba(253,224,71,0.38)]',
  mythic: 'border-orange-300 shadow-[0_0_52px_rgba(251,146,60,0.48)]',
};

const suspenseGlowStyles: Record<string, string> = {
  common: 'border-stone-500 shadow-[0_0_50px_rgba(120,113,108,0.36)]',
  uncommon: 'border-slate-100 shadow-[0_0_58px_rgba(226,232,240,0.42)]',
  rare: 'border-yellow-300 shadow-[0_0_68px_rgba(253,224,71,0.52)]',
  mythic: 'border-orange-300 shadow-[0_0_78px_rgba(251,146,60,0.68)]',
};

export function CardRevealStack({ cards, suspenseCard, onSelectCard }: CardRevealStackProps) {
  const currentCard = cards.length > 0 ? cards[cards.length - 1] : null;
  const stackedCards = cards.slice(Math.max(cards.length - 5, 0), -1);
  const isMythicReveal = currentCard?.rarity === 'mythic';

  return (
    <section className="relative flex min-h-[34rem] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.16),transparent_44%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-10 shadow-card">
      <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent" />
      {isMythicReveal && <div className="mythic-reveal-burst" />}
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

        {suspenseCard && (
          <div
            className={`card-suspense-back absolute z-30 flex aspect-[488/680] w-[min(76vw,22rem)] items-center justify-center rounded-xl border-2 bg-[radial-gradient(circle_at_50%_35%,rgba(244,184,96,0.28),transparent_28%),linear-gradient(145deg,#221a2f,#0f1018_58%,#050507)] p-5 ${suspenseGlowStyles[suspenseCard.rarity] ?? suspenseGlowStyles.common}`}
          >
            <div className="absolute inset-4 rounded-lg border border-white/10" />
            <div className="absolute inset-8 rounded-full border border-ember/30" />
            <div className="relative text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-ember">Rarity signal</p>
              <p className="mt-3 text-3xl font-black uppercase tracking-[0.16em] text-white">
                {suspenseCard.rarity}
              </p>
            </div>
          </div>
        )}

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
            Click Reveal next to turn over your cards.
          </div>
        )}
      </div>
    </section>
  );
}
