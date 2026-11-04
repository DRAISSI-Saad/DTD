import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, CalendarRange, Check, CheckCircle2, Clock3, RotateCw, Target, XCircle } from 'lucide-react';
import { api } from '../api';
import { Card, EmptyState, ErrorState, Loading, PageHeader } from '../components/UI';

const DAY_START = 8 * 60;
const DAY_END = 21 * 60;
const HOURS = [8, 10, 12, 14, 16, 18, 20];
const activityNames = {
  cours: 'Cours',
  fiche: 'Fiche',
  exercice: 'Exercice',
  annale: 'Annale',
  revision: 'Révision',
  pause: 'Pause'
};

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftDate(date, offset) {
  const shifted = new Date(`${date}T12:00:00`);
  shifted.setDate(shifted.getDate() + offset);
  return formatLocalDate(shifted);
}

function previousMonthRange(date) {
  const firstOfCurrentMonth = new Date(`${date.slice(0, 7)}-01T12:00:00`);
  const lastOfPreviousMonth = new Date(firstOfCurrentMonth);
  lastOfPreviousMonth.setDate(0);
  const firstOfPreviousMonth = new Date(lastOfPreviousMonth.getFullYear(), lastOfPreviousMonth.getMonth(), 1, 12);
  return { from: formatLocalDate(firstOfPreviousMonth), to: formatLocalDate(lastOfPreviousMonth) };
}

function minutes(time) {
  const [hours, mins] = String(time).split(':').map(Number);
  return hours * 60 + mins;
}

function dayLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(new Date(`${date}T12:00:00`));
}

function longDayLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(`${date}T12:00:00`));
}

function groupByDay(blocks) {
  const groups = new Map();
  for (const block of blocks) {
    if (!groups.has(block.plan_date)) groups.set(block.plan_date, []);
    if (block.block_id !== null) groups.get(block.plan_date).push(block);
  }
  return [...groups.entries()].map(([date, items]) => ({ date, blocks: items }));
}

function assignLanes(blocks) {
  const laneEnds = [];
  return blocks.map((block) => {
    const start = minutes(block.start_time);
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = minutes(block.end_time);
    return { ...block, lane };
  });
}

export default function History() {
  const today = formatLocalDate(new Date());
  const now = new Date();
  const previousMonth = previousMonthRange(today);
  const [range, setRange] = useState(previousMonth);
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api(`/history/gantt?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`, {
      signal: controller.signal
    })
      .then((items) => {
        if (!Array.isArray(items)) throw new Error('Le serveur a renvoyé un historique invalide.');
        setBlocks(items);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [range, refresh]);

  const days = useMemo(() => groupByDay(blocks), [blocks]);
  const workBlocks = blocks.filter((block) => block.block_id !== null && block.block_type !== 'pause');
  const completed = workBlocks.filter((block) => block.status === 'fait').length;
  const skipped = workBlocks.filter((block) => block.status === 'saute').length;
  const completionRate = workBlocks.length ? Math.round((completed / workBlocks.length) * 100) : 0;
  const completedMinutes = workBlocks
    .filter((block) => block.status === 'fait')
    .reduce((total, block) => total + Math.max(0, minutes(block.end_time) - minutes(block.start_time)), 0);

  const setPreset = (days) => setRange({ from: shiftDate(today, -(days - 1)), to: today });
  const updateDate = (key, value) => setRange((current) => ({ ...current, [key]: value }));
  const changeWeek = (offset) => setRange((current) => ({
    from: shiftDate(current.from, offset * 7),
    to: shiftDate(current.to, offset * 7)
  }));
  const isPreviousMonth = range.from === previousMonth.from && range.to === previousMonth.to;

  return <>
    <PageHeader
      eyebrow="VOTRE PARCOURS"
      title="Journal de révision"
      description="Retrouvez vos journées de travail, les séances terminées et les points à reprendre."
      action={<button className="button-small button-skip" onClick={() => setRefresh((value) => value + 1)}><RotateCw size={14} /> Actualiser</button>}
    />

    <Card className="history-toolbar mb-5 !p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="history-period-switch">
          <button className="icon-button" onClick={() => changeWeek(-1)} aria-label="Période précédente">‹</button>
          <div className="min-w-[142px] text-center">
            <p className="text-xs font-semibold capitalize">{range.from === range.to ? longDayLabel(range.from) : `${dayLabel(range.from)} – ${dayLabel(range.to)}`}</p>
            <p className="mt-1 text-[10px] text-muted">{days.length} journée(s) avec planning</p>
          </div>
          <button className="icon-button" onClick={() => changeWeek(1)} aria-label="Période suivante" disabled={range.to >= today}>›</button>
          {!isPreviousMonth && <button className="button-small button-skip" onClick={() => setRange(previousMonth)}>Mois précédent</button>}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">Du</span>
            <input className="input history-date-input" type="date" value={range.from} max={range.to} onChange={(event) => updateDate('from', event.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">Au</span>
            <input className="input history-date-input" type="date" value={range.to} min={range.from} max={today} onChange={(event) => updateDate('to', event.target.value)} />
          </label>
          <div className="history-presets flex gap-1 pb-0.5">
            {[7, 30, 90].map((daysCount) => (
              <button key={daysCount} className="button-small button-skip" onClick={() => setPreset(daysCount)}>{daysCount} j</button>
            ))}
          </div>
        </div>
      </div>
      <div className="history-legend mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted">État des séances</span>
        <Legend color="history-done" label="Réalisée" />
        <Legend color="history-planned" label="À venir" />
        <Legend color="history-unconfirmed" label="Non cochée" />
        <Legend color="history-skipped" label="Sautée" />
        <Legend color="history-break" label="Pause" />
      </div>
    </Card>

    {error && <div className="mb-5"><ErrorState error={error} retry={() => setRefresh((value) => value + 1)} /></div>}

    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Summary icon={CalendarRange} label="Jours planifiés" value={days.length} detail="Sur la période sélectionnée" />
      <Summary icon={CheckCircle2} label="Séances terminées" value={`${completed} / ${workBlocks.length}`} detail={skipped ? `${skipped} séance(s) sautée(s)` : 'Hors pauses'} />
      <Summary icon={Clock3} label="Temps de révision" value={formatDuration(completedMinutes)} detail="Estimé à partir des séances terminées" />
      <Summary icon={Target} label="Régularité" value={`${completionRate}%`} detail="Part des séances terminées" />
    </div>

    <Card className="history-gantt-card !p-0">
      <div className="history-gantt-heading">
        <div className="flex items-center gap-3">
          <span className="history-heading-icon"><CalendarDays size={17} /></span>
          <div>
            <h3 className="text-sm font-semibold">Chronologie de vos révisions</h3>
            <p className="mt-1 text-xs text-muted">Chaque ligne représente une journée ; la longueur des blocs suit leur durée.</p>
          </div>
        </div>
        <span className="history-timezone">Heure locale · 08:00–21:00</span>
      </div>
      {loading ? <div className="px-5"><Loading label="Chargement de votre historique..." /></div>
        : !days.length ? <div className="history-empty">
          <span className="history-empty-icon"><BookOpen size={22} /></span>
          <h3 className="mt-4 text-sm font-semibold">Votre journal commence ici</h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted">Générez un planning et cochez vos séances au fil de la journée. Vos réalisations apparaîtront ici.</p>
          <Link className="button-primary mt-4" to="/planning">Ouvrir mon planning <ArrowRight size={14} /></Link>
        </div>
          : <div className="gantt-scroll">
            <div className="gantt-chart">
              <div className="gantt-axis-row">
                <div className="gantt-day-header">JOURNÉE</div>
                <div className="gantt-track gantt-axis">
                  {HOURS.map((hour) => <span key={hour} className="gantt-tick" style={{ left: `${((hour * 60 - DAY_START) / (DAY_END - DAY_START)) * 100}%` }}>{String(hour).padStart(2, '0')}:00</span>)}
                </div>
              </div>
              {days.map(({ date, blocks: dayBlocks }) => {
                const items = assignLanes(dayBlocks);
                const study = dayBlocks.filter((block) => block.block_type !== 'pause');
                const dayCompleted = study.filter((block) => block.status === 'fait').length;
                const dayProgress = study.length ? Math.round((dayCompleted / study.length) * 100) : 0;
                const studyMinutes = study.reduce((total, block) => total + Math.max(0, minutes(block.end_time) - minutes(block.start_time)), 0);
                const laneCount = Math.max(1, ...items.map((block) => block.lane + 1));
                const height = Math.max(50, laneCount * 32 + 12);
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                const showNow = date === today && nowMinutes >= DAY_START && nowMinutes <= DAY_END;
                const nowPosition = ((nowMinutes - DAY_START) / (DAY_END - DAY_START)) * 100;
                return <div className={`gantt-day-row ${date === today ? 'gantt-today-row' : ''}`} key={date}>
                  <div className="gantt-day-label">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">{dayLabel(date)}</span>
                      {date === today && <span className="gantt-today-badge">Aujourd’hui</span>}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                      <span>{dayCompleted}/{study.length} séances</span>
                      <span>{formatDuration(studyMinutes)}</span>
                    </div>
                    <div className="history-progress-track mt-1.5"><span style={{ width: `${dayProgress}%` }} /></div>
                  </div>
                  <div className="gantt-track gantt-track-grid" style={{ height }}>
                    {HOURS.map((hour) => <span key={hour} className="gantt-gridline" style={{ left: `${((hour * 60 - DAY_START) / (DAY_END - DAY_START)) * 100}%` }} />)}
                    {showNow && <span className="gantt-now-line" style={{ left: `${nowPosition}%` }}><span>Maintenant</span></span>}
                    {items.map((block) => <GanttBlock key={block.block_id} block={block} date={date} now={now} lane={block.lane} />)}
                  </div>
                </div>;
              })}
            </div>
          </div>}
    </Card>

    {!loading && days.length > 0 && <div className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted">DÉTAIL PAR JOUR</p><h3 className="mt-1 text-sm font-semibold">Le travail accompli</h3></div>
        <span className="text-[10px] text-muted">{days.length} journée(s)</span>
      </div>
      <div className="history-day-cards">
      {days.map(({ date, blocks: dayBlocks }) => {
        const study = dayBlocks.filter((block) => block.block_type !== 'pause');
        const dayCompleted = study.filter((block) => block.status === 'fait').length;
        const dayMinutes = study.filter((block) => block.status === 'fait').reduce((total, block) => total + Math.max(0, minutes(block.end_time) - minutes(block.start_time)), 0);
        const subjects = [...new Set(study.map((block) => block.subject).filter(Boolean))];
        return <details key={date} className="history-detail card !p-0">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm">
            <span className="flex items-center gap-3"><span className="history-detail-date"><CalendarDays size={15} /></span><span><span className="block font-semibold capitalize">{longDayLabel(date)}</span><span className="mt-1 block text-[10px] text-muted">{subjects.length ? subjects.join(' · ') : `${study.length} séances planifiées`}</span></span></span>
            <span className="history-day-summary"><span className="font-semibold">{dayCompleted}/{study.length}</span><span className="hidden text-muted sm:inline">séances</span><span className="history-summary-divider" /><span>{formatDuration(dayMinutes)} réalisés</span></span>
          </summary>
          <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            {dayBlocks.map((block) => <div className="history-detail-row" key={block.block_id}>
              <span className="w-24 shrink-0 text-xs font-semibold">{block.start_time.slice(0, 5)}–{block.end_time.slice(0, 5)}</span>
              <span className="min-w-0 flex-1 truncate text-xs">{block.chapter_title || block.notes || activityNames[block.block_type]}</span>
              <StatusLabel block={block} date={date} now={now} />
            </div>)}
          </div>
        </details>;
      })}
      </div>
    </div>}
  </>;
}

function formatDuration(value) {
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (!hours) return `${mins} min`;
  return mins ? `${hours} h ${mins} min` : `${hours} h`;
}

function GanttBlock({ block, date, now, lane }) {
  const start = minutes(block.start_time);
  const end = minutes(block.end_time);
  const clippedStart = Math.max(start, DAY_START);
  const clippedEnd = Math.min(end, DAY_END);
  if (clippedEnd <= clippedStart) return null;

  const left = ((clippedStart - DAY_START) / (DAY_END - DAY_START)) * 100;
  const width = ((clippedEnd - clippedStart) / (DAY_END - DAY_START)) * 100;
  const state = getBlockState(block, date, now);
  const label = `${block.start_time.slice(0, 5)}–${block.end_time.slice(0, 5)} · ${activityNames[block.block_type] || block.block_type}${block.subject ? ` · ${block.subject}` : ''}${block.chapter_title ? ` · ${block.chapter_title}` : ''}${block.notes ? ` · ${block.notes}` : ''} · ${state.label}`;
  const shortLabel = block.block_type === 'pause' ? 'Pause' : `${activityNames[block.block_type]}${block.subject ? ` · ${block.subject}` : ''}`;

  return <div className={`gantt-block ${state.className}`} title={label} aria-label={label} style={{ left: `${left}%`, width: `${width}%`, top: 6 + lane * 32 }}>
    {block.status === 'fait' && block.block_type !== 'pause' && <Check size={11} className="shrink-0" />}
    <span>{width > 7 ? shortLabel : ''}</span>
  </div>;
}

function Summary({ icon: Icon, label, value, detail }) {
  return <Card className="history-summary-card !p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted">{label}</p><span className="history-summary-icon"><Icon size={15} /></span></div><p className="mt-2 text-xl font-bold">{value}</p><p className="mt-1 text-[10px] text-muted">{detail}</p></Card>;
}

function Legend({ color, label }) {
  return <span className="inline-flex items-center gap-1.5 text-[10px] text-muted"><span className={`history-legend-dot ${color}`} />{label}</span>;
}

function getBlockState(block, date, now) {
  if (block.block_type === 'pause') return { label: 'Pause', className: 'history-break' };
  if (block.status === 'fait') return { label: 'Réalisée', className: 'history-done' };
  if (block.status === 'saute') return { label: 'Sautée', className: 'history-skipped' };

  const currentDate = formatLocalDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (date < currentDate || (date === currentDate && minutes(block.end_time) <= currentMinutes)) {
    return { label: 'Non cochée', className: 'history-unconfirmed' };
  }
  if (date === currentDate && minutes(block.start_time) <= currentMinutes) {
    return { label: 'En cours · à confirmer', className: 'history-unconfirmed' };
  }
  return { label: 'À venir', className: 'history-planned' };
}

function StatusLabel({ block, date, now }) {
  const state = getBlockState(block, date, now);
  if (block.block_type === 'pause') return <span className="inline-flex items-center gap-1 text-[10px] text-muted"><Clock3 size={12} />Pause</span>;
  if (block.status === 'fait') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"><CheckCircle2 size={12} />{state.label}</span>;
  if (block.status === 'saute') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500"><XCircle size={12} />{state.label}</span>;
  return <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">{state.label}</span>;
}
