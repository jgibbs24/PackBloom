import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { fetchSupportedSets, openPack } from '../api/packApi';
import { BOOSTER_OPTIONS, type BoosterType, getBoosterOption } from '../packLabels';
import { preloadPackWrapperImages } from '../packWrapperImages';
import { clearPersistedSession, loadPersistedSession, savePersistedSession } from '../sessionStorage';
import { getSetTheme } from '../setThemes';
import type { CardDto, OpenedPackDto, SessionStats, SupportedSetDto } from '../types/pack';
import { BinderPage } from './BinderPage';
import { CardGrid } from './CardGrid';
import { CardPreviewModal } from './CardPreviewModal';
import { CardRevealStack } from './CardRevealStack';
import { PackSummary } from './PackSummary';
import { PackWrapper } from './PackWrapper';
import { SessionStatsPanel } from './SessionStatsPanel';
import { SetSelector } from './SetSelector';

const DEFAULT_SET_CODE = 'blb';
const FALLBACK_PACK_MSRP_USD = 5.99;
const LANDING_FALLBACK_SET: SupportedSetDto = {
  msrpUsd: FALLBACK_PACK_MSRP_USD,
  packType: 'play-booster-barebones',
  setCode: DEFAULT_SET_CODE,
  setName: 'Bloomburrow',
};
type RevealMode = 'all' | 'one-by-one';
type RevealPhase = 'idle' | 'revealing' | 'complete';
type ActiveView = 'opener' | 'binder';
type AppStep = 'start' | 'select-set' | 'open-pack';

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
  const persistedSession = useMemo(() => loadPersistedSession(), []);
  const [sets, setSets] = useState<SupportedSetDto[]>([]);
  const [selectedSetCode, setSelectedSetCode] = useState(persistedSession?.selectedSetCode ?? DEFAULT_SET_CODE);
  const [pack, setPack] = useState<OpenedPackDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(persistedSession?.sessionStats ?? initialSessionStats);
  const [revealMode, setRevealMode] = useState<RevealMode>(persistedSession?.revealMode ?? 'all');
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CardDto | null>(null);
  const [hasCountedCurrentPack, setHasCountedCurrentPack] = useState(false);
  const [summaryPack, setSummaryPack] = useState<OpenedPackDto | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>(persistedSession?.activeView ?? 'opener');
  const [binderCards, setBinderCards] = useState<CardDto[]>(persistedSession?.binderCards ?? []);
  const [appStep, setAppStep] = useState<AppStep>('start');
  const [boosterTypesBySetCode, setBoosterTypesBySetCode] = useState<Record<string, BoosterType>>(
    persistedSession?.boosterTypesBySetCode ?? {},
  );
  const [isOpeningWrapper, setIsOpeningWrapper] = useState(false);
  const [landingSetIndex, setLandingSetIndex] = useState(0);

  useEffect(() => {
    preloadPackWrapperImages();
  }, []);

  useEffect(() => {
    savePersistedSession({
      activeView,
      binderCards,
      boosterTypesBySetCode,
      revealMode,
      selectedSetCode,
      sessionStats,
    });
  }, [activeView, binderCards, boosterTypesBySetCode, revealMode, selectedSetCode, sessionStats]);

  useEffect(() => {
    let ignore = false;

    async function loadSets() {
      try {
        const supportedSets = await fetchSupportedSets();
        if (ignore) {
          return;
        }

        setSets(supportedSets);
        if (supportedSets.length > 0 && !supportedSets.some((set) => set.setCode === selectedSetCode)) {
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

  useEffect(() => {
    if (sets.length <= 1 || appStep !== 'start') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setLandingSetIndex((currentIndex) => (currentIndex + 1) % sets.length);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [appStep, sets.length]);

  const selectedSet = useMemo(
    () => sets.find((set) => set.setCode === selectedSetCode),
    [selectedSetCode, sets],
  );
  const landingSet = sets.length > 0 ? sets[landingSetIndex % sets.length] : LANDING_FALLBACK_SET;
  const landingTheme = getSetTheme(landingSet?.setCode ?? selectedSetCode);
  const landingBooster = getBoosterOption(getBoosterTypeForSet(landingSet?.setCode, boosterTypesBySetCode));
  const selectedBoosterType = getBoosterTypeForSet(selectedSetCode, boosterTypesBySetCode);
  const selectedBooster = getBoosterOption(selectedBoosterType);
  const selectedTheme = getSetTheme(selectedSetCode);
  const themeStyle = {
    '--set-accent': appStep === 'start' ? landingTheme.accent : selectedTheme.accent,
    '--set-background': appStep === 'start' ? landingTheme.background : selectedTheme.background,
    '--set-primary': appStep === 'start' ? landingTheme.primary : selectedTheme.primary,
    '--set-secondary': appStep === 'start' ? landingTheme.secondary : selectedTheme.secondary,
    '--set-text': appStep === 'start' ? landingTheme.text : selectedTheme.text,
  } as CSSProperties;

  function resetCurrentPack() {
    setPack(null);
    setSummaryPack(null);
    setRevealPhase('idle');
    setRevealedCount(0);
    setHasCountedCurrentPack(false);
    setActiveView('opener');
  }

  function resetSession() {
    clearPersistedSession();
    resetCurrentPack();
    setSessionStats(initialSessionStats);
    setBinderCards([]);
    setSelectedCard(null);
    setRevealMode('all');
    setBoosterTypesBySetCode({});
    setSelectedSetCode(sets[0]?.setCode ?? DEFAULT_SET_CODE);
    setAppStep('start');
    setError(null);
  }

  function handleSelectedSetChange(setCode: string) {
    if (setCode !== selectedSetCode) {
      resetCurrentPack();
    }
    setSelectedSetCode(setCode);
  }

  function handleBoosterTypeChange(setCode: string, boosterType: BoosterType) {
    const currentBoosterType = getBoosterTypeForSet(setCode, boosterTypesBySetCode);
    if (setCode === selectedSetCode && boosterType !== currentBoosterType) {
      resetCurrentPack();
    }
    setBoosterTypesBySetCode((currentTypes) => ({
      ...currentTypes,
      [setCode]: boosterType,
    }));
  }

  async function handleOpenPack() {
    setIsLoading(true);
    setIsOpeningWrapper(true);
    setError(null);
    setActiveView('opener');
    setPack(null);
    setSummaryPack(null);
    setRevealPhase('idle');
    setRevealedCount(0);
    setHasCountedCurrentPack(false);

    try {
      const [openedPack] = await Promise.all([
        openPack(selectedSetCode, selectedBoosterType),
        delay(950),
      ]);
      setPack(openedPack);
      setRevealedCount(revealMode === 'all' ? openedPack.cards.length : 0);
      setRevealPhase(revealMode === 'all' ? 'complete' : 'revealing');
      setHasCountedCurrentPack(revealMode === 'all');
      if (revealMode === 'all') {
        setSummaryPack(openedPack);
        setSessionStats((currentStats) => updateSessionStats(currentStats, openedPack, selectedBooster.msrpUsd));
        setBinderCards((currentCards) => updateBinderCards(currentCards, openedPack));
      }
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to open pack.';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsOpeningWrapper(false);
    }
  }

  const displayedCards = pack
    ? pack.cards.slice(0, revealMode === 'all' ? pack.cards.length : revealedCount)
    : [];
  const isCinematicReveal = Boolean(pack && revealMode === 'one-by-one' && revealPhase === 'revealing');
  const canAdvanceReveal = Boolean(pack && revealPhase === 'revealing');
  const isRevealLocked = Boolean(
    pack && revealMode === 'one-by-one' && revealPhase === 'revealing' && !hasCountedCurrentPack,
  );
  const canStartOpeningFlow = !isLoadingSets && sets.length > 0;

  if (appStep === 'start') {
    return (
      <section
        className="relative flex flex-1 items-center overflow-hidden rounded-lg border border-white/10 bg-stone-950/60 px-6 py-10 shadow-card sm:px-10"
        style={themeStyle}
      >
        <div
          className="absolute inset-0 -z-0 opacity-70"
          style={{
            background:
              'linear-gradient(135deg, var(--set-background), rgba(255,255,255,0.04) 42%, rgba(0,0,0,0.42)), linear-gradient(90deg, var(--set-primary), transparent 58%)',
          }}
        />
        <div className="relative z-10 grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <h2 className="max-w-3xl text-5xl font-black leading-[0.98] text-white sm:text-6xl lg:text-7xl">
              Crack the next pack.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-ember px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                disabled={!canStartOpeningFlow}
                onClick={() => setAppStep('select-set')}
                type="button"
              >
                Play
              </button>
              {isLoadingSets && (
                <p className="self-center text-sm font-semibold text-stone-300">
                  Waking the pack engine...
                </p>
              )}
              {!isLoadingSets && error && sets.length === 0 && (
                <p className="max-w-sm self-center text-sm font-semibold text-red-100">
                  Could not reach the pack engine. Try refreshing in a moment.
                </p>
              )}
            </div>
          </div>

          <div className="mx-auto">
            <PackWrapper
              boosterType={getBoosterTypeForSet(landingSet?.setCode, boosterTypesBySetCode)}
              packTypeLabel={landingBooster.label}
              set={landingSet}
              theme={landingTheme}
            />
          </div>
        </div>
      </section>
    );
  }

  if (appStep === 'select-set') {
    return (
      <>
        <SetSelector
          boosterTypesBySetCode={boosterTypesBySetCode}
          isLoading={isLoadingSets}
          onBack={() => setAppStep('start')}
          onBoosterTypeChange={handleBoosterTypeChange}
          onContinue={() => setAppStep('open-pack')}
          onSelectedSetChange={handleSelectedSetChange}
          selectedSetCode={selectedSetCode}
          sets={sets}
        />
        {error && (
          <div className="mt-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start" style={themeStyle}>
        <div className="min-w-0">
          <div className="mb-6 grid gap-5 rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-card lg:grid-cols-[13rem_minmax(0,1fr)]">
            <div className="mx-auto lg:mx-0">
              <PackWrapper boosterType={selectedBoosterType} set={selectedSet} theme={selectedTheme} size="compact" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
                    {selectedSet?.setCode ?? selectedSetCode}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">{selectedSet?.setName ?? 'Pack opener'}</h2>
                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Pack type
                      <select
                        className="mt-1 block min-w-44 rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition focus:border-ember"
                        onChange={(event) => handleBoosterTypeChange(selectedSetCode, event.target.value as BoosterType)}
                        value={selectedBoosterType}
                      >
                        {BOOSTER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      MSRP ${selectedBooster.msrpUsd.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
                    onClick={() => setAppStep('start')}
                    type="button"
                  >
                    Home
                  </button>
                  <button
                    className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
                    onClick={() => setAppStep('select-set')}
                    type="button"
                  >
                    Change set
                  </button>
                  <button
                    className="rounded-md bg-ember px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    disabled={isLoading || isLoadingSets || isRevealLocked}
                    onClick={handleOpenPack}
                    type="button"
                  >
                    {isLoading ? 'Opening...' : 'Open Pack'}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                <button
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition ${revealMode === 'all' ? 'bg-amethyst text-white' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
                  onClick={() => {
                    setRevealMode('all');
                    if (pack) {
                      setRevealedCount(pack.cards.length);
                      setRevealPhase('complete');
                      if (!hasCountedCurrentPack) {
                        setSummaryPack(pack);
                        setSessionStats((currentStats) => updateSessionStats(currentStats, pack, selectedBooster.msrpUsd));
                        setBinderCards((currentCards) => updateBinderCards(currentCards, pack));
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
                          setSessionStats((currentStats) => updateSessionStats(currentStats, pack, selectedBooster.msrpUsd));
                          setBinderCards((currentCards) => updateBinderCards(currentCards, pack));
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
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mb-5 flex gap-3">
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeView === 'opener' ? 'bg-ember text-stone-950' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
              onClick={() => setActiveView('opener')}
              type="button"
            >
              Pack opener
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeView === 'binder' ? 'bg-ember text-stone-950' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
              onClick={() => setActiveView('binder')}
              type="button"
            >
              Binder
            </button>
          </div>

          {activeView === 'binder' ? (
            <BinderPage cards={binderCards} onSelectCard={setSelectedCard} />
          ) : isOpeningWrapper ? (
            <section className="relative flex min-h-[28rem] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(244,184,96,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-10 shadow-card">
              <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent" />
              <div className="pack-wrapper-opening">
                <PackWrapper boosterType={selectedBoosterType} set={selectedSet} theme={selectedTheme} />
              </div>
            </section>
          ) : pack ? (
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
          <SessionStatsPanel onResetSession={resetSession} stats={sessionStats} />
        </div>
      </div>

      {selectedCard && <CardPreviewModal card={selectedCard} onClose={() => setSelectedCard(null)} />}
    </>
  );
}

function updateSessionStats(
  currentStats: SessionStats,
  pack: OpenedPackDto,
  packMsrpUsd = FALLBACK_PACK_MSRP_USD,
): SessionStats {
  const packsOpened = currentStats.packsOpened + 1;
  const totalEstimatedValue = currentStats.totalEstimatedValue + pack.totalValueUsd;
  const totalSpent = currentStats.totalSpent + packMsrpUsd;
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

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getBoosterTypeForSet(
  setCode: string | undefined,
  boosterTypesBySetCode: Record<string, BoosterType>,
): BoosterType {
  return setCode ? boosterTypesBySetCode[setCode] ?? 'play' : 'play';
}

function findBestCard(cards: CardDto[]): CardDto | null {
  return cards.reduce<CardDto | null>((best, card) => {
    if (!best || card.priceUsd > best.priceUsd) {
      return card;
    }
    return best;
  }, null);
}

function updateBinderCards(currentCards: CardDto[], pack: OpenedPackDto): CardDto[] {
  const cardsById = new Map(currentCards.map((card) => [card.id, card]));

  for (const card of pack.cards) {
    const existingCard = cardsById.get(card.id);
    if (!existingCard || card.priceUsd > existingCard.priceUsd) {
      cardsById.set(card.id, card);
    }
  }

  return Array.from(cardsById.values())
    .sort((left, right) => right.priceUsd - left.priceUsd)
    .slice(0, 20);
}
