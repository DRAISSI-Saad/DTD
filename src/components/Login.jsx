import { useState } from 'react';
import { GraduationCap, LockKeyhole } from 'lucide-react';

export default function Login({ onLogin, onRegister, error, checking, onRetry }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (mode === 'register' && password !== confirmation) return;
    setBusy(true);
    try {
      await (mode === 'register' ? onRegister : onLogin)(username, password);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-10 text-ink dark:bg-slate-950 dark:text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="brand-icon"><GraduationCap size={20} strokeWidth={2} /></div>
          <div>
            <p className="text-xl font-bold tracking-tight">TDT<span className="text-primary">.</span></p>
            <p className="text-xs text-muted">Espace personnel sécurisé</p>
          </div>
        </div>
        <div className="mb-6">
          <span className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary"><LockKeyhole size={20} /></span>
          <h1 className="text-2xl font-bold tracking-tight">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {mode === 'login'
              ? 'Connecte-toi pour accéder à ton planning et à tes données.'
              : 'Tes données d’étude seront privées et liées à ton compte.'}
          </p>
        </div>
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">{error}</p>}
        {checking ? (
          <button type="button" className="button-primary w-full justify-center" onClick={onRetry}>Réessayer la connexion</button>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Nom d’utilisateur
              <input
                autoComplete="username"
                required
                minLength={mode === 'register' ? 3 : undefined}
                maxLength={32}
                pattern={mode === 'register' ? '[a-zA-Z0-9._-]+' : undefined}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950"
              />
              {mode === 'register' && <span className="mt-1 block text-xs text-muted">3 à 32 caractères : lettres, chiffres, point, tiret ou soulignement.</span>}
            </label>
            <label className="block text-sm font-medium">
              Mot de passe
              <input
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                maxLength={256}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950"
              />
              {mode === 'register' && <span className="mt-1 block text-xs text-muted">Choisis un mot de passe difficile à deviner.</span>}
            </label>
            {mode === 'register' && (
              <label className="block text-sm font-medium">
                Confirmer le mot de passe
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950"
                />
                {confirmation && password !== confirmation && <span className="mt-1 block text-xs text-red-600">Les mots de passe ne correspondent pas.</span>}
              </label>
            )}
            <button type="submit" disabled={busy} className="button-primary w-full justify-center disabled:cursor-wait disabled:opacity-60">
              {busy ? 'Patiente…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
          </form>
        )}
        {!checking && (
          <p className="mt-5 text-center text-sm text-muted">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Tu as déjà un compte ?'}{' '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setPassword(''); setConfirmation(''); }}
              className="font-semibold text-primary hover:underline"
            >
              {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
            </button>
          </p>
        )}
      </section>
    </main>
  );
}
