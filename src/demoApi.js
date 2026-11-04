const STORAGE_KEY = 'tdt_portfolio_demo_data_v4';

function localDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function previousMonthRange() {
  const current = new Date();
  const firstOfCurrentMonth = new Date(current.getFullYear(), current.getMonth(), 1, 12);
  const lastOfPreviousMonth = new Date(firstOfCurrentMonth);
  lastOfPreviousMonth.setDate(0);
  const firstOfPreviousMonth = new Date(lastOfPreviousMonth.getFullYear(), lastOfPreviousMonth.getMonth(), 1, 12);
  const format = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: format(firstOfPreviousMonth), end: format(lastOfPreviousMonth) };
}

function previousMonthDate(day) {
  const { start } = previousMonthRange();
  const date = new Date(`${start}T12:00:00`);
  date.setDate(day);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createInitialData() {
  const exams = [
    { id: 1, title: 'Module 1', subject: 'Algorithmique et programmation', exam_date: localDate(18) },
    { id: 2, title: 'Module 2', subject: 'Programmation orientée objet', exam_date: localDate(20) },
    { id: 3, title: 'Module 3', subject: 'Développement web', exam_date: localDate(12) },
    { id: 4, title: 'Module 4', subject: 'Bases de données', exam_date: localDate(24) },
    { id: 5, title: 'Module 5', subject: 'Génie logiciel et méthodes agiles', exam_date: localDate(16) },
    { id: 6, title: 'Module 6', subject: 'Systèmes et réseaux', exam_date: localDate(22) },
    { id: 7, title: 'Module 7', subject: 'Mathématiques pour la science des données', exam_date: localDate(28) },
    { id: 8, title: 'Module 8', subject: 'Statistiques et probabilités', exam_date: localDate(26) },
    { id: 9, title: 'Module 9', subject: 'Analyse et visualisation des données', exam_date: localDate(30) }
  ];
  const chapters = [
    { id: 1, exam_id: 1, title: 'Structures de données et complexité', difficulty: 'difficile', mastery_level: 68, status: 'en_cours' },
    { id: 2, exam_id: 2, title: 'Classes, objets et héritage', difficulty: 'moyen', mastery_level: 82, status: 'en_cours' },
    { id: 3, exam_id: 3, title: 'Conception d’API REST', difficulty: 'difficile', mastery_level: 55, status: 'a_faire' },
    { id: 4, exam_id: 4, title: 'Modélisation relationnelle et SQL', difficulty: 'moyen', mastery_level: 91, status: 'termine' },
    { id: 5, exam_id: 5, title: 'Git, tests et intégration continue', difficulty: 'moyen', mastery_level: 76, status: 'en_cours' },
    { id: 6, exam_id: 6, title: 'Systèmes d’exploitation et processus', difficulty: 'facile', mastery_level: 88, status: 'en_cours' },
    { id: 7, exam_id: 7, title: 'Algèbre linéaire et optimisation', difficulty: 'difficile', mastery_level: 63, status: 'en_cours' },
    { id: 8, exam_id: 8, title: 'Probabilités et statistiques descriptives', difficulty: 'moyen', mastery_level: 72, status: 'en_cours' },
    { id: 9, exam_id: 9, title: 'Préparation et visualisation des données', difficulty: 'moyen', mastery_level: 80, status: 'en_cours' }
  ];
  const plans = [
    { id: 1, plan_date: localDate(), objective_1: 'Revoir les structures de données et leur complexité', objective_2: 'Pratiquer la conception d’une API REST', objective_3: 'Consolider les bases de la statistique descriptive', evening_review: 'Bonne concentration sur les exercices. Revoir les cas limites des algorithmes demain.' },
    { id: 2, plan_date: localDate(-1), objective_1: 'Réviser les classes et l’héritage', objective_2: 'Faire des exercices SQL', objective_3: null, evening_review: '' },
    { id: 3, plan_date: localDate(1), objective_1: 'Terminer les exercices d’algorithmique', objective_2: 'Revoir les erreurs du carnet', objective_3: 'Préparer une visualisation de données', evening_review: '' }
  ];
  const dailyReviews = [
    'Séance productive : les exercices ont aidé à clarifier les notions principales.',
    'Bonne progression. Quelques erreurs restent à reprendre avec des exemples simples.',
    'La pratique a été utile ; prévoir une courte révision active demain.',
    'Objectifs principaux atteints. Revoir les points difficiles avant de passer au chapitre suivant.',
    'Journée équilibrée entre cours, exercices et correction des erreurs.'
  ];
  const studyTopics = [
    'Revoir les notions essentielles',
    'Faire des exercices d’application',
    'Corriger une série de problèmes',
    'Préparer une fiche de synthèse',
    'Reprendre les erreurs de la séance précédente'
  ];
  let nextPlanId = 4;
  const previousMonth = previousMonthRange();
  for (let date = new Date(`${previousMonth.start}T12:00:00`); date <= new Date(`${previousMonth.end}T12:00:00`); date.setDate(date.getDate() + 1)) {
    if (date.getDay() === 0 || (date.getDate() % 9 === 0)) continue;
    const planDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const index = date.getDate();
    const firstChapter = chapters[index % chapters.length];
    const secondChapter = chapters[(index + 3) % chapters.length];
    plans.push({
      id: nextPlanId++,
      plan_date: planDate,
      objective_1: `${studyTopics[index % studyTopics.length]} : ${firstChapter.title}`,
      objective_2: `${studyTopics[(index + 1) % studyTopics.length]} : ${secondChapter.title}`,
      objective_3: index % 2 ? 'Consolider les acquis du module' : null,
      evening_review: dailyReviews[index % dailyReviews.length]
    });
  }
  plans[1].evening_review = dailyReviews[1];
  const blocks = [
    { id: 1, plan_id: 1, chapter_id: 1, start_time: '09:00:00', end_time: '09:50:00', block_type: 'cours', status: 'fait', notes: 'Revoir les règles et les exemples clés.' },
    { id: 2, plan_id: 1, chapter_id: 1, start_time: '09:50:00', end_time: '10:00:00', block_type: 'pause', status: 'prevu', notes: 'Pause de 10 minutes' },
    { id: 3, plan_id: 1, chapter_id: 1, start_time: '10:00:00', end_time: '10:50:00', block_type: 'exercice', status: 'prevu', notes: 'Applications et exercices ciblés.' },
    { id: 4, plan_id: 1, chapter_id: 7, start_time: '11:00:00', end_time: '11:50:00', block_type: 'fiche', status: 'prevu', notes: 'Créer une fiche de synthèse.' },
    { id: 5, plan_id: 1, chapter_id: null, start_time: '12:19:00', end_time: '12:39:00', block_type: 'pause', status: 'prevu', notes: 'Pause prière · Dhuhr' },
    { id: 6, plan_id: 1, chapter_id: 8, start_time: '14:00:00', end_time: '14:50:00', block_type: 'annale', status: 'prevu', notes: 'Annale en conditions réelles.' },
    { id: 7, plan_id: 1, chapter_id: 8, start_time: '15:34:00', end_time: '16:24:00', block_type: 'annale', status: 'prevu', notes: 'Correction et reprise des points difficiles.' },
    { id: 8, plan_id: 1, chapter_id: 9, start_time: '19:16:00', end_time: '20:06:00', block_type: 'revision', status: 'prevu', notes: 'Révision légère et rappel actif.' },
    { id: 9, plan_id: 2, chapter_id: 2, start_time: '09:00:00', end_time: '09:50:00', block_type: 'cours', status: 'fait', notes: 'Revoir les principes de la programmation objet.' },
    { id: 10, plan_id: 2, chapter_id: 4, start_time: '14:00:00', end_time: '14:50:00', block_type: 'exercice', status: 'fait', notes: 'Série de requêtes SQL corrigées.' },
    { id: 11, plan_id: 2, chapter_id: 5, start_time: '16:00:00', end_time: '16:50:00', block_type: 'fiche', status: 'saute', notes: 'Fiche de révision sur Git et les tests.' }
  ];
  let nextBlockId = 12;
  for (const plan of plans) {
    if (plan.id <= 3) continue;
    const index = new Date(`${plan.plan_date}T12:00:00`).getDate();
    const firstChapter = chapters[index % chapters.length];
    const secondChapter = chapters[(index + 3) % chapters.length];
    const completionPattern = index % 4;
    const statusFor = (position) => (
      completionPattern === 0 && position === 2 ? 'saute' : position < (completionPattern === 1 ? 2 : 3) ? 'fait' : 'saute'
    );
    blocks.push(
      { id: nextBlockId++, plan_id: plan.id, chapter_id: firstChapter.id, start_time: '09:00:00', end_time: '09:50:00', block_type: 'cours', status: 'fait', notes: 'Révision des notions et des exemples.' },
      { id: nextBlockId++, plan_id: plan.id, chapter_id: firstChapter.id, start_time: '10:00:00', end_time: '10:50:00', block_type: 'exercice', status: statusFor(1), notes: 'Exercices d’application.' },
      { id: nextBlockId++, plan_id: plan.id, chapter_id: secondChapter.id, start_time: '14:00:00', end_time: '14:50:00', block_type: 'annale', status: statusFor(2), notes: 'Mise en pratique et correction.' }
    );
  }
  const errors = [
    { id: 1, chapter_id: 1, error_description: 'Oubli de traiter le cas d’une collection vide dans un algorithme.', correction: 'Lister les cas limites avant de coder : entrée vide, un élément et doublons.', review_count: 0, next_review_date: localDate(), created_at: `${previousMonthDate(3)}T10:00:00.000Z` },
    { id: 2, chapter_id: 8, error_description: 'Interprétation incorrecte de la moyenne en présence de valeurs extrêmes.', correction: 'Comparer moyenne et médiane, puis examiner la dispersion et les valeurs atypiques.', review_count: 1, next_review_date: localDate(2), created_at: `${previousMonthDate(7)}T11:30:00.000Z` },
    { id: 3, chapter_id: 9, error_description: 'Graphique difficile à lire à cause d’axes et d’unités manquants.', correction: 'Ajouter un titre, des libellés, les unités et choisir une échelle adaptée.', review_count: 2, next_review_date: localDate(-1), created_at: `${previousMonthDate(12)}T15:00:00.000Z` },
    { id: 4, chapter_id: 2, error_description: 'Confusion entre surcharge et redéfinition de méthode.', correction: 'Comparer la signature et vérifier si la méthode est héritée de la classe mère.', review_count: 1, next_review_date: localDate(-2), created_at: `${previousMonthDate(17)}T09:30:00.000Z` },
    { id: 5, chapter_id: 4, error_description: 'Requête SQL qui duplique les lignes après une jointure.', correction: 'Vérifier la cardinalité des relations et les clés utilisées dans la jointure.', review_count: 2, next_review_date: localDate(1), created_at: `${previousMonthDate(21)}T13:00:00.000Z` },
    { id: 6, chapter_id: 5, error_description: 'Test automatisé dépendant de l’ordre d’exécution.', correction: 'Isoler les données et rendre chaque test indépendant.', review_count: 0, next_review_date: localDate(-3), created_at: `${previousMonthDate(25)}T16:00:00.000Z` },
    { id: 7, chapter_id: 7, error_description: 'Erreur de dimensions lors d’un produit matriciel.', correction: 'Contrôler le nombre de colonnes de la première matrice et de lignes de la seconde.', review_count: 0, next_review_date: localDate(1), created_at: `${previousMonthDate(28)}T10:45:00.000Z` }
  ];
  return { exams, chapters, plans, blocks, errors };
}

function getData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const initial = createInitialData();
        return Object.fromEntries(
          Object.keys(initial).map((key) => [key, Array.isArray(parsed[key]) ? parsed[key] : initial[key]])
        );
      }
      throw new Error('Le stockage local ne contient pas un jeu de données valide.');
    }
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
  const collectionKeys = {
    exams: 'exams',
    chapters: 'chapters',
    daily_plans: 'plans',
    study_blocks: 'blocks',
    error_notebook: 'errors'
  };
  const storageKey = collectionKeys[collection];
  if (!storageKey) throw new Error(`Route de démonstration non reconnue : ${pathname}`);
  const records = data[storageKey];
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
