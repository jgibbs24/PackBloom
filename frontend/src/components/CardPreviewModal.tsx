import type { CardDto } from '../types/pack';

type CardPreviewModalProps = {
  card: CardDto;
  onClose: () => void;
};

export function CardPreviewModal({ card, onClose }: CardPreviewModalProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 py-8"
      role="dialog"
    >
      <button
        aria-label="Close card preview"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative grid w-full max-w-3xl gap-5 rounded-lg border border-white/10 bg-stone-950 p-4 shadow-card sm:grid-cols-[minmax(15rem,22rem)_1fr]">
        <img
          alt={card.name}
          className="mx-auto w-full max-w-sm rounded-lg"
          src={card.imageUrl}
        />
        <div className="flex flex-col justify-between gap-6 p-1">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">{card.rarity}</p>
            <h2 className="mt-2 text-3xl font-bold text-white">{card.name}</h2>
            <p className="mt-4 text-2xl font-semibold text-violet-100">${card.priceUsd.toFixed(2)}</p>
          </div>
          <button
            className="rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-ember hover:text-ember"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
