import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  clearAuthSession,
  loadAuthSession,
  logoutAuthSession,
  submitAuthRequest,
  type AuthMode,
  type AuthSession,
} from './api/authApi';
import { PackOpener } from './components/PackOpener';
import type { AppStep } from './components/PackOpener';

export default function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => loadAuthSession());
  const [isAuthPanelOpen, setIsAuthPanelOpen] = useState(false);
  const [appStep, setAppStep] = useState<AppStep>('start');

  return (
    <main className="min-h-screen overflow-hidden bg-ink text-stone-100">
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(244,184,96,0.13),transparent_28%)]" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <button
              className="text-left transition hover:text-ember focus:outline-none"
              onClick={() => setAppStep('start')}
              type="button"
            >
              <h1 className="text-4xl font-bold tracking-tight text-white transition hover:text-ember sm:text-5xl">
                PackBloom
              </h1>
            </button>
            <p className="mt-2 text-sm font-semibold text-stone-400">
              A Magic: The Gathering Pack Simulator
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end sm:pt-2">
            <p className="text-xs font-semibold text-stone-300 sm:text-right">
              Built by Jameson Gibbs |{' '}
              <a
                className="text-ember underline-offset-4 transition hover:text-yellow-300 hover:underline"
                href="https://github.com/jgibbs24/PackBloom"
                rel="noreferrer"
                target="_blank"
              >
                jgibbs24/PackBloom
              </a>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {authSession ? (
                <>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-stone-200">
                    {authSession.user.displayName}
                  </span>
                  <button
                    className="rounded-md border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-200 transition hover:border-ember hover:text-ember"
                    onClick={() => {
                      logoutAuthSession().finally(() => {
                        clearAuthSession();
                        setAuthSession(null);
                      });
                    }}
                    type="button"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  className="rounded-md border border-ember/35 bg-ember/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-ember transition hover:border-ember hover:bg-ember/15"
                  onClick={() => setIsAuthPanelOpen(true)}
                  type="button"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        <PackOpener appStep={appStep} authSession={authSession} setAppStep={setAppStep} />
      </section>
      {isAuthPanelOpen && (
        <AuthPanel
          onClose={() => setIsAuthPanelOpen(false)}
          onSignedIn={(session) => {
            setAuthSession(session);
            setIsAuthPanelOpen(false);
          }}
        />
      )}
    </main>
  );
}

function AuthPanel({
  onClose,
  onSignedIn,
}: {
  onClose: () => void;
  onSignedIn: (session: AuthSession) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await submitAuthRequest({
        displayName,
        email,
        mode,
        password,
      });
      onSignedIn(session);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-stone-950 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-ember">PackBloom account</p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </h2>
          </div>
          <button
            className="rounded-md border border-white/15 px-3 py-2 text-sm font-bold text-stone-300 transition hover:border-ember hover:text-ember"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-white/[0.04] p-1">
          <button
            className={`rounded px-3 py-2 text-sm font-bold transition ${mode === 'login' ? 'bg-ember text-stone-950' : 'text-stone-300 hover:bg-white/10'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={`rounded px-3 py-2 text-sm font-bold transition ${mode === 'register' ? 'bg-ember text-stone-950' : 'text-stone-300 hover:bg-white/10'}`}
            onClick={() => setMode('register')}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Display name</span>
              <input
                className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
                maxLength={80}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Jameson"
                value={displayName}
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Email</span>
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-stone-600 focus:border-ember"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={password}
            />
          </label>
          {error && (
            <div className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-100">
              {error}
            </div>
          )}
          <button
            className="w-full rounded-md bg-ember px-4 py-3 text-sm font-bold uppercase tracking-[0.18em] text-stone-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
