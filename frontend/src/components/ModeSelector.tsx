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
}> = [
  {
    background:
      'linear-gradient(135deg, rgba(244,184,96,0.18), rgba(255,255,255,0.035) 42%, rgba(0,0,0,0.44)), linear-gradient(90deg, rgba(244,184,96,0.20), transparent 58%)',
    description: 'Crack packs, chase hits, and grow your collection.',
    eyebrow: 'Classic',
    mode: 'opener',
    title: 'Open Packs',
  },
  {
    background:
      'linear-gradient(135deg, rgba(104,64,165,0.24), rgba(255,255,255,0.04) 42%, rgba(0,0,0,0.44)), linear-gradient(90deg, rgba(244,184,96,0.16), transparent 58%)',
    description: 'Face off against a friend and see who comes out on top.',
    eyebrow: 'Versus',
    mode: 'battle',
    title: 'Pack Battle',
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
