import { BrainCircuit, Camera, Cpu, Database, Fingerprint, ImageUp, Pause, Play, Radio, Send, Tags, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { simulateCapture } from '../../data/generate';
import type { PipelineStage, Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatTime } from '../../lib/format';
import { isApiMode, resolveImageUrl, uploadImage } from '../../services/api';
import { GrapeScene } from '../grape/GrapeScene';
import { StageBadge } from '../ui/Badges';
import { ReadingModal } from './ReadingModal';
import { ReadingThumb } from './ReadingListItem';
import { YoloResult } from './YoloResult';

export const PIPELINE_STEPS = [
  { label: 'Sensor IoT', icon: Radio },
  { label: 'Captura', icon: Camera },
  { label: 'Envio', icon: Send },
  { label: 'Processamento', icon: Cpu },
  { label: 'YOLO / IA', icon: BrainCircuit },
  { label: 'Identificação', icon: Fingerprint },
  { label: 'Classificação', icon: Tags },
  { label: 'Armazenamento', icon: Database },
];

/** Estado visual da leitura em cada etapa do pipeline. */
function stageFor(step: number): PipelineStage {
  if (step < 3) return 'recebida';
  if (step === 3) return 'processando';
  if (step < 7) return 'analisando';
  return 'concluida';
}

const STEP_MS = 700;

interface Job {
  reading: Reading;
  step: number;
  uploaded?: boolean;
}

export function PipelineSimulator() {
  const { sensors, addReading, lastSeq } = useData();
  const available = sensors.filter((s) => s.status !== 'offline');
  const [sensorId, setSensorId] = useState(available[0]?.id ?? '');
  const [job, setJob] = useState<Job | null>(null);
  const [history, setHistory] = useState<Job[]>([]);
  const [auto, setAuto] = useState(false);
  const [open, setOpen] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const busy = !!job && job.step < PIPELINE_STEPS.length;

  const start = useCallback(
    (reading: Reading, uploaded = false) => {
      const j = { reading, step: 0, uploaded };
      setJob(j);
      setHistory((h) => [j, ...h].slice(0, 8));
    },
    [],
  );

  const capture = useCallback(
    (targetId?: string) => {
      const sensor = sensors.find((s) => s.id === (targetId ?? sensorId));
      if (!sensor || sensor.status === 'offline') return;
      setError(null);
      start(simulateCapture(sensor, lastSeq()));
    },
    [sensors, sensorId, lastSeq, start],
  );

  // Avança as etapas do pipeline.
  useEffect(() => {
    if (!job || job.step >= PIPELINE_STEPS.length) return;
    const t = setTimeout(() => {
      const next = { ...job, step: job.step + 1 };
      setJob(next);
      setHistory((h) => h.map((x) => (x.reading.id === job.reading.id ? next : x)));
      if (next.step === PIPELINE_STEPS.length) addReading({ ...next.reading, stage: 'concluida' });
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [job, addReading]);

  // Modo automático: nova captura de um sensor aleatório a cada ~9 s.
  useEffect(() => {
    if (!auto || busy) return;
    const t = setTimeout(() => {
      const s = available[Math.floor(Math.random() * available.length)];
      if (s) capture(s.id);
    }, 2500);
    return () => clearTimeout(t);
  }, [auto, busy, available, capture]);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    const sensor = sensors.find((s) => s.id === sensorId);
    if (!sensor) return;
    if (isApiMode) {
      try {
        const reading = await uploadImage(sensor.id, file);
        start(reading, true);
      } catch (e) {
        setError((e as Error).message);
      }
      return;
    }
    const reading = simulateCapture(sensor, lastSeq());
    start({ ...reading, imageUrl: URL.createObjectURL(file), detections: [], observations: `${reading.observations} (resultado simulado — conecte a API com o modelo YOLO para inferência real).` }, true);
  };

  const r = job?.reading;
  const step = job?.step ?? -1;
  const done = step >= PIPELINE_STEPS.length;

  return (
    <div className="stack">
      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h3 className="card-title">Fluxo de registro e processamento</h3>
            <p className="card-sub">Cada imagem enviada pelos sensores percorre o pipeline abaixo até ser armazenada no histórico.</p>
          </div>
          {job && <StageBadge stage={done ? 'concluida' : stageFor(step)} />}
        </div>
        <div className="pipeline" aria-label="Etapas do pipeline">
          {PIPELINE_STEPS.map((s, i) => (
            <div key={s.label} className={`pipe-step ${i < step || done ? 'done' : ''} ${i === step && !done ? 'current' : ''}`}>
              <div className="pipe-icon">
                <s.icon />
              </div>
              {s.label}
            </div>
          ))}
        </div>

        <div className="capture-layout">
          <div className="capture-view">
            {r && step >= 1 ? (
              <GrapeScene
                key={r.id + (step >= 4 ? 'b' : 'a')}
                className="scene"
                seed={r.imageSeed}
                varietyId={r.varietyId}
                detections={r.detections}
                capturedAt={r.capturedAt}
                sensorId={r.sensorId}
                block={r.block}
                imageUrl={resolveImageUrl(r)}
                hud
                showBoxes={step >= 4}
                animateBoxes
                scanning={step >= 3 && step < 6}
              />
            ) : (
              <div className="capture-empty">
                {r ? <span className="spinner" style={{ width: 36, height: 36, color: 'var(--rose-300)' }} /> : <Camera />}
                <strong style={{ color: '#fff' }}>{r ? `Acionando ${r.sensorId}…` : 'Aguardando captura'}</strong>
                <span style={{ fontSize: 13.5 }}>{r ? 'Solicitando imagem ao ESP32-CAM' : 'Selecione um sensor e simule uma captura para ver o pipeline em ação.'}</span>
              </div>
            )}
            {r && step >= 1 && (
              <div className="capture-status">
                <StageBadge stage={done ? 'concluida' : stageFor(step)} />
              </div>
            )}
          </div>

          <div className="capture-controls">
            <div className="field">
              <label htmlFor="sensor-sel">Sensor</label>
              <select id="sensor-sel" className="select" value={sensorId} onChange={(e) => setSensorId(e.target.value)} disabled={busy}>
                {sensors.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.status === 'offline'}>
                    {s.id} · {s.block} · {VARIETY_BY_ID[s.varietyId].name}
                    {s.status === 'offline' ? ' (offline)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => capture()} disabled={busy}>
                <Zap /> Simular captura
              </button>
              <label className="switch">
                <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
                {auto ? <Pause size={16} /> : <Play size={16} />} Captura automática
              </label>
            </div>
            <label className="upload-drop">
              <ImageUp />
              <span>
                <strong>Enviar imagem para análise</strong>
                <br />
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {isApiMode ? 'A imagem será enviada ao endpoint /ingest e analisada pelo modelo.' : 'No modo demonstração o resultado é simulado.'}
                </span>
              </span>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} disabled={busy} />
            </label>
            {error && <div className="form-error">{error}</div>}

            {r && done ? (
              <div className="stack" style={{ gap: 12 }}>
                <YoloResult reading={r} animate />
                <button className="btn btn-secondary" onClick={() => setOpen(r)}>
                  Ver análise completa
                </button>
              </div>
            ) : (
              <div className="notice">
                <BrainCircuit />
                <span>
                  O resultado do modelo aparece aqui ao final do pipeline: variedade identificada, confiança, condição visual, maturação e classificação.
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {history.length > 0 && (
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h3 className="card-title">Leituras desta sessão</h3>
              <p className="card-sub">Estados: Imagem recebida → Processando → Analisando → Resultado disponível</p>
            </div>
          </div>
          <div className="queue">
            {history.map((h) => {
              const st: PipelineStage = h.step >= PIPELINE_STEPS.length ? 'concluida' : stageFor(h.step);
              return (
                <button key={h.reading.id} className="queue-item" onClick={() => st === 'concluida' && setOpen(h.reading)} disabled={st !== 'concluida'}>
                  <ReadingThumb reading={h.reading} />
                  <div className="list-body">
                    <strong>
                      {h.reading.id} · {st === 'concluida' ? VARIETY_BY_ID[h.reading.varietyId].name : 'identificando…'}
                    </strong>
                    <span>
                      {h.reading.sensorId} · {h.reading.block} · {formatTime(h.reading.capturedAt)}
                      {h.uploaded ? ' · imagem enviada' : ''}
                    </span>
                  </div>
                  <StageBadge stage={st} />
                </button>
              );
            })}
          </div>
        </section>
      )}
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </div>
  );
}
