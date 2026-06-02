import type { CardDto } from './types/pack';

export function cardDetailLabels(card: CardDto): string[] {
  return [card.slot, card.treatment, card.finish]
    .filter((label): label is string => Boolean(label?.trim()));
}
