import type { CardDto } from '../types/pack';

type CardTileProps = {
  card: CardDto;
};

const rarityStyles: Record<string, string> = {
  common: 'text-stone-300',
  uncommon: 'text-slate-200',
  rare: 'text-ember',
  mythic: 'text-orange-300',
};

export function CardTile({ card }: CardTileProps) {
  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-stone-950/70 shadow-card transition duration-200 hover:-translate-y-1 hover:border-ember/60">
      <div className="aspect-[488/680] overflow-hidden bg-stone-900">
        <img
          alt={card.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          src={card.imageUrl}
        />
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-white">{card.name}</h3>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={`font-bold uppercase tracking-[0.16em] ${rarityStyles[card.rarity] ?? 'text-stone-300'}`}>
            {card.rarity}
          </span>
          <span className="rounded bg-amethyst/20 px-2 py-1 font-semibold text-violet-100">
            ${card.priceUsd.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
}
