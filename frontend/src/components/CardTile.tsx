import { formatCardPrice } from '../cardPrice';
import type { CardDto } from '../types/pack';

type CardTileProps = {
  card: CardDto;
  onSelect: (card: CardDto) => void;
};

const rarityStyles: Record<string, string> = {
  common: 'text-stone-300',
  uncommon: 'text-slate-200',
  rare: 'text-ember',
  mythic: 'text-orange-300',
};

const rarityBorderStyles: Record<string, string> = {
  common: 'hover:border-stone-600',
  uncommon: 'hover:border-slate-100 hover:shadow-[0_0_24px_rgba(226,232,240,0.22)]',
  rare: 'hover:border-yellow-300 hover:shadow-[0_0_26px_rgba(253,224,71,0.34)]',
  mythic: 'hover:border-orange-300 hover:shadow-[0_0_30px_rgba(251,146,60,0.42)]',
};

export function CardTile({ card, onSelect }: CardTileProps) {
  return (
    <button
      aria-label={`View ${card.name}`}
      className={`group overflow-hidden rounded-lg border border-white/10 bg-stone-950/70 text-left shadow-card transition duration-200 hover:-translate-y-1 focus:border-ember focus:outline-none ${rarityBorderStyles[card.rarity] ?? 'hover:border-stone-600'}`}
      onClick={() => onSelect(card)}
      type="button"
    >
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
            {formatCardPrice(card)}
          </span>
        </div>
      </div>
    </button>
  );
}
