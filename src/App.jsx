import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  BookOpen, CalendarDays, ChartNoAxesCombined, ChartNoAxesGantt, CheckCheck, CircleAlert,
  GraduationCap, LayoutDashboard, Moon, Sun, Menu, X, ArrowUpRight, LogOut
} from 'lucide-react';
import { api, apiBase, clearAuthToken, getAuthToken, setAuthToken } from './api';
import Login from './components/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Planning from './pages/Planning.jsx';
import Subjects from './pages/Subjects.jsx';
import Errors from './pages/Errors.jsx';
import Evening from './pages/Evening.jsx';
import Statistics from './pages/Statistics.jsx';
import History from './pages/History.jsx';

const links = [
  { to: '/', label: 'Vue d’ensemble', icon: LayoutDashboard, end: true, group: 'GESTION' },
  { to: '/planning', label: 'Planning', icon: CalendarDays, group: 'GESTION' },
  { to: '/matieres', label: 'Matières & chapitres', icon: BookOpen, group: 'PROGRAMME' },
  { to: '/erreurs', label: "Carnet d'erreurs", icon: CircleAlert, group: 'PROGRAMME' },
  { to: '/bilan', label: 'Bilan quotidien', icon: CheckCheck, group: 'SUIVI' },
  { to: '/statistiques', label: 'Statistiques', icon: ChartNoAxesCombined, group: 'SUIVI' },
  { to: '/historique', label: 'Historique des séances', icon: ChartNoAxesGantt, group: 'SUIVI' }
];
const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState(() => getAuthToken() ? 'checking' : 'unauthenticated');
  const [authError, setAuthError] = useState('');
  const location = useLocation();

  const notify = useCallback((message, kind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    if (authStatus !== 'checking') return undefined;
    const token = getAuthToken();
    if (!token) {
      setAuthStatus('unauthenticated');
      return undefined;
    }
    let active = true;
    api('/auth/me')
      .then(() => active && setAuthStatus('authenticated'))
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          clearAuthToken();
          setAuthStatus('unauthenticated');
        } else {
          setAuthError('Impossible de joindre le serveur. Vérifie que le backend est démarré.');
          setAuthStatus('error');
        }
      });
    return () => { active = false; };
  }, [authStatus]);

  useEffect(() => {
    const onUnauthorized = () => {
      setAuthError('Ta session a expiré. Connecte-toi à nouveau.');
      setAuthStatus('unauthenticated');
    };
    window.addEventListener('tdt:unauthorized', onUnauthorized);
    return () => window.removeEventListener('tdt:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') return undefined;
    const controller = new AbortController();
    let retryTimer;

    async function streamEvents() {
      while (!controller.signal.aborted) {
        try {
          const response = await fetch(`${apiBase}/events`, {
            headers: { Authorization: `Bearer ${getAuthToken()}`, Accept: 'text/event-stream' },
            signal: controller.signal
          });
          if (response.status === 401) {
            clearAuthToken();
            window.dispatchEvent(new Event('tdt:unauthorized'));
            return;
          }
          if (!response.ok || !response.body) throw new Error(`Flux temps réel indisponible (HTTP ${response.status}).`);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!controller.signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
            let separator;
            while ((separator = buffer.indexOf('\n\n')) !== -1) {
              const message = buffer.slice(0, separator);
              buffer = buffer.slice(separator + 2);
              const eventName = message.split('\n').find((line) => line.startsWith('event:'))?.slice(6).trim();
              const data = message.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim();
              if (eventName === 'activity' && data) {
                const activity = JSON.parse(data);
                const labels = { INSERT: 'ajouté', UPDATE: 'mis à jour', DELETE: 'supprimé' };
                const table = activity.table_name.replaceAll('_', ' ');
                notify(`${table} ${labels[activity.action] || 'modifié'}`);
              }
            }
          }
        } catch (error) {
          if (controller.signal.aborted) return;
          console.error(error);
        }
        await new Promise((resolve) => {
          retryTimer = window.setTimeout(resolve, 3000);
        });
      }
    }

    streamEvents();
    return () => {
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [authStatus, notify]);

  async function handleLogin(username, password) {
    setAuthError('');
    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      setAuthToken(result.token);
      setAuthStatus('authenticated');
    } catch (error) {
      setAuthError(error.message === 'Failed to fetch'
        ? 'Impossible de joindre le serveur. Vérifie que le backend est démarré.'
        : error.message);
    }
  }

  async function handleLogout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error(error);
    } finally {
      clearAuthToken();
      setAuthError('');
      setAuthStatus('unauthenticated');
    }
  }

  function retryAuth() {
    setAuthError('');
    if (getAuthToken()) setAuthStatus('checking');
    else setAuthStatus('unauthenticated');
  }

  if (authStatus === 'checking') {
    return <Login checking error="Vérification de la connexion au serveur…" onRetry={retryAuth} />;
  }
  if (authStatus === 'error') {
    return <Login checking error={authError} onRetry={retryAuth} />;
  }
  if (authStatus === 'unauthenticated') {
    return <Login onLogin={handleLogin} error={authError} />;
  }

  const pageTitle = links.find((link) => link.to === location.pathname)?.label || 'TDT';

  return (
    <div className="app-shell min-h-screen bg-canvas text-ink transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-icon"><GraduationCap size={20} strokeWidth={2} /></div>
          <div><p className="text-[17px] font-bold tracking-tight">TDT<span className="text-primary">.</span></p><p className="text-[10px] font-medium tracking-wide text-muted">PILOTAGE DES RÉVISIONS</p></div>
          <button className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu"><X size={18} /></button>
        </div>
        <div className="workspace-switcher">
          <span className="workspace-avatar"><BookOpen size={15} /></span>
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">Espace personnel</span><span className="mt-0.5 block text-[10px] text-muted">Préparation d’examens</span></span>
          <ArrowUpRight size={14} className="text-slate-400" />
        </div>
        <nav className="sidebar-nav">
          {['GESTION', 'PROGRAMME', 'SUIVI'].map((group) => (
            <div className="nav-group" key={group}>
              <p className="nav-group-label">{group}</p>
              <div className="space-y-1">
                {links.filter((link) => link.group === group).map(({ to, label, icon: Icon, end }) => (
                  <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>
                    <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="footer-mark"><CheckCheck size={15} /></span>
          <span><span className="block text-xs font-semibold">Votre rythme, vos objectifs.</span><span className="mt-1 block text-[10px] text-muted">Un suivi clair, jour après jour.</span></span>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[260px]">
        <header className="topbar sticky top-0 z-20 flex h-[68px] items-center justify-between px-5 md:px-9">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-button lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu"><Menu size={18} /></button>
            <div className="hidden items-center gap-2 text-xs text-muted sm:flex"><span>TDT</span><span className="text-slate-300">/</span><span className="font-semibold text-ink dark:text-slate-200">{pageTitle}</span></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="topbar-date hidden sm:inline-flex">{today}</span>
            <span className="topbar-divider hidden sm:block" />
            <button className="icon-button" onClick={() => setDark((value) => !value)} aria-label={dark ? 'Activer le thème clair' : 'Activer le thème sombre'} title={dark ? 'Activer le thème clair' : 'Activer le thème sombre'}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="icon-button" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut size={17} />
            </button>
            <span className="profile-chip" title="Espace personnel">É</span>
          </div>
        </header>
        <main className="app-content mx-auto max-w-[1440px] px-5 py-7 md:px-9 md:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/planning" element={<Planning notify={notify} />} />
            <Route path="/matieres" element={<Subjects notify={notify} />} />
            <Route path="/erreurs" element={<Errors notify={notify} />} />
            <Route path="/bilan" element={<Evening notify={notify} />} />
            <Route path="/statistiques" element={<Statistics />} />
            <Route path="/historique" element={<History />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>

      {menuOpen && <button className="mobile-backdrop fixed inset-0 z-30 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => <div key={toast.id} className={`toast ${toast.kind === 'error' ? 'toast-error' : ''}`}><span className="toast-dot" />{toast.message}</div>)}
      </div>
    </div>
  );
}
