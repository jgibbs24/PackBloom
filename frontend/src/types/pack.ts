export type CardDto = {
  id: string;
  name: string;
  rarity: string;
  imageUrl: string;
  priceUsd: number;
};

export type OpenedPackDto = {
  setCode: string;
  cards: CardDto[];
  totalValueUsd: number;
};
