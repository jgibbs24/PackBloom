import { useMemo, useState } from 'react';
import { openPack } from '../api/packApi';
import { playFeedbackSound } from '../audioFeedback';
import { formatCardPrice } from '../cardPrice';
import type { BoosterType } from '../packLabels';
import type { CardDto, OpenedPackDto, SupportedSetDto } from '../types/pack';
import { PackWrapper } from './PackWrapper';
import type { SetTheme } from '../setThemes';

type PackBattlePageProps = {
  audioVolume: number;
  boosterType: BoosterType;
  canRetryEngine: boolean;
  canPlaySfx: boolean;
  engineStatusMessage: string;
  isEngineReady: boolean;
  onChangeSet: () => void;
  onHome: () => void;
  onRetryEngine: () => void;
  onSelectCard: (card: CardDto) => void;
  selectedSet: SupportedSetDto | undefined;
  theme: SetTheme;
};

type BattleSide = 'A' | 'B';

type BattleResult = {
  packA: OpenedPackDto;
  packB: OpenedPackDto;
};

export function PackBattlePage({
  audioVolume,
  boosterType,
  canRetryEngine,
  canPlaySfx,
  engineStatusMessage,
  isEngineReady,
  onChangeSet,
  onHome,
  onRetryEngine,
  onSelectCard,
  selectedSet,
  theme,
}: PackBattlePageProps) {
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const winner = useMemo(() => {
    if (!battleResult) {
      return null;
    }

    if (battleResult.packA.totalValueUsd > battleResult.packB.totalValueUsd) {
      return 'A';
    }

    if (battleResult.packB.totalValueUsd > battleResult.packA.totalValueUsd) {
      return 'B';
    }

    return 'tie';
  }, [battleResult]);

  async function handleStartBattle() {
    if (!isEngineReady || !selectedSet) {
      return;
    }

    playFeedbackSound('pack', canPlaySfx, audioVolume);
    setBattleResult(null);
    setError(null);
    setIsLoading(true);

    try {
      const [packA, packB] = await Promise.all([
        openPack(selectedSet.setCode, boosterType),
        openPack(selectedSet.setCode, boosterType),
      ]);
      setBattleResult({ packA, packB });
      if (packA.cards.some((card) => card.rarity === 'mythic') || packB.cards.some((card) => card.rarity === 'mythic')) {
        playFeedbackSound('mythic', canPlaySfx, audioVolume);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to start battle.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="min-w-0">
        <section className="mb-6 grid gap-5 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card md:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="mx-auto md:mx-0">
            <PackWrapper boosterType={boosterType} set={selectedSet} theme={theme} size="compact" />
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                  {selectedSet?.setCode ?? 'MTG'} / Pack battle
                </p>
                <h2 className="mt-1 text-3xl font-black text-white">{selectedSet?.setName ?? 'Pack Battle'}</h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-stone-400">
                  Two packs enter. Highest total value wins.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
                  onClick={onHome}
                  type="button"
                >
                  Home
                </button>
                <button
                  className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
                  onClick={onChangeSet}
                  type="button"
                >
                  Change set
                </button>
              </div>
            </div>
            <button
              className="w-fit rounded-md bg-ember px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={!isEngineReady || isLoading}
              onClick={handleStartBattle}
              type="button"
            >
              {isLoading ? 'Battling...' : isEngineReady ? 'Start Battle' : 'Engine Waking'}
            </button>
            {!isEngineReady && (
              <div className="text-sm font-semibold text-stone-300">
                <p>{engineStatusMessage}</p>
                {canRetryEngine && (
                  <button
                    className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ember underline-offset-4 hover:underline"
                    onClick={onRetryEngine}
                    type="button"
                  >
                    Check again
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {battleResult ? (
          <section className="space-y-5">
            <BattleWinnerBanner packA={battleResult.packA} packB={battleResult.packB} winner={winner} />
            <div className="grid gap-5 xl:grid-cols-2">
              <BattlePackPanel
                isWinner={winner === 'A'}
                onSelectCard={onSelectCard}
                pack={battleResult.packA}
                side="A"
              />
              <BattlePackPanel
                isWinner={winner === 'B'}
                onSelectCard={onSelectCard}
                pack={battleResult.packB}
                side="B"
              />
            </div>
          </section>
        ) : (
          <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
            Start a battle to open two packs side by side.
          </section>
        )}
      </div>

      <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Battle rules</p>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="font-bold text-white">Winner</dt>
            <dd className="mt-1 text-stone-400">Highest total pack value.</dd>
          </div>
          <div>
            <dt className="font-bold text-white">Tiebreaker</dt>
            <dd className="mt-1 text-stone-400">Equal values are treated as a draw for now.</dd>
          </div>
          <div>
            <dt className="font-bold text-white">Tracking</dt>
            <dd className="mt-1 text-stone-400">Battle history can be added after the core mode feels right.</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function BattleWinnerBanner({
  packA,
  packB,
  winner,
}: {
  packA: OpenedPackDto;
  packB: OpenedPackDto;
  winner: BattleSide | 'tie' | null;
}) {
  const valueDifference = Math.abs(packA.totalValueUsd - packB.totalValueUsd);

  return (
    <div className="rounded-lg border border-ember/35 bg-ember/10 px-5 py-4 shadow-[0_0_30px_rgba(244,184,96,0.12)]">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">Battle result</p>
      <h3 className="mt-2 text-3xl font-black text-white">
        {winner === 'tie' ? 'Draw' : `Pack ${winner} wins`}
      </h3>
      <p className="mt-1 text-sm font-semibold text-amber-100">
        {winner === 'tie'
          ? 'Both packs landed on the same total value.'
          : `Won by $${valueDifference.toFixed(2)}.`}
      </p>
    </div>
  );
}

function BattlePackPanel({
  isWinner,
  onSelectCard,
  pack,
  side,
}: {
  isWinner: boolean;
  onSelectCard: (card: CardDto) => void;
  pack: OpenedPackDto;
  side: BattleSide;
}) {
  const bestCard = findBestCard(pack.cards);
  const mythicCount = pack.cards.filter((card) => card.rarity === 'mythic').length;
  const rareCount = pack.cards.filter((card) => card.rarity === 'rare').length;

  return (
    <article className={`rounded-lg border bg-stone-950/70 shadow-card ${isWinner ? 'border-ember' : 'border-white/10'}`}>
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">Pack {side}</p>
            <h3 className="mt-1 text-2xl font-black text-white">${pack.totalValueUsd.toFixed(2)}</h3>
          </div>
          {isWinner && (
            <span className="rounded bg-ember px-2 py-1 text-xs font-black uppercase tracking-[0.14em] text-stone-950">
              Winner
            </span>
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <BattleStat label="Best pull" value={bestCard ? `${bestCard.name} ${formatCardPrice(bestCard)}` : 'None'} />
          <BattleStat label="Rares" value={String(rareCount)} />
          <BattleStat label="Mythics" value={String(mythicCount)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {pack.cards.map((card, index) => (
          <button
            aria-label={`View ${card.name}`}
            className="group overflow-hidden rounded-lg border border-white/10 bg-stone-900 text-left transition hover:-translate-y-0.5 hover:border-ember focus:border-ember focus:outline-none"
            key={`${side}-${card.id}-${index}`}
            onClick={() => onSelectCard(card)}
            type="button"
          >
            <img alt={card.name} className="aspect-[488/680] w-full object-cover" loading="lazy" src={card.imageUrl} />
            <div className="space-y-1 p-2">
              <p className="line-clamp-2 min-h-8 text-xs font-semibold leading-4 text-white">{card.name}</p>
              <div className="flex items-center justify-between gap-2 text-[0.68rem]">
                <span className="font-bold uppercase tracking-[0.12em] text-stone-400">{card.rarity}</span>
                <span className="font-semibold text-violet-100">{formatCardPrice(card)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </article>
  );
}

function BattleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-black/20 p-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function findBestCard(cards: CardDto[]): CardDto | null {
  return cards.reduce<CardDto | null>((best, card) => {
    if (!best || card.priceUsd > best.priceUsd) {
      return card;
    }
    return best;
  }, null);
}
