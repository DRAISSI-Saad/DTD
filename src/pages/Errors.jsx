import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, RotateCw } from 'lucide-react';
import { api } from '../api';
import { Card, EmptyState, ErrorState, Field, Loading, PageHeader, SelectField } from '../components/UI';

export default function Errors({ notify }) {
  const [chapters, setChapters] = useState([]);
  const [errors, setErrors] = useState([]);
  const [due, setDue] = useState([]);
  const [form, setForm] = useState({ chapter_id: '', error_description: '', correction: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => Promise.all([api('/chapters?limit=100'), api('/error-notebook?limit=100'), api('/errors/due')])
    .then(([c, e, d]) => { setChapters(c.data); setErrors(e.data); setDue(d); setForm((v) => ({ ...v, chapter_id: v.chapter_id || String(c.data[0]?.id || '') })); })
    .catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const addError = async (event) => {
    event.preventDefault(); setError('');
    try { await api('/error-notebook', { method: 'POST', body: JSON.stringify({ ...form, chapter_id: Number(form.chapter_id) }) }); setForm((v) => ({ ...v, error_description: '', correction: '' })); await load(); notify('Erreur ajoutée au carnet'); }
    catch (e) { setError(e.message); }
  };
  const review = async (item) => {
    try { await api(`/error-notebook/${item.id}`, { method: 'PUT', body: JSON.stringify({ review_count: item.review_count + 1 }) }); await load(); notify('Révision enregistrée — prochaine échéance mise à jour'); }
    catch (e) { setError(e.message); }
  };
  if (loading) return <Loading />;
  return <>
    <PageHeader eyebrow="APPRENDRE DE SES ERREURS" title="Carnet d'erreurs" description="Note ce qui t'a bloqué, comprends la correction et revois-la selon un rythme espacé." />
    {error && <div className="mb-5"><ErrorState error={error} retry={() => { setError(''); load(); }} /></div>}
    <div className="grid items-start gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <Card><div className="mb-5 flex items-center gap-2"><Plus size={18} className="text-primary" /><h3 className="font-bold">Noter une erreur</h3></div>
        {chapters.length ? <form className="space-y-4" onSubmit={addError}><SelectField label="Chapitre" required value={form.chapter_id} onChange={(e) => setForm({ ...form, chapter_id: e.target.value })}>{chapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</SelectField><label className="block"><span className="mb-1.5 block text-xs font-semibold">Ce qui m'a posé problème</span><textarea className="input min-h-24 resize-y" required value={form.error_description} onChange={(e) => setForm({ ...form, error_description: e.target.value })} placeholder="Décris ton erreur ou ton raisonnement..." /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold">Correction / méthode</span><textarea className="input min-h-24 resize-y" value={form.correction} onChange={(e) => setForm({ ...form, correction: e.target.value })} placeholder="Quelle est la bonne démarche ?" /></label><button className="button-primary w-full"><Plus size={16} /> Enregistrer l'erreur</button></form> : <EmptyState title="Aucun chapitre disponible" text="Ajoute une matière et un chapitre d'abord." />}
      </Card>
      <div className="space-y-6">
        <Card><div className="mb-4 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /><div><h3 className="font-bold">À revoir aujourd'hui</h3><p className="text-xs text-muted">Répétition espacée : J+1, J+3, puis J+7</p></div><span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 dark:bg-amber-950">{due.length}</span></div>
          {!due.length ? <p className="py-5 text-center text-sm text-muted">Aucune révision due, bravo !</p> : <div className="space-y-3">{due.map((item) => <ErrorItem key={item.id} item={item} due onReview={() => review(item)} />)}</div>}
        </Card>
        <Card><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold text-muted">TA MÉMOIRE EXTERNE</p><h3 className="mt-1 font-bold">Toutes les erreurs</h3></div><span className="text-xs text-muted">{errors.length} entrée(s)</span></div>
          {!errors.length ? <EmptyState title="Ton carnet est vide" text="Ajoute ta première erreur après un exercice." /> : <div className="space-y-3">{errors.map((item) => <ErrorItem key={item.id} item={item} />)}</div>}
        </Card>
      </div>
    </div>
  </>;
}

function ErrorItem({ item, due, onReview }) {
  return <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold text-primary">{item.subject} · {item.chapter_title}</p><p className="mt-1 text-sm font-semibold">{item.error_description}</p>{item.correction && <p className="mt-2 text-xs leading-5 text-muted">↳ {item.correction}</p>}<p className="mt-2 text-[11px] text-muted">{item.review_count} révision(s) · Prochaine : {item.next_review_date || '—'}</p></div>
    {due && <button className="button-small button-done shrink-0" onClick={onReview}><RotateCw size={13} /> Revu</button>}</div></div>;
}
