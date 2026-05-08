import { useEffect, useMemo, useState } from 'react';
import { fetchSupportedSets, openPack } from '../api/packApi';
import type { CardDto, OpenedPackDto, SessionStats, SupportedSetDto } from '../types/pack';
import { CardGrid } from './CardGrid';
import { CardPreviewModal } from './CardPreviewModal';
import { CardRevealStack } from './CardRevealStack';
import { PackSummary } from './PackSummary';
import { SessionStatsPanel } from './SessionStatsPanel';
import { SetSelector } from './SetSelector';

const DEFAULT_SET_CODE = 'blb';
const PACK_MSRP_USD = 5.99;
type RevealMode = 'all' | 'one-by-one';
type RevealPhase = 'idle' | 'revealing' | 'complete';

const initialSessionStats: SessionStats = {
  packsOpened: 0,
  totalEstimatedValue: 0,
  totalSpent: 0,
  netProfitLoss: 0,
  averagePackValue: 0,
  bestCard: null,
  bestPackValue: 0,
  mythicsPulled: 0,
};

export function PackOpener() {
  const [sets, setSets] = useState<SupportedSetDto[]>([]);
  const [selectedSetCode, setSelectedSetCode] = useState(DEFAULT_SET_CODE);
  const [pack, setPack] = useState<OpenedPackDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialSessionStats);
  const [revealMode, setRevealMode] = useState<RevealMode>('all');
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CardDto | null>(null);
  const [hasCountedCurrentPack, setHasCountedCurrentPack] = useState(false);
  const [summaryPack, setSummaryPack] = useState<OpenedPackDto | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSets() {
      try {
        const supportedSets = await fetchSupportedSets();
        if (ignore) {
          return;
        }

        setSets(supportedSets);
        if (supportedSets.length > 0 && !supportedSets.some((set) => set.setCode === DEFAULT_SET_CODE)) {
          setSelectedSetCode(supportedSets[0].setCode);
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Unable to load supported sets.';
        setError(message);
      } finally {
        if (!ignore) {
          setIsLoadingSets(false);
        }
      }
    }

    loadSets();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedSet = useMemo(
    () => sets.find((set) => set.setCode === selectedSetCode),
    [selectedSetCode, sets],
  );

  async function handleOpenPack() {
    setIsLoading(true);
    setError(null);

    try {
      const openedPack = await openPack(selectedSetCode);
      setPack(openedPack);
      setRevealedCount(revealMode === 'all' ? openedPack.cards.length : 0);
      setRevealPhase(revealMode === 'all' ? 'complete' : 'revealing');
      setHasCountedCurrentPack(revealMode === 'all');
      if (revealMode === 'all') {
        setSummaryPack(openedPack);
        setSessionStats((currentStats) => updateSessionStats(currentStats, openedPack));
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to open pack.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const displayedCards = pack
    ? pack.cards.slice(0, revealMode === 'all' ? pack.cards.length : revealedCount)
    : [];
  const isCinematicReveal = Boolean(pack && revealMode === 'one-by-one' && revealPhase === 'revealing');
  const canAdvanceReveal = Boolean(pack && revealPhase === 'revealing');

  return (
    <>
      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid gap-4 sm:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)] sm:items-end">
                <SetSelector
                  isLoading={isLoading || isLoadingSets}
                  onSelectedSetChange={setSelectedSetCode}
                  selectedSetCode={selectedSetCode}
                  sets={sets}
                />
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedSet?.setName ?? 'Stage 3 pack opener'}</h2>
                  <p className="mt-1 text-sm text-stone-300">
                    {selectedSet?.packType ?? 'Loading supported sets...'}
                  </p>
                </div>
              </div>
              <button
                className="rounded-md bg-ember px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                disabled={isLoading || isLoadingSets}
                onClick={handleOpenPack}
                type="button"
              >
                {isLoading ? 'Opening...' : `Open ${selectedSetCode.toUpperCase()} Pack`}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${revealMode === 'all' ? 'bg-amethyst text-white' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
                onClick={() => {
                  setRevealMode('all');
                  if (pack) {
                    setRevealedCount(pack.cards.length);
                    setRevealPhase('complete');
                    if (!hasCountedCurrentPack) {
                      setSummaryPack(pack);
                      setSessionStats((currentStats) => updateSessionStats(currentStats, pack));
                      setHasCountedCurrentPack(true);
                    }
                  }
                }}
                type="button"
              >
                Reveal all
              </button>
              <button
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${revealMode === 'one-by-one' ? 'bg-amethyst text-white' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
                onClick={() => {
                  setRevealMode('one-by-one');
                  if (pack) {
                    setRevealedCount(0);
                    setRevealPhase('revealing');
                  }
                }}
                type="button"
              >
                One by one
              </button>
              {revealMode === 'one-by-one' && pack && (
                <button
                  className="rounded-md border border-ember/40 px-4 py-2 text-sm font-semibold text-ember transition hover:border-ember hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canAdvanceReveal}
                  onClick={() => {
                    if (revealedCount >= pack.cards.length) {
                      setRevealPhase('complete');
                      if (!hasCountedCurrentPack) {
                        setSummaryPack(pack);
                        setSessionStats((currentStats) => updateSessionStats(currentStats, pack));
                        setHasCountedCurrentPack(true);
                      }
                      return;
                    }
                    setRevealedCount((count) => Math.min(count + 1, pack.cards.length));
                  }}
                  type="button"
                >
                  {revealedCount >= pack.cards.length
                    ? 'Continue'
                    : `Reveal next (${revealedCount}/${pack.cards.length})`}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {pack ? (
            isCinematicReveal ? (
              <CardRevealStack cards={displayedCards} onSelectCard={setSelectedCard} />
            ) : pack.cards.length > 0 ? (
              <CardGrid cards={pack.cards} onSelectCard={setSelectedCard} />
            ) : (
              <div className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
                Click Reveal next to turn over your cards.
              </div>
            )
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-6 text-center text-stone-400">
              Your opened pack cards will appear here.
            </div>
          )}
        </div>

        <div className="space-y-5">
          <PackSummary pack={summaryPack} isLoading={isLoading} selectedSetCode={selectedSetCode} />
          <SessionStatsPanel stats={sessionStats} />
        </div>
      </div>

      {selectedCard && <CardPreviewModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </>
  );
}

function updateSessionStats(currentStats: SessionStats, pack: OpenedPackDto): SessionStats {
  const packsOpened = currentStats.packsOpened + 1;
  const totalEstimatedValue = currentStats.totalEstimatedValue + pack.totalValueUsd;
  const totalSpent = packsOpened * PACK_MSRP_USD;
  const netProfitLoss = totalEstimatedValue - totalSpent;
  const mythicsPulled = currentStats.mythicsPulled
    + pack.cards.filter((card) => card.rarity === 'mythic').length;
  const bestCardInPack = findBestCard(pack.cards);
  const bestCardOverall = bestCardInPack && (!currentStats.bestCard || bestCardInPack.priceUsd > currentStats.bestCard.priceUsd)
    ? bestCardInPack
    : currentStats.bestCard;

  return {
    packsOpened,
    totalEstimatedValue,
    totalSpent,
    netProfitLoss,
    averagePackValue: totalEstimatedValue / packsOpened,
    bestCard: bestCardOverall,
    bestPackValue: Math.max(currentStats.bestPackValue, pack.totalValueUsd),
    mythicsPulled,
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
