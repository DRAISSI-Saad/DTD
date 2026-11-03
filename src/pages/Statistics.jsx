import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api';
import { Card, ErrorState, Loading, PageHeader } from '../components/UI';

const palette = ['#176b66', '#3275a8', '#8a6bb8', '#c18b3b', '#4b8c76', '#6b7f96'];

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const load = () => api('/stats').then(setStats).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  if (error) return <ErrorState error={error} retry={() => { setError(''); load(); }} />;
  if (!stats) return <Loading />;
  const completion = [
    { name: 'Faits', value: stats.completed_blocks },
    { name: 'À faire / sautés', value: Math.max(0, stats.total_blocks - stats.completed_blocks) }
  ];
  return <>
    <PageHeader eyebrow="VOIR TES PROGRÈS" title="Statistiques" description="Un aperçu simple de ta progression et de ta maîtrise par matière." />
    <div className="grid gap-4 sm:grid-cols-3">
      <Summary label="Maîtrise moyenne" value={`${Math.round(stats.average_mastery)}%`} />
      <Summary label="Chapitres terminés" value={`${stats.completed_chapters} / ${stats.total_chapters}`} />
      <Summary label="Blocs accomplis" value={`${stats.completed_blocks} / ${stats.total_blocks}`} />
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
      <Card><div className="mb-5"><p className="text-xs font-semibold text-muted">MAÎTRISE</p><h3 className="mt-1 font-bold">Progression par matière</h3></div>
        {stats.subjects.length ? <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.subjects} margin={{ top: 10, right: 12, left: -18, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" /><XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} /><Tooltip formatter={(value) => [`${value}%`, 'Maîtrise']} /><Bar dataKey="average_mastery" name="Maîtrise moyenne" fill="#176b66" radius={[5, 5, 0, 0]} maxBarSize={54} /></BarChart></ResponsiveContainer></div> : <NoData />}
      </Card>
      <Card><div className="mb-2"><p className="text-xs font-semibold text-muted">RÉGULARITÉ</p><h3 className="mt-1 font-bold">Sessions réalisées</h3></div>
        {stats.total_blocks ? <><div className="h-[245px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={completion} dataKey="value" nameKey="name" innerRadius={66} outerRadius={92} paddingAngle={4} stroke="none">{completion.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#19a987' : '#e8ebf3'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><p className="-mt-32 text-center text-2xl font-extrabold">{stats.completion_rate}%</p><p className="mt-16 text-center text-xs text-muted">Taux de sessions effectuées</p></> : <NoData />}
      </Card>
    </div>
    <Card className="mt-6"><div className="mb-4"><p className="text-xs font-semibold text-muted">DÉTAIL PAR MATIÈRE</p><h3 className="mt-1 font-bold">Maîtrise et chapitres</h3></div>
      {!stats.subjects.length ? <NoData /> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{stats.subjects.map((subject, index) => <div key={subject.subject} className="grid grid-cols-[1fr_auto] items-center gap-4 py-4"><div><div className="mb-2 flex justify-between gap-3"><span className="text-sm font-semibold">{subject.subject}</span><span className="text-xs text-muted">{subject.chapter_count} chapitre(s)</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full" style={{ width: `${subject.average_mastery || 0}%`, backgroundColor: palette[index % palette.length] }} /></div></div><span className="text-sm font-bold">{subject.average_mastery || 0}%</span></div>)}</div>}
    </Card>
  </>;
}

function Summary({ label, value }) { return <Card className="!p-5"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></Card>; }
function NoData() { return <div className="grid h-64 place-items-center text-sm text-muted">Ajoute des chapitres pour voir tes statistiques.</div>; }
