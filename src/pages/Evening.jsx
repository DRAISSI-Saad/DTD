import { useEffect, useState } from 'react';
import { CheckCheck, Sunrise } from 'lucide-react';
import { api } from '../api';
import { Card, ErrorState, Field, Loading, PageHeader } from '../components/UI';

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function Evening({ notify }) {
  const [todayPlan, setTodayPlan] = useState(null);
  const [tomorrowPlan, setTomorrowPlan] = useState(null);
  const [review, setReview] = useState('');
  const [tomorrow, setTomorrow] = useState(['', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const [todayResult, plansResult] = await Promise.all([api('/plans/today'), api('/daily-plans?limit=100')]);
      const next = plansResult.data.find((plan) => plan.plan_date === dateOffset(1)) || null;
      setTodayPlan(todayResult.plan); setTomorrowPlan(next);
      setReview(todayResult.plan?.evening_review || '');
      setTomorrow([next?.objective_1 || '', next?.objective_2 || '', next?.objective_3 || '']);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      if (todayPlan) await api(`/daily-plans/${todayPlan.id}`, { method: 'PUT', body: JSON.stringify({ evening_review: review }) });
      if (tomorrowPlan) {
        await api(`/daily-plans/${tomorrowPlan.id}`, { method: 'PUT', body: JSON.stringify({ objective_1: tomorrow[0], objective_2: tomorrow[1], objective_3: tomorrow[2] }) });
      } else if (tomorrow.some((value) => value.trim())) {
        const created = await api('/daily-plans', { method: 'POST', body: JSON.stringify({ plan_date: dateOffset(1), objective_1: tomorrow[0], objective_2: tomorrow[1], objective_3: tomorrow[2] }) });
        setTomorrowPlan(created);
      }
      notify('Bilan enregistré'); await load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };
  if (loading) return <Loading />;
  return <>
    <PageHeader eyebrow="PRENDRE DU RECUL" title="Bilan du soir" description="Célèbre tes avancées, note ce qui reste à travailler et prépare un lendemain plus serein." />
    {error && <div className="mb-5"><ErrorState error={error} retry={() => { setError(''); load(); }} /></div>}
    <form onSubmit={save} className="grid items-start gap-6 xl:grid-cols-2">
      <Card><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-primary dark:bg-teal-950"><CheckCheck size={19} /></span><div><h3 className="font-bold">Comment s'est passée ta journée ?</h3><p className="text-xs text-muted">Un bilan honnête, sans jugement.</p></div></div>
        {!todayPlan && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">Aucun planning n'a encore été créé pour aujourd'hui.</p>}
        <label className="block"><span className="mb-1.5 block text-xs font-semibold">Mes réussites, mes difficultés, ce que je retiens</span><textarea className="input min-h-52 resize-y" value={review} onChange={(e) => setReview(e.target.value)} placeholder="Qu'as-tu appris aujourd'hui ? Qu'est-ce qui mérite une autre session ?" /></label>
      </Card>
      <Card><div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950"><Sunrise size={19} /></span><div><h3 className="font-bold">Préparer demain</h3><p className="text-xs text-muted">{tomorrowPlan ? 'Les objectifs de demain sont déjà enregistrés.' : 'Définis jusqu’à trois priorités.'}</p></div></div>
        <div className="space-y-4">{tomorrow.map((value, index) => <Field key={index} label={`Priorité ${index + 1}`} maxLength="255" placeholder={['Ex. Finir le chapitre sur les fonctions', 'Ex. Faire une annale de physique', 'Ex. Revoir mes erreurs'][index]} value={value} onChange={(e) => setTomorrow((items) => items.map((item, i) => i === index ? e.target.value : item))} />)}</div>
        <p className="mt-4 text-xs text-muted">Les objectifs sont enregistrés pour le {new Date(`${dateOffset(1)}T12:00:00`).toLocaleDateString('fr-FR')}.</p>
        <button className="button-primary mt-6 w-full" disabled={saving}><CheckCheck size={16} />{saving ? 'Enregistrement...' : 'Enregistrer mon bilan'}</button>
      </Card>
    </form>
  </>;
}
