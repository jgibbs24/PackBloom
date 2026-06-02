import type { AppMode } from './PackOpener';

type ModeSelectorProps = {
  onBack: () => void;
  onSelectMode: (mode: AppMode) => void;
};

const modes: Array<{
  description: string;
  eyebrow: string;
  mode: AppMode;
  title: string;
}> = [
  {
    description: 'Open packs, reveal pulls, and build your binder session.',
    eyebrow: 'Classic',
    mode: 'opener',
    title: 'Open Packs',
  },
  {
    description: 'Crack two packs side by side and let total value decide the winner.',
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
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember">Choose mode</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Pick Your Run</h2>
        </div>
      </div>

      <div className="grid flex-1 gap-5 md:grid-cols-2">
        {modes.map((mode) => (
          <button
            className="group rounded-lg border border-white/10 bg-white/[0.035] p-6 text-left shadow-card transition hover:-translate-y-1 hover:border-ember hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-ember/70"
            key={mode.mode}
            onClick={() => onSelectMode(mode.mode)}
            type="button"
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">{mode.eyebrow}</p>
            <h3 className="mt-3 text-3xl font-black text-white">{mode.title}</h3>
            <p className="mt-4 max-w-md text-sm font-semibold leading-6 text-stone-400">{mode.description}</p>
            <span className="mt-8 inline-flex rounded-md bg-ember px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-stone-950 transition group-hover:bg-yellow-300">
              Select
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
