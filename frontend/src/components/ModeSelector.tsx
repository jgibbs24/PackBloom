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
      'radial-gradient(circle at 18% 20%, rgba(244,184,96,0.28), transparent 28%), radial-gradient(circle at 82% 72%, rgba(139,92,246,0.22), transparent 30%), linear-gradient(135deg, rgba(244,184,96,0.10), rgba(255,255,255,0.035) 45%, rgba(0,0,0,0.35))',
    description: 'Crack packs, chase hits, and grow your collection.',
    eyebrow: 'Classic',
    mode: 'opener',
    title: 'Open Packs',
  },
  {
    background:
      'radial-gradient(circle at 22% 75%, rgba(248,113,113,0.22), transparent 30%), radial-gradient(circle at 82% 18%, rgba(96,165,250,0.24), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.04), rgba(244,184,96,0.10) 48%, rgba(0,0,0,0.36))',
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
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.10),transparent_34%,rgba(0,0,0,0.24)_72%)] opacity-80" />
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/10" />
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
