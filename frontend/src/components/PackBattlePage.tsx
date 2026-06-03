import { useMemo, useState } from 'react';
import { openPack } from '../api/packApi';
import { playFeedbackSound } from '../audioFeedback';
import { formatCardPrice } from '../cardPrice';
import { getBoosterOption, type BoosterType } from '../packLabels';
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
  playerAName: string;
  packB: OpenedPackDto;
  playerBName: string;
};

type BattleProgress = 'idle' | 'first' | 'second';
type BattleRevealMode = 'all' | 'one-by-one';

type BattleSessionStats = {
  battles: number;
  biggestWinMargin: number;
  bestPackValue: number;
  playerAWins: number;
  playerBWins: number;
  ties: number;
};

type BattleHistoryEntry = {
  bestCardA: CardDto | null;
  bestCardB: CardDto | null;
  boosterType: BoosterType;
  id: string;
  margin: number;
  playerAName: string;
  playerBName: string;
  setCode: string;
  setName: string;
  totalA: number;
  totalB: number;
  winner: BattleSide | 'tie';
};

const initialBattleStats: BattleSessionStats = {
  battles: 0,
  biggestWinMargin: 0,
  bestPackValue: 0,
  playerAWins: 0,
  playerBWins: 0,
  ties: 0,
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
  const [playerAName, setPlayerAName] = useState('Player 1');
  const [playerBName, setPlayerBName] = useState('Player 2');
  const [progress, setProgress] = useState<BattleProgress>('idle');
  const [battleRevealMode, setBattleRevealMode] = useState<BattleRevealMode>('all');
  const [revealedCount, setRevealedCount] = useState(0);
  const [hasCountedBattle, setHasCountedBattle] = useState(false);
  const [battleStats, setBattleStats] = useState<BattleSessionStats>(initialBattleStats);
  const [battleHistory, setBattleHistory] = useState<BattleHistoryEntry[]>([]);

  const winner = useMemo(() => {
    if (!battleResult) {
      return null;
    }

    return getBattleWinner(battleResult.packA.totalValueUsd, battleResult.packB.totalValueUsd);
  }, [battleResult]);
  const maxRevealCount = battleResult
    ? Math.max(battleResult.packA.cards.length, battleResult.packB.cards.length)
    : 0;
  const hasRevealedEveryCard = Boolean(battleResult && revealedCount >= maxRevealCount);
  const visibleCardsA = battleResult?.packA.cards.slice(0, revealedCount) ?? [];
  const visibleCardsB = battleResult?.packB.cards.slice(0, revealedCount) ?? [];
  const runningTotalA = sumCardPrices(visibleCardsA);
  const runningTotalB = sumCardPrices(visibleCardsB);

  async function handleStartBattle() {
    if (!isEngineReady || !selectedSet) {
      return;
    }

    playFeedbackSound('pack', canPlaySfx, audioVolume);
    setBattleResult(null);
    setError(null);
    setIsLoading(true);
    setRevealedCount(0);
    setHasCountedBattle(false);
    setProgress('first');

    try {
      const packA = await openPack(selectedSet.setCode, boosterType);
      setProgress('second');
      const packB = await openPack(selectedSet.setCode, boosterType);
      setBattleResult({
        packA,
        packB,
        playerAName: normalizePlayerName(playerAName, 'Player 1'),
        playerBName: normalizePlayerName(playerBName, 'Player 2'),
      });
      const nextRevealCount = battleRevealMode === 'all'
        ? Math.max(packA.cards.length, packB.cards.length)
        : Math.min(1, Math.max(packA.cards.length, packB.cards.length));
      setRevealedCount(nextRevealCount);
      if (battleRevealMode === 'all') {
        completeBattle(packA, packB, false);
      }
      if (
        battleRevealMode === 'all'
        && (packA.cards.some((card) => card.rarity === 'mythic') || packB.cards.some((card) => card.rarity === 'mythic'))
      ) {
        playFeedbackSound('mythic', canPlaySfx, audioVolume);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to start battle.');
    } finally {
      setIsLoading(false);
      setProgress('idle');
    }
  }

  function completeBattle(packA: OpenedPackDto, packB: OpenedPackDto, respectExistingCount = true) {
    if (respectExistingCount && hasCountedBattle) {
      return;
    }

    setBattleStats((currentStats) => updateBattleStats(currentStats, packA, packB));
    setBattleHistory((currentHistory) => [
      createBattleHistoryEntry(
        packA,
        packB,
        normalizePlayerName(playerAName, 'Player 1'),
        normalizePlayerName(playerBName, 'Player 2'),
        selectedSet,
        boosterType,
      ),
      ...currentHistory,
    ]);
    setHasCountedBattle(true);
  }

  function revealNextPair() {
    if (!battleResult || revealedCount >= maxRevealCount) {
      return;
    }

    const nextIndex = revealedCount;
    const nextCards = [
      battleResult.packA.cards[nextIndex],
      battleResult.packB.cards[nextIndex],
    ].filter(Boolean);

    const hasMythic = nextCards.some((card) => card.rarity === 'mythic');
    playFeedbackSound(hasMythic ? 'mythic' : 'flip', canPlaySfx, audioVolume);
    const nextCount = Math.min(revealedCount + 1, maxRevealCount);
    setRevealedCount(nextCount);
    if (nextCount >= maxRevealCount) {
      completeBattle(battleResult.packA, battleResult.packB);
    }
  }

  function revealRemainingPairs() {
    if (!battleResult) {
      return;
    }

    setRevealedCount(maxRevealCount);
    completeBattle(battleResult.packA, battleResult.packB);
  }

  return (
    <div className="flex flex-1 flex-col">
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
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Left side</span>
                <input
                  className="mt-2 w-full rounded-md border border-white/10 bg-stone-950 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
                  maxLength={24}
                  onChange={(event) => setPlayerAName(event.target.value)}
                  placeholder="Player 1"
                  value={playerAName}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Right side</span>
                <input
                  className="mt-2 w-full rounded-md border border-white/10 bg-stone-950 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
                  maxLength={24}
                  onChange={(event) => setPlayerBName(event.target.value)}
                  placeholder="Player 2"
                  value={playerBName}
                />
              </label>
              <button
                className="rounded-md bg-ember px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                disabled={!isEngineReady || isLoading}
                onClick={handleStartBattle}
                type="button"
              >
                {isLoading ? 'Battling...' : isEngineReady ? 'Start Battle' : 'Engine Waking'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                className={`rounded-md px-4 py-3 text-sm font-bold transition ${
                  battleRevealMode === 'all'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/[0.06] text-stone-200 hover:bg-white/10'
                }`}
                disabled={isLoading}
                onClick={() => {
                  setBattleRevealMode('all');
                  if (battleResult) {
                    setRevealedCount(maxRevealCount);
                    completeBattle(battleResult.packA, battleResult.packB);
                  }
                }}
                type="button"
              >
                Reveal all
              </button>
              <button
                className={`rounded-md px-4 py-3 text-sm font-bold transition ${
                  battleRevealMode === 'one-by-one'
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/[0.06] text-stone-200 hover:bg-white/10'
                }`}
                disabled={isLoading}
                onClick={() => {
                  setBattleRevealMode('one-by-one');
                  if (battleResult && hasRevealedEveryCard) {
                    setRevealedCount(Math.min(1, maxRevealCount));
                  }
                }}
                type="button"
              >
                One by one
              </button>
            </div>
            {isLoading && (
              <p className="text-sm font-semibold text-amber-100">
                {progress === 'second'
                  ? `Opening ${normalizePlayerName(playerBName, 'Player 2')}'s pack...`
                  : `Opening ${normalizePlayerName(playerAName, 'Player 1')}'s pack...`}
              </p>
            )}
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

        <BattleStatsPanel
          playerAName={normalizePlayerName(playerAName, 'Player 1')}
          playerBName={normalizePlayerName(playerBName, 'Player 2')}
          stats={battleStats}
          onResetStats={() => {
            setBattleStats(initialBattleStats);
            setBattleHistory([]);
          }}
        />

        {battleResult ? (
          <section className="space-y-5">
            {battleRevealMode === 'one-by-one' && (
              <BattleRevealControls
                hasRevealedEveryCard={hasRevealedEveryCard}
                maxRevealCount={maxRevealCount}
                onRevealNext={revealNextPair}
                onRevealRemaining={revealRemainingPairs}
                onStartNewBattle={handleStartBattle}
                revealedCount={revealedCount}
              />
            )}
            {hasRevealedEveryCard && (
              <BattleWinnerBanner
                packA={battleResult.packA}
                packB={battleResult.packB}
                playerAName={battleResult.playerAName}
                playerBName={battleResult.playerBName}
                onStartNewBattle={handleStartBattle}
                winner={winner}
              />
            )}
            <div className="grid gap-5 xl:grid-cols-2">
              <BattlePackPanel
                isWinner={hasRevealedEveryCard && winner === 'A'}
                onSelectCard={onSelectCard}
                pack={battleResult.packA}
                playerName={battleResult.playerAName}
                revealMode={battleRevealMode}
                runningTotal={runningTotalA}
                side="A"
                visibleCards={visibleCardsA}
              />
              <BattlePackPanel
                isWinner={hasRevealedEveryCard && winner === 'B'}
                onSelectCard={onSelectCard}
                pack={battleResult.packB}
                playerName={battleResult.playerBName}
                revealMode={battleRevealMode}
                runningTotal={runningTotalB}
                side="B"
                visibleCards={visibleCardsB}
              />
            </div>
            <BattleHistoryPanel history={battleHistory} />
          </section>
        ) : (
          <section className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
            Start a battle to open two packs side by side.
          </section>
        )}
      </div>
    </div>
  );
}

function BattleWinnerBanner({
  packA,
  packB,
  playerAName,
  playerBName,
  onStartNewBattle,
  winner,
}: {
  packA: OpenedPackDto;
  packB: OpenedPackDto;
  playerAName: string;
  playerBName: string;
  onStartNewBattle: () => void;
  winner: BattleSide | 'tie' | null;
}) {
  const valueDifference = Math.abs(packA.totalValueUsd - packB.totalValueUsd);
  const winnerName = winner === 'A' ? playerAName : playerBName;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ember/35 bg-ember/10 px-5 py-4 shadow-[0_0_30px_rgba(244,184,96,0.12)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">Battle complete</p>
        <h3 className="mt-2 text-3xl font-black text-white">
          {winner === 'tie' ? 'Draw' : `${winnerName} wins`}
        </h3>
        <p className="mt-1 text-sm font-semibold text-amber-100">
          {winner === 'tie'
            ? 'Both packs landed on the same total value.'
            : `Won by $${valueDifference.toFixed(2)}.`}
        </p>
      </div>
      <button
        className="w-fit rounded-md bg-ember px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-yellow-300"
        onClick={onStartNewBattle}
        type="button"
      >
        New battle
      </button>
    </div>
  );
}

function BattlePackPanel({
  isWinner,
  onSelectCard,
  pack,
  playerName,
  revealMode,
  runningTotal,
  side,
  visibleCards,
}: {
  isWinner: boolean;
  onSelectCard: (card: CardDto) => void;
  pack: OpenedPackDto;
  playerName: string;
  revealMode: BattleRevealMode;
  runningTotal: number;
  side: BattleSide;
  visibleCards: CardDto[];
}) {
  const bestCard = findBestCard(visibleCards);
  const mythicCount = visibleCards.filter((card) => card.rarity === 'mythic').length;
  const rareCount = visibleCards.filter((card) => card.rarity === 'rare').length;
  const currentCard = visibleCards.length > 0 ? visibleCards[visibleCards.length - 1] : undefined;

  return (
    <article className={`rounded-lg border bg-stone-950/70 shadow-card ${isWinner ? 'border-ember' : 'border-white/10'}`}>
      <div className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500">{playerName}</p>
            <h3 className="mt-1 text-2xl font-black text-white">${runningTotal.toFixed(2)}</h3>
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
      {revealMode === 'one-by-one' ? (
        <div className="p-4">
          {currentCard ? (
            <div className="mx-auto max-w-[18rem]">
              <button
                aria-label={`View ${currentCard.name}`}
                className="group relative block w-full pt-5 text-left focus:outline-none"
                onClick={() => onSelectCard(currentCard)}
                type="button"
              >
                <div className="absolute left-7 right-7 top-0 h-full rotate-[-5deg] rounded-lg border border-white/10 bg-stone-900/70 shadow-card" />
                <div className="absolute left-4 right-4 top-2 h-full rotate-[4deg] rounded-lg border border-white/10 bg-stone-900/80 shadow-card" />
                <div className="relative overflow-hidden rounded-lg border border-white/10 bg-stone-900 shadow-card transition group-hover:-translate-y-1 group-hover:border-ember">
                  <img
                    alt={currentCard.name}
                    className="aspect-[488/680] w-full object-cover"
                    loading="lazy"
                    src={currentCard.imageUrl}
                  />
                  <div className="space-y-2 p-3">
                    <p className="line-clamp-2 text-base font-bold leading-5 text-white">{currentCard.name}</p>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold uppercase tracking-[0.12em] text-stone-400">{currentCard.rarity}</span>
                      <span className="rounded bg-violet-500/70 px-2 py-1 font-bold text-violet-50">
                        {formatCardPrice(currentCard)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
              <p className="mt-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                {visibleCards.length} cards revealed
              </p>
            </div>
          ) : (
            <div className="flex min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] text-sm font-semibold text-stone-500">
              Waiting for reveal
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
          {visibleCards.map((card, index) => (
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
      )}
    </article>
  );
}

function BattleRevealControls({
  hasRevealedEveryCard,
  maxRevealCount,
  onRevealNext,
  onRevealRemaining,
  onStartNewBattle,
  revealedCount,
}: {
  hasRevealedEveryCard: boolean;
  maxRevealCount: number;
  onRevealNext: () => void;
  onRevealRemaining: () => void;
  onStartNewBattle: () => void;
  revealedCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-card">
      <div className="mr-auto">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ember">One by one</p>
        <p className="mt-1 text-sm font-semibold text-stone-300">
          Revealed {Math.min(revealedCount, maxRevealCount)} of {maxRevealCount}
        </p>
      </div>
      <button
        className="rounded-md bg-ember px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={hasRevealedEveryCard}
        onClick={onRevealNext}
        type="button"
      >
        Reveal next
      </button>
      {!hasRevealedEveryCard && (
        <button
          className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
          onClick={onRevealRemaining}
          type="button"
        >
          Reveal remaining
        </button>
      )}
      {hasRevealedEveryCard && (
        <button
          className="rounded-md bg-emerald-400 px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-950 transition hover:bg-emerald-300"
          onClick={onStartNewBattle}
          type="button"
        >
          New battle
        </button>
      )}
    </div>
  );
}

function BattleStatsPanel({
  onResetStats,
  playerAName,
  playerBName,
  stats,
}: {
  onResetStats: () => void;
  playerAName: string;
  playerBName: string;
  stats: BattleSessionStats;
}) {
  const playerAWinRate = stats.battles > 0 ? (stats.playerAWins / stats.battles) * 100 : 0;
  const playerBWinRate = stats.battles > 0 ? (stats.playerBWins / stats.battles) * 100 : 0;

  return (
    <section className="mb-6 rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-ember">Battle session</p>
        <button
          className="rounded-md border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
          onClick={onResetStats}
          type="button"
        >
          Reset stats
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BattleStat label={`${playerAName} wins`} value={`${stats.playerAWins} (${playerAWinRate.toFixed(0)}%)`} />
        <BattleStat label={`${playerBName} wins`} value={`${stats.playerBWins} (${playerBWinRate.toFixed(0)}%)`} />
        <BattleStat label="Best pack" value={`$${stats.bestPackValue.toFixed(2)}`} />
        <BattleStat label="Biggest margin" value={`$${stats.biggestWinMargin.toFixed(2)}`} />
      </div>
    </section>
  );
}

function BattleHistoryPanel({ history }: { history: BattleHistoryEntry[] }) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-card">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-ember">Battle history</p>
      <div className="mt-4 space-y-3">
        {history.map((entry) => {
          const winnerName = entry.winner === 'A'
            ? entry.playerAName
            : entry.winner === 'B'
              ? entry.playerBName
              : 'Draw';
          const boosterLabel = getBoosterOption(entry.boosterType).label;

          return (
            <article className="rounded-md border border-white/10 bg-black/20 p-4" key={entry.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
                    {entry.setCode.toUpperCase()} / {boosterLabel}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {entry.winner === 'tie' ? 'Draw' : `${winnerName} won by $${entry.margin.toFixed(2)}`}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-stone-400">{entry.setName}</p>
                </div>
                <div className="text-left text-sm font-semibold text-stone-300 sm:text-right">
                  <p>{entry.playerAName}: ${entry.totalA.toFixed(2)}</p>
                  <p>{entry.playerBName}: ${entry.totalB.toFixed(2)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <BattleHistoryBestPull label={`${entry.playerAName} best`} card={entry.bestCardA} />
                <BattleHistoryBestPull label={`${entry.playerBName} best`} card={entry.bestCardB} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function BattleHistoryBestPull({ card, label }: { card: CardDto | null; label: string }) {
  return (
    <div className="rounded bg-white/[0.04] p-3">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-1 line-clamp-2 font-semibold text-white">
        {card ? `${card.name} ${formatCardPrice(card)}` : 'None'}
      </p>
    </div>
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

function normalizePlayerName(name: string, fallbackName: string): string {
  return name.trim() || fallbackName;
}

function sumCardPrices(cards: CardDto[]): number {
  return cards.reduce((total, card) => total + card.priceUsd, 0);
}

function getBattleWinner(totalA: number, totalB: number): BattleSide | 'tie' {
  if (totalA > totalB) {
    return 'A';
  }

  if (totalB > totalA) {
    return 'B';
  }

  return 'tie';
}

function updateBattleStats(
  currentStats: BattleSessionStats,
  packA: OpenedPackDto,
  packB: OpenedPackDto,
): BattleSessionStats {
  const winner = getBattleWinner(packA.totalValueUsd, packB.totalValueUsd);
  const margin = Math.abs(packA.totalValueUsd - packB.totalValueUsd);

  return {
    battles: currentStats.battles + 1,
    biggestWinMargin: Math.max(currentStats.biggestWinMargin, margin),
    bestPackValue: Math.max(currentStats.bestPackValue, packA.totalValueUsd, packB.totalValueUsd),
    playerAWins: currentStats.playerAWins + (winner === 'A' ? 1 : 0),
    playerBWins: currentStats.playerBWins + (winner === 'B' ? 1 : 0),
    ties: currentStats.ties + (winner === 'tie' ? 1 : 0),
  };
}

function createBattleHistoryEntry(
  packA: OpenedPackDto,
  packB: OpenedPackDto,
  playerAName: string,
  playerBName: string,
  selectedSet: SupportedSetDto | undefined,
  boosterType: BoosterType,
): BattleHistoryEntry {
  const winner = getBattleWinner(packA.totalValueUsd, packB.totalValueUsd);

  return {
    bestCardA: findBestCard(packA.cards),
    bestCardB: findBestCard(packB.cards),
    boosterType,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    margin: Math.abs(packA.totalValueUsd - packB.totalValueUsd),
    playerAName,
    playerBName,
    setCode: selectedSet?.setCode ?? packA.setCode,
    setName: selectedSet?.setName ?? packA.setCode.toUpperCase(),
    totalA: packA.totalValueUsd,
    totalB: packB.totalValueUsd,
    winner,
  };
}

function findBestCard(cards: CardDto[]): CardDto | null {
  return cards.reduce<CardDto | null>((best, card) => {
    if (!best || card.priceUsd > best.priceUsd) {
      return card;
    }
    return best;
  }, null);
}
