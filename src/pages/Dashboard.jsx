import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Flame, Target } from 'lucide-react';
import { api } from '../api';
import { Card, EmptyState, ErrorState, Loading, ProgressBar } from '../components/UI';

const today = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = () => Promise.all([api('/plans/today'), api('/stats')])
    .then(([day, stats]) => setData({ day, stats })).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  if (error) return <ErrorState error={error} retry={() => { setError(''); load(); }} />;
  if (!data) return <Loading />;

  const { day, stats } = data;
  const next = day.blocks.find((block) => block.status === 'prevu' && block.block_type !== 'pause');
  const objectives = [day.plan?.objective_1, day.plan?.objective_2, day.plan?.objective_3].filter(Boolean);
  return <>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.12em] text-primary">VOTRE ESPACE DE RÉVISION</p><h2 className="text-2xl font-bold tracking-tight md:text-[26px]">Tableau de bord</h2><p className="mt-2 text-sm text-muted">Voici votre progression et les priorités du jour.</p></div>
      <div className="flex items-center gap-3"><span className="date-chip"><CalendarDays size={15} />{today}</span><Link to="/planning" className="button-primary">Consulter le planning <ArrowRight size={16} /></Link></div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Target} label="Chapitres terminés" value={`${stats.chapter_completion_rate}%`} sub={`${stats.completed_chapters} sur ${stats.total_chapters} chapitres`} color="metric-teal" />
      <Metric icon={CheckCircle2} label="Séances réalisées" value={`${stats.completion_rate}%`} sub={`${stats.completed_blocks} sessions accomplies`} color="metric-blue" />
      <Metric icon={BookOpen} label="Maîtrise moyenne" value={`${Math.round(stats.average_mastery)}%`} sub="Sur l'ensemble des chapitres" color="metric-violet" />
      <Metric icon={Flame} label="Matières suivies" value={stats.subjects.length} sub="Matières au programme" color="metric-amber" />
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <Card>
        <div className="mb-5 flex items-center justify-between"><div><p className="text-[11px] font-semibold tracking-wide text-muted">VOS PRIORITÉS</p><h3 className="mt-1 text-base font-semibold">Objectifs du jour</h3></div><Link to="/bilan" className="text-xs font-semibold text-primary">Préparer demain</Link></div>
        {objectives.length ? <div className="space-y-2.5">{objectives.map((objective, i) => <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50/80 p-3 dark:bg-slate-800/60"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white text-[11px] font-bold text-primary ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">0{i + 1}</span><span className="text-sm font-medium">{objective}</span></div>)}</div>
          : <EmptyState title="Aucun objectif défini" text="Générez un planning pour organiser votre journée." />}
        <div className="mt-6 flex items-center justify-between text-xs text-muted"><span>Progression du jour</span><span className="font-bold text-ink dark:text-white">{stats.completion_rate}%</span></div>
        <div className="mt-2"><ProgressBar value={stats.completion_rate} /></div>
      </Card>
      <Card className="relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-teal-50 dark:bg-teal-950/40" />
        <p className="relative text-[11px] font-semibold tracking-wide text-muted">PROCHAINE SÉANCE</p>
        <div className="relative mt-5 flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-primary dark:bg-teal-950"><Clock3 size={19} /></div><div><p className="text-sm font-semibold">{next ? next.chapter_title || 'Pause planifiée' : 'Aucune séance prévue'}</p><p className="mt-1 text-xs capitalize text-muted">{next ? `${next.start_time.slice(0, 5)} · ${next.block_type}` : 'Créez un planning pour définir la prochaine étape.'}</p></div></div>
        {day.plan && <div className="relative mt-6 rounded-lg bg-slate-50 p-3.5 dark:bg-slate-800/60"><p className="mb-1.5 text-xs font-semibold">Conseil du jour</p><p className="text-xs leading-5 text-muted">Une séance à la fois. Prévoyez une vraie pause entre deux blocs.</p></div>}
        <Link to="/planning" className="relative mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Ouvrir le planning <ArrowRight size={15} /></Link>
      </Card>
    </div>
    {day.blocks.length > 0 && <Card className="mt-6">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-muted">AU PROGRAMME</p><h3 className="mt-1 text-lg font-bold">Prochaines sessions</h3></div><Link to="/planning" className="text-xs font-bold text-primary">Tout voir</Link></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{day.blocks.filter((block) => block.block_type !== 'pause').slice(0, 3).map((block) => <div key={block.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800"><span className="text-xs font-bold text-primary">{block.start_time.slice(0, 5)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{block.chapter_title || 'Révision générale'}</p><p className="text-xs capitalize text-muted">{block.block_type}</p></div></div>)}</div>
    </Card>}
  </>;
}

function Metric({ icon: Icon, label, value, sub, color }) {
  return <Card className="metric-card !p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted">{label}</p><span className={`metric-icon ${color}`}><Icon size={17} strokeWidth={1.8} /></span></div><p className="mt-3 text-[26px] font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted">{sub}</p></Card>;
}
