import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { fetchApiHealth, fetchSupportedSets, openPack, warmUpPack } from '../api/packApi';
import { BOOSTER_OPTIONS, type BoosterType, getBoosterOption } from '../packLabels';
import { preloadPackWrapperImages } from '../packWrapperImages';
import { clearPersistedSession, loadPersistedSession, savePersistedSession } from '../sessionStorage';
import { getSetTheme } from '../setThemes';
import { FALLBACK_SUPPORTED_SETS } from '../supportedSets';
import type { CardDto, OpenedPackDto, PackHistoryEntry, SessionStats, SupportedSetDto } from '../types/pack';
import { BinderPage } from './BinderPage';
import { CardGrid } from './CardGrid';
import { CardPreviewModal } from './CardPreviewModal';
import { CardRevealStack } from './CardRevealStack';
import { PackHistoryPage } from './PackHistoryPage';
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
type ActiveView = 'opener' | 'binder' | 'history';
type EngineStatus = 'checking' | 'ready' | 'waking' | 'unavailable';
export type AppStep = 'start' | 'select-set' | 'open-pack';

type PackOpenerProps = {
  appStep: AppStep;
  setAppStep: (appStep: AppStep) => void;
};

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

export function PackOpener({ appStep, setAppStep }: PackOpenerProps) {
  const persistedSession = useMemo(() => loadPersistedSession(), []);
  const [sets, setSets] = useState<SupportedSetDto[]>(FALLBACK_SUPPORTED_SETS);
  const [selectedSetCode, setSelectedSetCode] = useState(persistedSession?.selectedSetCode ?? DEFAULT_SET_CODE);
  const [pack, setPack] = useState<OpenedPackDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus>('checking');
  const [engineRetryKey, setEngineRetryKey] = useState(0);
  const [engineWaitSeconds, setEngineWaitSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>(persistedSession?.sessionStats ?? initialSessionStats);
  const [revealMode, setRevealMode] = useState<RevealMode>(persistedSession?.revealMode ?? 'all');
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CardDto | null>(null);
  const [hasCountedCurrentPack, setHasCountedCurrentPack] = useState(false);
  const [summaryPack, setSummaryPack] = useState<OpenedPackDto | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>(persistedSession?.activeView ?? 'opener');
  const [allPulledCards, setAllPulledCards] = useState<CardDto[]>(persistedSession?.allPulledCards ?? []);
  const [binderCards, setBinderCards] = useState<CardDto[]>(persistedSession?.binderCards ?? []);
  const [packHistory, setPackHistory] = useState<PackHistoryEntry[]>(persistedSession?.packHistory ?? []);
  const [boosterTypesBySetCode, setBoosterTypesBySetCode] = useState<Record<string, BoosterType>>(
    persistedSession?.boosterTypesBySetCode ?? {},
  );
  const [isOpeningWrapper, setIsOpeningWrapper] = useState(false);
  const [landingSetIndex, setLandingSetIndex] = useState(0);
  const [isFastMode, setIsFastMode] = useState(persistedSession?.isFastMode ?? false);
  const [chaseCardName, setChaseCardName] = useState(persistedSession?.chaseCardName ?? '');
  const [chaseHitCard, setChaseHitCard] = useState<CardDto | null>(null);

  useEffect(() => {
    preloadPackWrapperImages();
  }, []);

  useEffect(() => {
    if (engineStatus !== 'checking' && engineStatus !== 'waking') {
      setEngineWaitSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setEngineWaitSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [engineRetryKey, engineStatus]);

  useEffect(() => {
    savePersistedSession({
      activeView,
      allPulledCards,
      binderCards,
      boosterTypesBySetCode,
      chaseCardName,
      isFastMode,
      packHistory,
      revealMode,
      selectedSetCode,
      sessionStats,
    });
  }, [
    activeView,
    allPulledCards,
    binderCards,
    boosterTypesBySetCode,
    chaseCardName,
    isFastMode,
    packHistory,
    revealMode,
    selectedSetCode,
    sessionStats,
  ]);

  useEffect(() => {
    let ignore = false;
    let retryTimeoutId: number | undefined;

    async function loadSets() {
      setEngineStatus('checking');
      setError(null);

      try {
        await fetchApiHealth().catch(() => undefined);
        const supportedSets = await fetchSupportedSets();
        if (ignore) {
          return;
        }

        const hydratedSets = supportedSets.length > 0 ? supportedSets : FALLBACK_SUPPORTED_SETS;
        setSets(hydratedSets);
        if (hydratedSets.length > 0 && !hydratedSets.some((set) => set.setCode === selectedSetCode)) {
          setSelectedSetCode(hydratedSets[0].setCode);
        }
        setEngineStatus('ready');
      } catch (caughtError) {
        if (ignore) {
          return;
        }

        setSets((currentSets) => (currentSets.length > 0 ? currentSets : FALLBACK_SUPPORTED_SETS));
        setEngineStatus('waking');
        retryTimeoutId = window.setTimeout(() => {
          setEngineRetryKey((currentKey) => currentKey + 1);
        }, 15000);
      }
    }

    loadSets();

    return () => {
      ignore = true;
      if (retryTimeoutId) {
        window.clearTimeout(retryTimeoutId);
      }
    };
  }, [engineRetryKey]);

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

  useEffect(() => {
    if (engineStatus !== 'ready' || sets.length === 0) {
      return;
    }

    warmUpPack(selectedSetCode, selectedBoosterType).catch(() => {
      // Warmup is an opportunistic cache fill; opening the pack still handles real errors.
    });
  }, [engineStatus, selectedBoosterType, selectedSetCode, sets.length]);

  function resetCurrentPack() {
    setPack(null);
    setSummaryPack(null);
    setRevealPhase('idle');
    setRevealedCount(0);
    setHasCountedCurrentPack(false);
    setActiveView('opener');
    setChaseHitCard(null);
  }

  function resetSession() {
    clearPersistedSession();
    resetCurrentPack();
    setSessionStats(initialSessionStats);
    setAllPulledCards([]);
    setBinderCards([]);
    setPackHistory([]);
    setChaseCardName('');
    setChaseHitCard(null);
    setSelectedCard(null);
    setRevealMode('all');
    setIsFastMode(false);
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
    if (!isEngineReady) {
      return;
    }

    setIsLoading(true);
    setIsOpeningWrapper(!isFastMode);
    setError(null);
    setActiveView('opener');
    setPack(null);
    setSummaryPack(null);
    setChaseHitCard(null);
    setRevealPhase('idle');
    setRevealedCount(0);
    setHasCountedCurrentPack(false);

    try {
      const [openedPack] = await Promise.all([
        openPack(selectedSetCode, selectedBoosterType),
        delay(isFastMode ? 0 : 950),
      ]);
      setPack(openedPack);
      setRevealedCount(revealMode === 'all' ? openedPack.cards.length : isFastMode ? 1 : 0);
      setRevealPhase(revealMode === 'all' ? 'complete' : 'revealing');
      setHasCountedCurrentPack(revealMode === 'all');
      if (revealMode === 'all') {
        completePack(openedPack);
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
  const hasRevealedEveryCard = Boolean(pack && revealedCount >= pack.cards.length);
  const isRevealLocked = Boolean(
    pack && revealMode === 'one-by-one' && revealPhase === 'revealing' && !hasCountedCurrentPack,
  );
  const isPackControlLocked = isLoading || isOpeningWrapper || isRevealLocked;
  const isEngineReady = engineStatus === 'ready';
  const canStartOpeningFlow = sets.length > 0;
  const normalizedChaseName = chaseCardName.trim().toLowerCase();

  function completePack(openedPack: OpenedPackDto) {
    setSummaryPack(openedPack);
    setSessionStats((currentStats) => updateSessionStats(currentStats, openedPack, selectedBooster.msrpUsd));
    setAllPulledCards((currentCards) => [...openedPack.cards, ...currentCards]);
    setBinderCards((currentCards) => updateBinderCards(currentCards, openedPack));
    setPackHistory((currentHistory) => [
      createPackHistoryEntry(openedPack, selectedBoosterType, currentHistory.length + 1),
      ...currentHistory,
    ]);
    setHasCountedCurrentPack(true);

    const chasePull = findChaseCard(openedPack.cards, normalizedChaseName);
    if (chasePull) {
      setChaseHitCard(chasePull);
    }
  }

  function revealNextCard() {
    if (!pack || revealedCount >= pack.cards.length) {
      return;
    }

    setRevealedCount((count) => Math.min(count + 1, pack.cards.length));
  }

  function revealRemainingCards() {
    if (!pack) {
      return;
    }
    setRevealedCount(pack.cards.length);
  }

  function continueCompletedReveal() {
    if (!pack) {
      return;
    }
    setRevealPhase('complete');
    if (!hasCountedCurrentPack) {
      completePack(pack);
    }
  }

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
              {engineStatus !== 'ready' && (
                <div className="max-w-md self-center text-sm font-semibold text-stone-300">
                  <p>{getEngineStatusMessage(engineStatus, engineWaitSeconds)}</p>
                  {(engineStatus === 'waking' || engineWaitSeconds >= 8) && (
                    <button
                      className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-ember underline-offset-4 hover:underline"
                      onClick={() => setEngineRetryKey((currentKey) => currentKey + 1)}
                      type="button"
                    >
                      Check again
                    </button>
                  )}
                </div>
              )}
              {engineStatus === 'ready' && error && sets.length === 0 && (
                <p className="max-w-sm self-center text-sm font-semibold text-red-100">
                  Could not load supported sets. Try refreshing in a moment.
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
          isLoading={false}
          onBack={() => setAppStep('start')}
          onBoosterTypeChange={handleBoosterTypeChange}
          onContinue={() => setAppStep('open-pack')}
          onSelectedSetChange={handleSelectedSetChange}
          selectedSetCode={selectedSetCode}
          sets={sets}
        />
        {engineStatus === 'ready' && error && (
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
                        disabled={isPackControlLocked}
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
                    <label className="min-w-56 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      Chase cards
                      <input
                        className="mt-1 block w-full rounded-md border border-white/10 bg-stone-950 px-3 py-2 text-sm font-semibold normal-case tracking-normal text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
                        onChange={(event) => setChaseCardName(event.target.value)}
                        placeholder="Name or names"
                        type="text"
                        value={chaseCardName}
                      />
                    </label>
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
                    className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPackControlLocked}
                    onClick={() => setAppStep('select-set')}
                    type="button"
                  >
                    Change set
                  </button>
                  <button
                    className="rounded-md bg-ember px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:-translate-y-0.5 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    disabled={!isEngineReady || isLoading || isOpeningWrapper || isRevealLocked}
                    onClick={handleOpenPack}
                    type="button"
                  >
                    {isLoading
                      ? 'Opening...'
                      : isRevealLocked
                        ? 'Finish Reveal First'
                        : isEngineReady
                          ? 'Open Pack'
                          : 'Engine Waking'}
                  </button>
                </div>
              </div>

              {!isEngineReady && (
                <div className="mt-4 rounded-md border border-ember/25 bg-ember/10 px-4 py-3 text-sm font-semibold text-amber-100">
                  {getEngineStatusMessage(engineStatus, engineWaitSeconds)} You can choose a set now; pack opening unlocks when the engine responds.
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                <button
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${revealMode === 'all' ? 'bg-amethyst text-white' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
                  disabled={isLoading || isOpeningWrapper}
                  onClick={() => {
                    setRevealMode('all');
                    if (pack) {
                      setRevealedCount(pack.cards.length);
                      setRevealPhase('complete');
                      if (!hasCountedCurrentPack) {
                        completePack(pack);
                      }
                    }
                  }}
                  type="button"
                >
                  Reveal all
                </button>
                <button
                  className={`rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${revealMode === 'one-by-one' ? 'bg-amethyst text-white' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
                  disabled={isLoading || isOpeningWrapper}
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
                <label className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${isFastMode ? 'bg-emerald-400 text-stone-950' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'} ${isLoading || isOpeningWrapper ? 'cursor-not-allowed opacity-50' : ''}`}>
                  <input
                    checked={isFastMode}
                    className="h-4 w-4 accent-emerald-400"
                    disabled={isLoading || isOpeningWrapper}
                    onChange={(event) => setIsFastMode(event.target.checked)}
                    type="checkbox"
                  />
                  Quick Open
                </label>
                {revealMode === 'one-by-one' && pack && revealPhase === 'revealing' && (
                  <>
                    <button
                      className="rounded-md border border-ember/40 px-4 py-2 text-sm font-semibold text-ember transition hover:border-ember hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canAdvanceReveal}
                      onClick={() => {
                        if (revealedCount >= pack.cards.length) {
                          continueCompletedReveal();
                          return;
                        }
                        revealNextCard();
                      }}
                      type="button"
                    >
                      {hasRevealedEveryCard
                        ? 'Finish pack'
                        : revealedCount === 0
                          ? `Reveal first card (0/${pack.cards.length})`
                          : `Reveal next (${revealedCount}/${pack.cards.length})`}
                    </button>
                    {isFastMode && !hasRevealedEveryCard && (
                      <button
                        className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-stone-200 transition hover:border-white/35 hover:bg-white/10"
                        onClick={revealRemainingCards}
                        type="button"
                      >
                        Reveal remaining
                      </button>
                    )}
                    {hasRevealedEveryCard && !hasCountedCurrentPack && (
                      <p className="text-sm font-medium text-stone-400">
                        Finish this pack to add it to stats, binder, and history.
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {engineStatus === 'ready' && error && (
            <div className="mb-6 rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {chaseHitCard && (
            <div className="mb-6 rounded-md border border-emerald-300/50 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-100">
              Chase hit: {chaseHitCard.name} (${chaseHitCard.priceUsd.toFixed(2)})
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
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeView === 'history' ? 'bg-ember text-stone-950' : 'bg-white/[0.05] text-stone-300 hover:bg-white/10'}`}
              onClick={() => setActiveView('history')}
              type="button"
            >
              History
            </button>
          </div>

          {activeView === 'binder' ? (
            <BinderPage cards={allPulledCards} packHistory={packHistory} onSelectCard={setSelectedCard} />
          ) : activeView === 'history' ? (
            <PackHistoryPage entries={packHistory} onSelectCard={setSelectedCard} />
          ) : isOpeningWrapper ? (
            <section className="relative flex min-h-[28rem] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(244,184,96,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] px-6 py-10 shadow-card">
              <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent" />
              <div className="pack-wrapper-opening">
                <PackWrapper boosterType={selectedBoosterType} set={selectedSet} theme={selectedTheme} />
              </div>
            </section>
          ) : pack ? (
            isCinematicReveal ? (
              <CardRevealStack
                cards={displayedCards}
                isFastMode={isFastMode}
                onSelectCard={setSelectedCard}
                totalCards={pack.cards.length}
              />
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

function getEngineStatusMessage(engineStatus: EngineStatus, waitSeconds: number): string {
  if (engineStatus === 'ready') {
    return 'Pack engine ready.';
  }

  if (engineStatus === 'unavailable') {
    return 'The pack engine is unavailable right now.';
  }

  if (waitSeconds >= 30) {
    return 'Still waking the pack engine. Free hosting can take about a minute after inactivity.';
  }

  return 'Starting the pack engine. Free hosting can take about a minute after inactivity.';
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

function findChaseCard(cards: CardDto[], normalizedChaseName: string): CardDto | null {
  if (!normalizedChaseName) {
    return null;
  }

  const chaseNames = normalizedChaseName
    .split(/[,;\n]/)
    .map((name) => name.trim())
    .filter(Boolean);

  return cards.find((card) => {
    const normalizedCardName = card.name.toLowerCase();
    return chaseNames.some((chaseName) => (
      normalizedCardName === chaseName
      || normalizedCardName.includes(chaseName)
      || chaseName.includes(normalizedCardName)
    ));
  }) ?? null;
}

function createPackHistoryEntry(
  pack: OpenedPackDto,
  boosterType: BoosterType,
  packNumber: number,
): PackHistoryEntry {
  return {
    boosterType,
    cards: pack.cards,
    id: `${Date.now()}-${packNumber}`,
    openedAt: new Date().toISOString(),
    packNumber,
    setCode: pack.setCode,
    totalValueUsd: pack.totalValueUsd,
  };
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
