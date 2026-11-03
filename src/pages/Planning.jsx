import { useEffect, useRef, useState } from 'react';
import { AlertCircle, AudioLines, Bell, Check, ChevronDown, ChevronUp, CirclePlay, Pause, Play, RotateCcw, SkipForward, Volume2, WandSparkles } from 'lucide-react';
import { api } from '../api';
import { Card, EmptyState, ErrorState, Loading, PageHeader } from '../components/UI';

const typeNames = { cours: 'Cours', fiche: 'Fiche', exercice: 'Exercice', annale: 'Annale', revision: 'Révision', pause: 'Pause' };
const WORK_DURATION_MINUTES = 50;
const STANDARD_BREAK_MINUTES = 10;
const prayerTimes = [
  { name: 'Dhuhr', time: '12:19' },
  { name: 'Asr', time: '15:14' },
  { name: 'Maghrib', time: '17:41' },
  { name: 'Isha', time: '18:56' }
];
const adhanRecordings = [
  { id: 'ali-ibn-ahmad-mala', name: 'Ali Ibn Ahmad Mala', src: '/assets/adhan/Ali%20Ibn%20Ahmad%20Mala.mp3' },
  { id: 'faruq-abdul-rahman-hadrawe', name: 'Faruq Abdul Rahman Hadrawe', src: '/assets/adhan/Faruq%20Abdul%20Rahman%20Hadrawe.mp3' },
  { id: 'mohammed-khaleel-ram', name: 'Mohammed Khaleel Ram', src: '/assets/adhan/Mohammed-khaleel-Ram.mp3' },
  { id: 'muhammad-ramadan-saad', name: 'Muhammad Ramadan Saad', src: '/assets/adhan/Muhammad-Ramadan-Saad.mp3' }
];
let alarmIntervalId = null;
let activeAlarmKind = null;
let activeAdhanAudio = null;

function speakAlarm(breakMinutes) {
  const message = new SpeechSynthesisUtterance(
    `C'est fini pour ce chapitre. Prends ta pause de ${breakMinutes} minutes avant de continuer.`
  );
  message.lang = 'fr-FR';
  message.rate = 0.95;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(message);
}

function startAlarm(breakMinutes) {
  if (!('speechSynthesis' in window) || alarmIntervalId !== null) return;
  activeAlarmKind = 'pomodoro';
  speakAlarm(breakMinutes);
  alarmIntervalId = window.setInterval(() => speakAlarm(breakMinutes), 12000);
}

async function startAdhan(audioSource) {
  stopAlarm();
  const audio = new Audio(audioSource);
  audio.loop = true;
  audio.preload = 'auto';
  activeAlarmKind = 'prayer';
  activeAdhanAudio = audio;
  try {
    await audio.play();
    return true;
  } catch {
    if (activeAdhanAudio === audio) {
      activeAdhanAudio = null;
      activeAlarmKind = null;
    }
    return false;
  }
}

function stopAlarm() {
  if (alarmIntervalId !== null) {
    window.clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
  activeAlarmKind = null;
  if (activeAdhanAudio) {
    activeAdhanAudio.pause();
    activeAdhanAudio.currentTime = 0;
    activeAdhanAudio = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export default function Planning({ notify }) {
  const [day, setDay] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [alarmBreakMinutes, setAlarmBreakMinutes] = useState(STANDARD_BREAK_MINUTES);
  const [prayerReminders, setPrayerReminders] = useState(() => Object.fromEntries(prayerTimes.map(({ name }) => [name, true])));
  const [recordingListOpen, setRecordingListOpen] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState(() => (
    localStorage.getItem('adhanRecordingId') || adhanRecordings[0].id
  ));
  const [previewingRecordingId, setPreviewingRecordingId] = useState('');
  const [remaining, setRemaining] = useState(() => activeAlarmKind === null ? WORK_DURATION_MINUTES * 60 : 0);
  const [running, setRunning] = useState(false);
  const [alarmRinging, setAlarmRinging] = useState(() => activeAlarmKind !== null);
  const [alarmIsPrayer, setAlarmIsPrayer] = useState(() => activeAlarmKind === 'prayer');
  const alarmTriggeredRef = useRef(activeAlarmKind !== null);
  const lastPrayerReminderRef = useRef('');
  const previewAudioRef = useRef(null);
  useEffect(() => () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
  }, []);
  const load = () => Promise.all([api('/plans/today'), api('/chapters?limit=100')])
    .then(([current, chapterResult]) => { setDay(current); setChapters(chapterResult.data); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => setRemaining((value) => {
      if (value <= 1) {
        setRunning(false);
        if (!alarmTriggeredRef.current) {
          alarmTriggeredRef.current = true;
          setAlarmRinging(true);
          setAlarmIsPrayer(false);
          setAlarmBreakMinutes(STANDARD_BREAK_MINUTES);
          startAlarm(STANDARD_BREAK_MINUTES);
          notify('Temps écoulé. L’alarme sonne jusqu’à la réinitialisation.');
        }
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [running, notify]);
  useEffect(() => {
    const reminder = window.setInterval(() => {
      const now = new Date();
      const date = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const prayer = prayerTimes.find(({ name, time }) => prayerReminders[name] && time === currentTime);
      if (!prayer) return;

      const reminderKey = `${date}-${prayer.name}`;
      if (lastPrayerReminderRef.current === reminderKey) return;
      lastPrayerReminderRef.current = reminderKey;
      setRunning(false);
      notify(`${prayer.name} à ${prayer.time} : pause de prière de 20 minutes.`);
      alarmTriggeredRef.current = true;
      setAlarmRinging(true);
      setAlarmIsPrayer(true);
      setAlarmBreakMinutes(20);
      const selectedRecording = adhanRecordings.find(({ id }) => id === selectedRecordingId) || adhanRecordings[0];
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
        setPreviewingRecordingId('');
      }
      startAdhan(selectedRecording.src).then((started) => {
        if (!started) setError('La lecture de l’adhan a échoué. Vérifiez le fichier audio et les autorisations du navigateur.');
      });
    }, 250);
    return () => window.clearInterval(reminder);
  }, [prayerReminders, notify, selectedRecordingId]);
  const setStatus = async (id, status) => {
    try { await api(`/blocks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await load(); notify(status === 'fait' ? 'Session marquée comme faite' : 'Session passée'); }
    catch (e) { setError(e.message); }
  };
  const generate = async () => {
    setBusy(true); setError('');
    try {
      await api('/plans/generate', { method: 'POST', body: JSON.stringify({}) });
      await load(); notify('Planning généré avec succès');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const togglePrayerReminder = (name) => {
    setPrayerReminders((current) => ({ ...current, [name]: !current[name] }));
  };
  const chooseAdhanRecording = (recordingId) => {
    setSelectedRecordingId(recordingId);
    localStorage.setItem('adhanRecordingId', recordingId);
  };
  const toggleRecordingList = () => {
    setRecordingListOpen((open) => !open);
  };
  const previewRecording = async (recording) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    if (previewingRecordingId === recording.id) {
      previewAudioRef.current = null;
      setPreviewingRecordingId('');
      return;
    }
    const audio = new Audio(recording.src);
    previewAudioRef.current = audio;
    setPreviewingRecordingId(recording.id);
    audio.onended = () => {
      if (previewAudioRef.current === audio) {
        previewAudioRef.current = null;
        setPreviewingRecordingId('');
      }
    };
    try {
      await audio.play();
    } catch {
      previewAudioRef.current = null;
      setPreviewingRecordingId('');
      setError('Impossible de lire cet enregistrement. Vérifiez que le fichier audio existe.');
    }
  };
  const toggleTimer = async () => {
    if (running) {
      setRunning(false);
      return;
    }
    if (alarmRinging) return;
    try {
      if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
        throw new Error('La lecture vocale n’est pas disponible dans ce navigateur.');
      }
      setError('');
      setRunning(true);
    } catch (e) {
      setError(e.message || 'Impossible d’activer le son. Vérifiez les réglages audio de votre navigateur.');
    }
  };
  const resetTimer = () => {
    stopAlarm();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      setPreviewingRecordingId('');
    }
    alarmTriggeredRef.current = false;
    setRunning(false);
    setAlarmRinging(false);
    setAlarmIsPrayer(false);
    setRemaining(WORK_DURATION_MINUTES * 60);
    setAlarmBreakMinutes(STANDARD_BREAK_MINUTES);
  };
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  if (!day && !error) return <Loading />;
  return <>
    <PageHeader eyebrow="ORGANISATION" title="Planning du jour" description="Des sessions ciblées, des pauses régulières et de la marge pour rester serein." action={<button className="button-primary" onClick={generate} disabled={busy}><WandSparkles size={16} />{busy ? 'Génération...' : 'Générer ma journée'}</button>} />
    {error && <div className="mb-5"><ErrorState error={error} retry={() => { setError(''); load(); }} /></div>}
    <div className="grid items-start gap-6 xl:grid-cols-[1fr_320px]">
      <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-muted">AUJOURD'HUI</p><h3 className="mt-1 text-lg font-bold">Tes sessions</h3></div><span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-teal-950">{day?.blocks.filter((b) => b.block_type !== 'pause').length || 0} sessions</span></div>
        {!day?.blocks.length ? <EmptyState title="Ton planning est vide" text="Génère une journée type pour commencer." /> : <div className="space-y-3">
          {day.blocks.map((block) => block.block_type === 'pause' ? <div key={block.id} className={`flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-xs ${block.notes?.startsWith('Pause prière') ? 'border border-teal-100 bg-teal-50/70 text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200' : 'text-muted'}`}><span className="w-[60px] shrink-0 text-right font-semibold">{block.start_time.slice(0, 5)}</span>{block.notes?.startsWith('Pause prière') ? <><span className="font-semibold">{block.notes}</span><span className="ml-auto text-[11px] opacity-75">20 min · jusqu’à {block.end_time.slice(0, 5)}</span></> : <><span className="h-px min-w-5 flex-1 border-t border-dashed border-slate-200 dark:border-slate-700" /><span>{block.notes || 'Pause'}</span></>}</div> : <div key={block.id} className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 ${block.status === 'fait' ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="w-[68px] shrink-0"><p className="text-sm font-bold">{block.start_time.slice(0, 5)}</p><p className="text-[11px] text-muted">50 min</p></div>
            <div className="min-w-[140px] flex-1"><div className="mb-1 flex items-center gap-2"><span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-bold uppercase text-primary dark:bg-teal-950">{typeNames[block.block_type]}</span>{block.status === 'fait' && <Check size={14} className="text-emerald-600" />}</div><p className="text-sm font-semibold">{block.chapter_title || 'Révision générale'}</p><p className="text-xs text-muted">{block.subject || ''} {block.notes ? `· ${block.notes}` : ''}</p></div>
            <div className="flex gap-2">{block.status === 'prevu' ? <><button className="button-small button-done" onClick={() => setStatus(block.id, 'fait')}><Check size={14} /> Fait</button><button className="button-small button-skip" onClick={() => setStatus(block.id, 'saute')}><SkipForward size={14} /> Sauté</button></> : <span className={`text-xs font-bold ${block.status === 'fait' ? 'text-emerald-600' : 'text-slate-400'}`}>{block.status === 'fait' ? 'Terminé' : 'Sauté'}</span>}</div>
          </div>)}
        </div>}
      </Card>
      <Card>
        <div className="mb-5 flex items-center gap-2"><CirclePlay size={18} className="text-primary" /><h3 className="font-bold">Minuteur Pomodoro</h3></div>
        <div className="mb-6 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-muted dark:bg-slate-800">Séance de {WORK_DURATION_MINUTES} min · pause de {STANDARD_BREAK_MINUTES} min</div>
        <div className={`mx-auto grid h-48 w-48 place-items-center rounded-full border-[9px] ${alarmRinging ? 'border-rose-100 dark:border-rose-950' : 'border-teal-50 dark:border-slate-800'}`}><div className="text-center"><p className={`text-4xl font-extrabold tracking-tight ${alarmRinging ? 'text-rose-600 dark:text-rose-400' : ''}`}>{formatTime(remaining)}</p><p aria-live="assertive" className={`mt-1 flex items-center justify-center gap-1 text-xs ${alarmRinging ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-muted'}`}>{alarmRinging && <AlertCircle size={13} />}{alarmRinging ? `${alarmIsPrayer ? 'Adhan' : 'Temps écoulé'} · alarme active` : 'Concentration'}</p></div></div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{!alarmRinging && <button className="button-primary" onClick={toggleTimer}>{running ? <Pause size={16} /> : <Play size={16} />}{running ? 'Mettre en pause' : 'Démarrer'}</button>}<button className={alarmRinging ? 'button-alarm-reset' : 'icon-button'} onClick={resetTimer} aria-label="Réinitialiser le minuteur">{alarmRinging ? <><RotateCcw size={15} /> Arrêter l’alarme et réinitialiser</> : <RotateCcw size={16} />}</button></div>
        <p className={`mt-4 text-center text-xs ${alarmRinging ? 'font-medium text-rose-600 dark:text-rose-400' : 'text-muted'}`}>{alarmRinging ? `${alarmIsPrayer ? 'L’adhan en arabe' : 'L’annonce vocale'} se répète jusqu’à la réinitialisation. Prends ta pause de ${alarmBreakMinutes} minutes.` : `À la fin des ${WORK_DURATION_MINUTES} minutes, une annonce vocale se répétera jusqu’à la réinitialisation.`}</p>
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={15} className="text-primary" />
            <p className="text-xs font-semibold">Rappels de prière</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {prayerTimes.map(({ name, time }) => (
              <button
                key={name}
                type="button"
                className={`flex min-h-12 items-center justify-between rounded-lg border px-3 text-left ${prayerReminders[name] ? 'border-teal-100 bg-teal-50/70 dark:border-teal-900 dark:bg-teal-950/30' : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'}`}
                aria-pressed={prayerReminders[name]}
                onClick={() => togglePrayerReminder(name)}
                disabled={alarmRinging}
              >
                <span>
                  <span className="block text-xs font-semibold">{name}</span>
                  <span className="text-[10px] text-muted">{time}</span>
                </span>
                <span className={`text-[9px] font-semibold ${prayerReminders[name] ? 'text-primary' : 'text-muted'}`}>
                  {prayerReminders[name] ? 'Activé' : 'Désactivé'}
                </span>
              </button>
            ))}
          </div>
          <button type="button" className="button-small button-skip mt-3 w-full justify-center" onClick={toggleRecordingList} aria-expanded={recordingListOpen}>
            <AudioLines size={14} /> {recordingListOpen ? 'Masquer les enregistrements' : 'Choisir un enregistrement d’adhan'}
            {recordingListOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {recordingListOpen && <div className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2 dark:border-slate-800">
            {adhanRecordings.map((recording) => (
                <div key={recording.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="radio"
                    name="adhan-recording"
                    value={recording.id}
                    checked={selectedRecordingId === recording.id}
                    onChange={() => chooseAdhanRecording(recording.id)}
                    className="accent-teal-700"
                    disabled={alarmRinging}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium">{recording.name}</span>
                  </span>
                  <button
                    type="button"
                    className="button-small button-skip"
                    onClick={() => previewRecording(recording)}
                    disabled={alarmRinging}
                    aria-label={`${previewingRecordingId === recording.id ? 'Arrêter' : 'Écouter'} ${recording.name}`}
                  >
                    {previewingRecordingId === recording.id ? <Pause size={13} /> : <Volume2 size={13} />}
                    {previewingRecordingId === recording.id ? 'Arrêter' : 'Écouter'}
                  </button>
                </div>
              ))}
          </div>}
          <p className="mt-2 text-[10px] leading-4 text-muted">L’enregistrement sélectionné sera joué à l’horaire de chaque rappel activé et répété jusqu’à réinitialisation. Le choix est mémorisé sur cet appareil.</p>
        </div>
        {error && <p role="alert" className="mt-3 text-center text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        {chapters.length === 0 && <p className="mt-5 text-xs text-amber-600">Ajoute des chapitres pour personnaliser ton planning.</p>}
      </Card>
    </div>
  </>;
}
