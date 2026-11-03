import { useEffect, useState } from 'react';
import { BookPlus, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { Card, EmptyState, ErrorState, Field, Loading, PageHeader, ProgressBar, SelectField } from '../components/UI';

const initialExam = { title: '', subject: '', exam_date: '' };
const initialChapter = { exam_id: '', title: '', difficulty: 'moyen' };

export default function Subjects({ notify }) {
  const [exams, setExams] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [exam, setExam] = useState(initialExam);
  const [chapter, setChapter] = useState(initialChapter);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = () => Promise.all([api('/exams?limit=100'), api('/chapters?limit=100')])
    .then(([e, c]) => { setExams(e.data); setChapters(c.data); setChapter((value) => ({ ...value, exam_id: value.exam_id || String(e.data[0]?.id || '') })); })
    .catch((e) => setError(e.message)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const addExam = async (event) => {
    event.preventDefault(); setError('');
    try { await api('/exams', { method: 'POST', body: JSON.stringify(exam) }); setExam(initialExam); await load(); notify('Examen ajouté'); }
    catch (e) { setError(e.message); }
  };
  const addChapter = async (event) => {
    event.preventDefault(); setError('');
    try { await api('/chapters', { method: 'POST', body: JSON.stringify({ ...chapter, exam_id: Number(chapter.exam_id) }) }); setChapter((value) => ({ ...value, title: '' })); await load(); notify('Chapitre ajouté'); }
    catch (e) { setError(e.message); }
  };
  const updateChapter = async (item, updates) => {
    setError('');
    try { await api(`/chapters/${item.id}`, { method: 'PUT', body: JSON.stringify(updates) }); await load(); notify('Chapitre mis à jour'); }
    catch (e) { setError(e.message); }
  };
  const deleteChapter = async (id) => {
    if (!window.confirm('Supprimer ce chapitre et ses sessions et erreurs associées ?')) return;
    try { await api(`/chapters/${id}`, { method: 'DELETE' }); await load(); notify('Chapitre supprimé'); }
    catch (e) { setError(e.message); }
  };
  const grouped = exams.map((item) => ({ ...item, chapters: chapters.filter((c) => c.exam_id === item.id) }));

  if (loading) return <Loading />;
  return <>
    <PageHeader eyebrow="TON PROGRAMME" title="Matières & chapitres" description="Centralise tes examens, ajuste la difficulté et suis ta maîtrise au fil des révisions." />
    {error && <div className="mb-5"><ErrorState error={error} retry={() => { setError(''); load(); }} /></div>}
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Card><div className="mb-5 flex items-center gap-2"><BookPlus size={18} className="text-primary" /><h3 className="font-bold">Ajouter un examen</h3></div>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={addExam}><Field label="Nom de l'examen" required placeholder="Ex. Partiel de juin" value={exam.title} onChange={(e) => setExam({ ...exam, title: e.target.value })} /><Field label="Matière" required placeholder="Ex. Mathématiques" value={exam.subject} onChange={(e) => setExam({ ...exam, subject: e.target.value })} /><Field className="sm:col-span-2" label="Date de l'examen" type="date" required value={exam.exam_date} onChange={(e) => setExam({ ...exam, exam_date: e.target.value })} /><button className="button-primary sm:col-span-2"><Plus size={16} /> Ajouter l'examen</button></form>
      </Card>
      <Card><div className="mb-5 flex items-center gap-2"><Plus size={18} className="text-primary" /><h3 className="font-bold">Ajouter un chapitre</h3></div>
        {exams.length ? <form className="grid gap-4 sm:grid-cols-2" onSubmit={addChapter}><Field className="sm:col-span-2" label="Titre du chapitre" required placeholder="Ex. Dérivées et applications" value={chapter.title} onChange={(e) => setChapter({ ...chapter, title: e.target.value })} /><SelectField label="Examen associé" required value={chapter.exam_id} onChange={(e) => setChapter({ ...chapter, exam_id: e.target.value })}>{exams.map((e) => <option key={e.id} value={e.id}>{e.subject} — {e.title}</option>)}</SelectField><SelectField label="Difficulté" value={chapter.difficulty} onChange={(e) => setChapter({ ...chapter, difficulty: e.target.value })}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></SelectField><button className="button-primary sm:col-span-2"><Plus size={16} /> Ajouter le chapitre</button></form> : <p className="text-sm text-muted">Ajoute d'abord un examen pour créer des chapitres.</p>}
      </Card>
    </div>
    <div className="mt-7 space-y-5">
      {!grouped.length ? <Card><EmptyState title="Aucun examen pour le moment" text="Ajoute ton premier examen pour construire ton programme." /></Card> : grouped.map((item) => <Card key={item.id}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-primary">{item.subject}</p><h3 className="mt-1 text-lg font-bold">{item.title}</h3></div><div className="text-right"><p className="text-xs text-muted">Date d'examen</p><p className="text-sm font-semibold">{new Date(`${item.exam_date}T12:00:00`).toLocaleDateString('fr-FR')}</p></div></div>
        {!item.chapters.length ? <p className="py-4 text-sm text-muted">Aucun chapitre associé.</p> : <div className="space-y-4">{item.chapters.map((c) => <div key={c.id} className="grid items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-[1fr_auto_auto_130px_28px]">
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{c.title}</p><div className="mt-2"><ProgressBar value={c.mastery_level} /></div></div>
          <SelectField label="Difficulté" value={c.difficulty} onChange={(e) => updateChapter(c, { difficulty: e.target.value })}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></SelectField>
          <SelectField label="Statut" value={c.status} onChange={(e) => updateChapter(c, { status: e.target.value })}><option value="a_faire">À faire</option><option value="en_cours">En cours</option><option value="termine">Terminé</option></SelectField>
          <Field label={`Maîtrise · ${c.mastery_level}%`} type="range" min="0" max="100" value={c.mastery_level} onChange={(e) => updateChapter(c, { mastery_level: Number(e.target.value) })} />
          <button className="mt-5 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Supprimer le chapitre" onClick={() => deleteChapter(c.id)}><Trash2 size={16} /></button>
        </div>)}</div>}
      </Card>)}
    </div>
  </>;
}
