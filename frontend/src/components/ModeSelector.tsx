import type { AppMode } from './PackOpener';

type ModeSelectorProps = {
  onBack: () => void;
  onSelectMode: (mode: AppMode) => void;
};

const modes: Array<{
  background: string;
  description: string;
  eyebrow: string;
  mode: AppMode;
  title: string;
  visual: 'collection' | 'versus';
}> = [
  {
    background:
      'linear-gradient(135deg, rgba(38,54,38,0.92), rgba(16,15,24,0.92) 48%, rgba(0,0,0,0.54)), linear-gradient(90deg, rgba(244,184,96,0.14), transparent 62%)',
    description: 'Crack packs, chase hits, and grow your collection.',
    eyebrow: 'Classic',
    mode: 'opener',
    title: 'Open Packs',
    visual: 'collection',
  },
  {
    background:
      'linear-gradient(135deg, rgba(61,28,36,0.88), rgba(16,15,24,0.92) 48%, rgba(24,37,56,0.86)), linear-gradient(90deg, rgba(244,184,96,0.12), transparent 62%)',
    description: 'Face off against a friend and see who comes out on top.',
    eyebrow: 'Versus',
    mode: 'battle',
    title: 'Pack Battle',
    visual: 'versus',
  },
];

export function ModeSelector({ onBack, onSelectMode }: ModeSelectorProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
      <div className="mb-6 flex items-start gap-4">
        <button
          className="rounded-md border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-white/35 hover:bg-white/10"
          onClick={onBack}
          type="button"
        >
          Back
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Choose Mode</h2>
        </div>
      </div>

      <div className="grid flex-1 gap-5 md:grid-cols-2">
        {modes.map((mode) => (
          <button
            className="group relative min-h-[20rem] overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] p-6 text-left shadow-card transition hover:-translate-y-1 hover:border-ember hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-ember/70"
            key={mode.mode}
            onClick={() => onSelectMode(mode.mode)}
            style={{ background: mode.background }}
            type="button"
          >
            <div className="absolute inset-4 rounded-[0.35rem] border border-white/[0.07]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0_24%,rgba(255,255,255,0.09)_24.2%,transparent_24.7%),linear-gradient(90deg,transparent_0_63%,rgba(255,255,255,0.08)_63.2%,transparent_63.7%),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,100%_5rem] opacity-60" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0_28%,rgba(255,255,255,0.16)_38%,transparent_49%),repeating-linear-gradient(135deg,rgba(255,255,255,0.07)_0_1px,transparent_1px_18px)] opacity-25 transition group-hover:opacity-45" />
            <div className="absolute left-6 top-6 h-12 w-12 border-l border-t border-ember/45" />
            <div className="absolute bottom-6 right-6 h-16 w-16 border-b border-r border-ember/40" />
            <ModeCardVisual visual={mode.visual} />
            <div className="relative z-10 flex min-h-[17rem] flex-col">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">{mode.eyebrow}</p>
              <h3 className="mt-3 text-3xl font-black text-white">{mode.title}</h3>
              <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-stone-300">{mode.description}</p>
              <span className="mt-auto inline-flex w-fit rounded-md bg-ember px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-stone-950 transition group-hover:bg-yellow-300">
                Select
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ModeCardVisual({ visual }: { visual: 'collection' | 'versus' }) {
  if (visual === 'collection') {
    return (
      <div aria-hidden="true" className="absolute bottom-9 right-8 h-36 w-44 opacity-75 transition group-hover:opacity-95">
        {[0, 1, 2, 3].map((index) => (
          <div
            className="absolute h-24 w-16 rounded border border-white/15 bg-stone-950/70 shadow-card"
            key={index}
            style={{
              left: `${index * 1.9}rem`,
              top: `${index % 2 === 0 ? 1.3 : 0.4}rem`,
              transform: `rotate(${[-10, -3, 5, 12][index]}deg)`,
            }}
          >
            <div className="m-1 h-12 rounded-sm bg-[linear-gradient(135deg,rgba(244,184,96,0.44),rgba(72,187,120,0.22),rgba(124,58,237,0.24))]" />
            <div className="mx-2 mt-2 h-1.5 rounded bg-white/25" />
            <div className="mx-2 mt-1.5 h-1 rounded bg-white/15" />
          </div>
        ))}
        <div className="absolute bottom-0 left-3 right-2 h-9 rounded border border-ember/35 bg-black/35" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="absolute bottom-8 right-8 h-40 w-48 opacity-80 transition group-hover:opacity-100">
      <div className="absolute bottom-0 left-1 h-28 w-20 -rotate-6 rounded-lg border border-red-200/20 bg-red-500/15 shadow-card" />
      <div className="absolute bottom-0 right-1 h-28 w-20 rotate-6 rounded-lg border border-blue-200/20 bg-blue-500/15 shadow-card" />
      <div className="absolute left-7 top-6 h-12 w-12 rounded-full border border-red-100/30 bg-stone-950/70" />
      <div className="absolute right-7 top-6 h-12 w-12 rounded-full border border-blue-100/30 bg-stone-950/70" />
      <div className="absolute left-4 top-20 h-16 w-20 rounded-t-full border border-red-100/25 bg-stone-950/65" />
      <div className="absolute right-4 top-20 h-16 w-20 rounded-t-full border border-blue-100/25 bg-stone-950/65" />
      <div className="absolute left-1/2 top-14 -translate-x-1/2 rounded-md border border-ember/50 bg-stone-950/85 px-3 py-2 text-2xl font-black tracking-[0.08em] text-ember shadow-card">
        VS
      </div>
    </div>
  );
}
