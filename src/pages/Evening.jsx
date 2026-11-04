import { useEffect, useState } from 'react';
import { CheckCheck, Sunrise } from 'lucide-react';
import { api } from '../api';
import { Card, ErrorState, Field, Loading, PageHeader } from '../components/UI';

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function previousMonthRange() {
  const current = new Date();
  const firstOfCurrentMonth = new Date(current.getFullYear(), current.getMonth(), 1, 12);
  const lastOfPreviousMonth = new Date(firstOfCurrentMonth);
  lastOfPreviousMonth.setDate(0);
  const firstOfPreviousMonth = new Date(lastOfPreviousMonth.getFullYear(), lastOfPreviousMonth.getMonth(), 1, 12);
  return {
    start: `${firstOfPreviousMonth.getFullYear()}-${String(firstOfPreviousMonth.getMonth() + 1).padStart(2, '0')}-01`,
    end: `${lastOfPreviousMonth.getFullYear()}-${String(lastOfPreviousMonth.getMonth() + 1).padStart(2, '0')}-${String(lastOfPreviousMonth.getDate()).padStart(2, '0')}`
  };
}

function displayDate(value) {
  return new Date(`${String(value).slice(0, 10)}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export default function Evening({ notify }) {
  const [todayPlan, setTodayPlan] = useState(null);
  const [tomorrowPlan, setTomorrowPlan] = useState(null);
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [monthlyErrors, setMonthlyErrors] = useState([]);
  const [review, setReview] = useState('');
  const [tomorrow, setTomorrow] = useState(['', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const [todayResult, plansResult, errorsResult] = await Promise.all([
        api('/plans/today'),
        api('/daily-plans?limit=100'),
        api('/error-notebook?limit=100')
      ]);
      if (!Array.isArray(plansResult?.data) || !Array.isArray(errorsResult?.data)) {
        throw new Error('Les données du bilan mensuel sont incomplètes. Actualise la page et réessaie.');
      }
      const next = plansResult.data.find((plan) => plan.plan_date === dateOffset(1)) || null;
      const previousMonth = previousMonthRange();
      setTodayPlan(todayResult.plan); setTomorrowPlan(next);
      setReview(todayResult.plan?.evening_review || '');
      setTomorrow([next?.objective_1 || '', next?.objective_2 || '', next?.objective_3 || '']);
      setMonthlyPlans(plansResult.data
        .filter((plan) => plan.plan_date >= previousMonth.start && plan.plan_date <= previousMonth.end)
        .sort((a, b) => b.plan_date.localeCompare(a.plan_date)));
      setMonthlyErrors(errorsResult.data
        .filter((item) => {
          const createdDate = String(item.created_at || '').slice(0, 10);
          return createdDate >= previousMonth.start && createdDate <= previousMonth.end;
        })
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))));
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
    <section className="mt-8">
      <div className="mb-4"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-primary">VOTRE ACTIVITÉ RÉCENTE</p><h2 className="mt-1 text-lg font-bold">Récapitulatif du mois précédent</h2><p className="mt-1 text-sm text-muted">Bilans quotidiens et erreurs conservés dans les données de démonstration.</p></div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-muted">BILAN QUOTIDIEN</p><h3 className="mt-1 font-bold">Journées de révision</h3></div><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-primary dark:bg-teal-950">{monthlyPlans.length} jours</span></div>
          {!monthlyPlans.length ? <p className="py-5 text-sm text-muted">Aucun bilan enregistré sur cette période.</p> : <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {monthlyPlans.map((plan) => {
              const objectives = [plan.objective_1, plan.objective_2, plan.objective_3].filter(Boolean);
              return <article key={plan.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3"><h4 className="text-sm font-semibold capitalize">{displayDate(plan.plan_date)}</h4><span className="text-[10px] text-muted">{objectives.length} objectif(s)</span></div>
                {objectives.length > 0 && <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted">{objectives.map((objective, index) => <li key={`${plan.id}-${index}`}>{objective}</li>)}</ul>}
                <p className="mt-2 text-xs leading-5 text-ink dark:text-slate-300">{plan.evening_review || 'Journée planifiée ; bilan du soir non renseigné.'}</p>
              </article>;
            })}
          </div>}
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-muted">CARNET D’ERREURS</p><h3 className="mt-1 font-bold">Points à retravailler</h3></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">{monthlyErrors.length} erreurs</span></div>
          {!monthlyErrors.length ? <p className="py-5 text-sm text-muted">Aucune erreur enregistrée sur cette période.</p> : <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {monthlyErrors.map((item) => <article key={item.id} className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] font-semibold text-primary">{item.subject || 'Module'} · {item.chapter_title || 'Chapitre'}</p><time className="text-[10px] text-muted">{displayDate(item.created_at)}</time></div>
              <p className="mt-2 text-sm font-semibold">{item.error_description}</p>
              {item.correction && <p className="mt-1 text-xs leading-5 text-muted">Correction : {item.correction}</p>}
              <p className="mt-2 text-[10px] text-muted">{item.review_count || 0} révision(s) · Prochaine : {displayDate(item.next_review_date)}</p>
            </article>)}
          </div>}
        </Card>
      </div>
    </section>
  </>;
}
