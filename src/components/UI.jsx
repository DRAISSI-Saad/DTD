import { AlertCircle, LoaderCircle } from 'lucide-react';

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-heading mb-7 flex flex-wrap items-end justify-between gap-4">
    <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-primary">{eyebrow}</p><h2 className="text-2xl font-bold tracking-tight md:text-[26px]">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}</div>
    {action}
  </div>;
}

export function Card({ children, className = '' }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Loading({ label = 'Chargement...' }) {
  return <div className="flex items-center gap-2 py-10 text-sm text-muted"><LoaderCircle size={18} className="animate-spin text-primary" />{label}</div>;
}

export function ErrorState({ error, retry }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
    <span className="flex items-center gap-2"><AlertCircle size={17} />{error}</span>{retry && <button className="text-xs font-bold underline" onClick={retry}>Réessayer</button>}
  </div>;
}

export function ProgressBar({ value = 0, color = 'bg-primary' }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, Number(value) || 0))}%` }} /></div>;
}

export function EmptyState({ title, text }) {
  return <div className="py-12 text-center"><div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-primary dark:bg-teal-950"><AlertCircle size={20} /></div><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted">{text}</p></div>;
}

export function Field({ label, className = '', ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><input className="input" {...props} /></label>;
}

export function SelectField({ label, children, className = '', ...props }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span><select className="input" {...props}>{children}</select></label>;
}
