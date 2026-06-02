import type { CardDto } from './types/pack';

export function cardHasPrice(card: CardDto): boolean {
  return card.priceAvailable ?? card.priceUsd > 0;
}

export function formatCardPrice(card: CardDto): string {
  if (!cardHasPrice(card)) {
    return 'Price unavailable';
  }

  return `$${card.priceUsd.toFixed(2)}`;
}
