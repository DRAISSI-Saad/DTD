const STORAGE_KEY = 'tdt_portfolio_demo_data';

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createInitialData() {
  const exams = [
    { id: 1, title: 'Examen final', subject: 'Mathématiques', exam_date: localDate(18) },
    { id: 2, title: 'Épreuve de fin de semestre', subject: 'Physique', exam_date: localDate(24) },
    { id: 3, title: 'Contrôle continu', subject: 'Informatique', exam_date: localDate(12) }
  ];
  const chapters = [
    { id: 1, exam_id: 1, title: 'Dérivées et applications', difficulty: 'difficile', mastery_level: 68, status: 'en_cours' },
    { id: 2, exam_id: 1, title: 'Intégrales', difficulty: 'moyen', mastery_level: 82, status: 'en_cours' },
    { id: 3, exam_id: 2, title: 'Mécanique du point', difficulty: 'difficile', mastery_level: 55, status: 'a_faire' },
    { id: 4, exam_id: 2, title: 'Électricité', difficulty: 'moyen', mastery_level: 91, status: 'termine' },
    { id: 5, exam_id: 3, title: 'Structures de données', difficulty: 'moyen', mastery_level: 76, status: 'en_cours' },
    { id: 6, exam_id: 3, title: 'Algorithmes de tri', difficulty: 'facile', mastery_level: 88, status: 'en_cours' }
  ];
  const plans = [
    { id: 1, plan_date: localDate(), objective_1: 'Revoir les règles de dérivation', objective_2: 'Résoudre une annale de physique', objective_3: 'Consolider les algorithmes de tri', evening_review: 'Bonne concentration sur les exercices. Revoir les erreurs de signe demain.' },
    { id: 2, plan_date: localDate(-1), objective_1: 'Réviser les intégrales', objective_2: 'Faire des exercices de mécanique', objective_3: null, evening_review: '' },
    { id: 3, plan_date: localDate(1), objective_1: 'Terminer les exercices de dérivation', objective_2: 'Revoir les erreurs du carnet', objective_3: 'Faire une pause avant la séance du soir', evening_review: '' }
  ];
  const blocks = [
    { id: 1, plan_id: 1, chapter_id: 1, start_time: '09:00:00', end_time: '09:50:00', block_type: 'cours', status: 'fait', notes: 'Revoir les règles et les exemples clés.' },
    { id: 2, plan_id: 1, chapter_id: 1, start_time: '09:50:00', end_time: '10:00:00', block_type: 'pause', status: 'prevu', notes: 'Pause de 10 minutes' },
    { id: 3, plan_id: 1, chapter_id: 1, start_time: '10:00:00', end_time: '10:50:00', block_type: 'exercice', status: 'prevu', notes: 'Applications et exercices ciblés.' },
    { id: 4, plan_id: 1, chapter_id: 2, start_time: '11:00:00', end_time: '11:50:00', block_type: 'fiche', status: 'prevu', notes: 'Créer une fiche de synthèse.' },
    { id: 5, plan_id: 1, chapter_id: null, start_time: '12:19:00', end_time: '12:39:00', block_type: 'pause', status: 'prevu', notes: 'Pause prière · Dhuhr' },
    { id: 6, plan_id: 1, chapter_id: 3, start_time: '14:00:00', end_time: '14:50:00', block_type: 'annale', status: 'prevu', notes: 'Annale en conditions réelles.' },
    { id: 7, plan_id: 1, chapter_id: 3, start_time: '15:34:00', end_time: '16:24:00', block_type: 'annale', status: 'prevu', notes: 'Correction et reprise des points difficiles.' },
    { id: 8, plan_id: 1, chapter_id: 6, start_time: '19:16:00', end_time: '20:06:00', block_type: 'revision', status: 'prevu', notes: 'Révision légère et rappel actif.' },
    { id: 9, plan_id: 2, chapter_id: 2, start_time: '09:00:00', end_time: '09:50:00', block_type: 'cours', status: 'fait', notes: 'Revoir les primitives usuelles.' },
    { id: 10, plan_id: 2, chapter_id: 4, start_time: '14:00:00', end_time: '14:50:00', block_type: 'exercice', status: 'fait', notes: 'Série d’exercices corrigés.' },
    { id: 11, plan_id: 2, chapter_id: 5, start_time: '16:00:00', end_time: '16:50:00', block_type: 'fiche', status: 'saute', notes: 'Fiche de révision.' }
  ];
  const errors = [
    { id: 1, chapter_id: 1, error_description: 'Confusion entre la dérivée d’un produit et celle d’une somme.', correction: 'Appliquer (uv)′ = u′v + uv′ et identifier chaque facteur avant de dériver.', review_count: 0, next_review_date: localDate(), created_at: new Date().toISOString() },
    { id: 2, chapter_id: 3, error_description: 'Oubli de convertir les unités avant le calcul de la vitesse.', correction: 'Vérifier les unités SI et les conversions avant de remplacer les valeurs.', review_count: 1, next_review_date: localDate(2), created_at: new Date().toISOString() },
    { id: 3, chapter_id: 5, error_description: 'Mauvaise mise à jour des indices dans une boucle de tri.', correction: 'Tracer les indices sur un petit exemple avant de généraliser.', review_count: 2, next_review_date: localDate(-1), created_at: new Date().toISOString() }
  ];
  return { exams, chapters, plans, blocks, errors };
}

function getData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error('Impossible de lire les données de démonstration locales.', error);
  }
  const initial = createInitialData();
  saveData(initial);
  return initial;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function joinBlock(block, data) {
  const chapter = data.chapters.find((item) => item.id === block.chapter_id);
  const exam = data.exams.find((item) => item.id === chapter?.exam_id);
  return { ...block, chapter_title: chapter?.title || null, subject: exam?.subject || null };
}

function stats(data) {
  const totalChapters = data.chapters.length;
  const completedChapters = data.chapters.filter((chapter) => chapter.status === 'termine').length;
  const studyBlocks = data.blocks.filter((block) => block.block_type !== 'pause');
  const completedBlocks = studyBlocks.filter((block) => block.status === 'fait').length;
  const subjects = data.exams.map((exam) => {
    const chapters = data.chapters.filter((chapter) => chapter.exam_id === exam.id);
    return {
      subject: exam.subject,
      average_mastery: chapters.length
        ? Number((chapters.reduce((sum, chapter) => sum + Number(chapter.mastery_level), 0) / chapters.length).toFixed(1))
        : 0,
      chapter_count: chapters.length
    };
  });
  return {
    total_chapters: totalChapters,
    completed_chapters: completedChapters,
    average_mastery: totalChapters
      ? data.chapters.reduce((sum, chapter) => sum + Number(chapter.mastery_level), 0) / totalChapters
      : 0,
    total_blocks: studyBlocks.length,
    completed_blocks: completedBlocks,
    completion_rate: studyBlocks.length ? Math.round((completedBlocks / studyBlocks.length) * 100) : 0,
    chapter_completion_rate: totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
    subjects
  };
}

function paginate(rows, search) {
  const params = new URLSearchParams(search);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 20));
  const start = (page - 1) * limit;
  return { data: rows.slice(start, start + limit), pagination: { page, limit, total: rows.length } };
}

function parseBody(body) {
  return typeof body === 'string' ? JSON.parse(body || '{}') : (body || {});
}

export async function demoApi(path, options = {}) {
  const data = getData();
  const [pathname, search = ''] = path.split('?');
  const method = (options.method || 'GET').toUpperCase();
  const body = parseBody(options.body);
  const today = localDate();

  if (pathname === '/plans/today' && method === 'GET') {
    const plan = data.plans.find((item) => item.plan_date === today) || null;
    return { plan, blocks: plan ? data.blocks.filter((block) => block.plan_id === plan.id).sort((a, b) => a.start_time.localeCompare(b.start_time)).map((block) => joinBlock(block, data)) : [] };
  }
  if (pathname === '/stats' && method === 'GET') return stats(data);
  if (pathname === '/errors/due' && method === 'GET') {
    return data.errors.filter((item) => item.next_review_date <= today).map((item) => joinError(item, data));
  }
  if (pathname === '/plans/generate' && method === 'POST') {
    let plan = data.plans.find((item) => item.plan_date === (body.plan_date || today));
    if (!plan) {
      plan = { id: nextId(data.plans), plan_date: body.plan_date || today, objective_1: body.objective_1 || null, objective_2: body.objective_2 || null, objective_3: body.objective_3 || null, evening_review: '' };
      data.plans.push(plan);
    }
    data.blocks = data.blocks.filter((block) => block.plan_id !== plan.id);
    const chapters = data.chapters.filter((chapter) => chapter.status !== 'termine').sort((a, b) => ({ difficile: 0, moyen: 1, facile: 2 }[a.difficulty] - ({ difficile: 0, moyen: 1, facile: 2 }[b.difficulty])));
    if (!chapters.length) throw new Error('Ajoutez au moins un chapitre non terminé avant de générer un planning.');
    const templates = [
      ['09:00:00', '09:50:00', 'cours', chapters[0], 'Commencer par le chapitre le plus difficile.'],
      ['10:00:00', '10:50:00', 'exercice', chapters[1] || chapters[0], 'Mise en pratique après le cours.'],
      ['14:00:00', '14:50:00', 'annale', chapters[0], 'Annale en conditions réelles.'],
      ['15:34:00', '16:24:00', 'annale', chapters[1] || chapters[0], 'Correction et reprise des points difficiles.'],
      ['19:16:00', '20:06:00', 'revision', chapters[chapters.length - 1], 'Révision légère et rappel actif.']
    ];
    data.blocks.push(...templates.map(([start_time, end_time, block_type, chapter, notes], index) => ({
      id: nextId(data.blocks) + index, plan_id: plan.id, chapter_id: chapter.id, start_time, end_time, block_type, status: 'prevu', notes
    })));
    saveData(data);
    return { plan_id: plan.id, blocks: data.blocks.filter((block) => block.plan_id === plan.id), margin_block_id: null };
  }

  if (pathname.startsWith('/history/gantt') && method === 'GET') {
    const params = new URLSearchParams(search);
    const from = params.get('from') || today;
    const to = params.get('to') || today;
    return data.plans.filter((plan) => plan.plan_date >= from && plan.plan_date <= to)
      .flatMap((plan) => {
        const blocks = data.blocks.filter((block) => block.plan_id === plan.id);
        return (blocks.length ? blocks : [null]).map((block) => ({
          plan_date: plan.plan_date, plan_id: plan.id, block_id: block?.id ?? null,
          chapter_id: block?.chapter_id ?? null, start_time: block?.start_time ?? null, end_time: block?.end_time ?? null,
          block_type: block?.block_type ?? null, status: block?.status ?? null, notes: block?.notes ?? null,
          ...(block ? joinBlock(block, data) : { chapter_title: null, subject: null })
        }));
      });
  }

  const statusMatch = pathname.match(/^\/blocks\/(\d+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const block = data.blocks.find((item) => item.id === Number(statusMatch[1]));
    if (!block) throw new Error('Bloc introuvable.');
    block.status = body.status;
    if (body.status === 'fait' && block.chapter_id) {
      const chapter = data.chapters.find((item) => item.id === block.chapter_id);
      if (chapter) chapter.status = 'en_cours';
    }
    saveData(data);
    return joinBlock(block, data);
  }

  const collection = pathname.replace(/^\//, '').replaceAll('-', '_');
  const supported = ['exams', 'chapters', 'daily_plans', 'study_blocks', 'error_notebook'];
  if (!supported.includes(collection)) throw new Error(`Route de démonstration non reconnue : ${pathname}`);
  const records = data[collection];
  const idMatch = pathname.match(/\/(\d+)$/);
  if (method === 'GET') {
    const rows = records.map((item) => collection === 'error_notebook' ? joinError(item, data) : collection === 'study_blocks' ? joinBlock(item, data) : item);
    if (idMatch) return rows.find((item) => item.id === Number(idMatch[1])) || null;
    return paginate(rows.sort((a, b) => b.id - a.id), search);
  }
  if (method === 'POST') {
    const item = { id: nextId(records), ...body };
    if (collection === 'error_notebook') {
      item.review_count = item.review_count || 0;
      item.next_review_date = item.next_review_date || localDate(1);
      item.created_at = new Date().toISOString();
    }
    records.push(item);
    saveData(data);
    return collection === 'error_notebook' ? joinError(item, data) : item;
  }
  if (idMatch && method === 'PUT') {
    const index = records.findIndex((item) => item.id === Number(idMatch[1]));
    if (index < 0) throw new Error('Enregistrement introuvable.');
    records[index] = { ...records[index], ...body };
    if (collection === 'error_notebook' && Object.hasOwn(body, 'review_count')) {
      records[index].next_review_date = localDate(body.review_count === 1 ? 3 : 7);
    }
    saveData(data);
    return collection === 'error_notebook' ? joinError(records[index], data) : records[index];
  }
  if (idMatch && method === 'DELETE') {
    const index = records.findIndex((item) => item.id === Number(idMatch[1]));
    if (index < 0) throw new Error('Enregistrement introuvable.');
    records.splice(index, 1);
    saveData(data);
    return null;
  }
  throw new Error(`Opération ${method} non prise en charge en mode démonstration.`);
}

function joinError(item, data) {
  const chapter = data.chapters.find((entry) => entry.id === item.chapter_id);
  const exam = data.exams.find((entry) => entry.id === chapter?.exam_id);
  return { ...item, chapter_title: chapter?.title || null, subject: exam?.subject || null };
}

function nextId(items) {
  return items.reduce((largest, item) => Math.max(largest, item.id), 0) + 1;
}
