import type { CardDto } from '../types/pack';
import { CardTile } from './CardTile';

type CardGridProps = {
  cards: CardDto[];
};

export function CardGrid({ cards }: CardGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <CardTile card={card} key={card.id} />
      ))}
    </div>
  );
}
