import { PackOpener } from './components/PackOpener';

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-stone-100">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(244,184,96,0.13),transparent_28%)]" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-ember">Bloomburrow</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              MTG Pack Simulator
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-300 sm:text-right">
            Open a live Scryfall-backed BLB pack with commons, uncommons, a rare or mythic, and a land.
          </p>
        </header>

        <PackOpener />
      </section>
    </main>
  );
}
