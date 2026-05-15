import { PackOpener } from './components/PackOpener';

export default function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-ink text-stone-100">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(244,184,96,0.13),transparent_28%)]" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              PackBloom
            </h1>
            <p className="mt-2 text-sm font-semibold text-stone-400">
              A Magic: The Gathering Pack Simulator
            </p>
          </div>
          <p className="text-xs font-semibold text-stone-300 sm:pt-2 sm:text-right">
            Built by Jameson Gibbs |{' '}
            <a
              className="text-ember underline-offset-4 transition hover:text-yellow-300 hover:underline"
              href="https://github.com/jgibbs24"
              rel="noreferrer"
              target="_blank"
            >
              https://github.com/jgibbs24
            </a>
          </p>
        </header>

        <PackOpener />
      </section>
    </main>
  );
}
