import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Cpu, ImageUp, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { useAnalysisModel, useSensors } from '../../hooks/queries';
import { formatBytes, toLocalInput } from '../../lib/format';
import { ACCEPTED_IMAGE_TYPES, decodeImage, validateImageFile } from '../../lib/upload';
import { uploadImage } from '../../services/api';
import { ApiError } from '../../services/http';
import { EmptyState, errorMessage, LoadingBlock } from '../ui/States';
import { useToast } from '../ui/Toast';
import { AnalysisComparison, DetectionSummary } from './AnalysisResult';
import { ModelInfo } from './ModelInfo';
import { ReadingDetail } from './ReadingDetail';

const STEPS = ['Escolha a foto', 'Confira a prévia', 'Envie para análise', 'Veja o resultado'];

/** Orientação prática conforme o erro devolvido pela API. */
function errorHint(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;
  if (error.isNetwork) return 'Confira se a API está em execução e tente novamente.';
  if (error.status === 409) return 'Escolha outro horário de captura ou deixe o campo em branco para usar o horário do envio.';
  if (error.status === 413) return 'Reduza a resolução ou comprima a foto antes de enviar.';
  if (error.status === 415) return 'Envie uma foto JPEG, PNG ou WEBP que abra normalmente no computador ou no celular.';
  if (error.status === 503 || error.status === 504) return 'O serviço de análise está ocupado ou indisponível. Aguarde alguns instantes e envie novamente.';
  return null;
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return setSeconds(0);
    const start = Date.now();
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(t);
  }, [active]);
  return seconds;
}

/** Envio de foto: validação → prévia → análise na API (detector em uso) → resultado com caixas e classes. */
export function ImageUpload() {
  const sensors = useSensors();
  const model = useAnalysisModel();
  const qc = useQueryClient();
  const toast = useToast();
  const [sensorId, setSensorId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);
  const [capturedAt, setCapturedAt] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<Reading | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const active = (sensors.data ?? []).filter((s) => s.active);
  const maxMb = model.data?.maxUploadMb ?? 8;

  useEffect(() => {
    if (!sensorId && active.length) setSensorId(active[0].id);
  }, [active, sensorId]);

  // Prévia só depois de o navegador conseguir decodificar a imagem (arquivos corrompidos param aqui).
  useEffect(() => {
    if (!file) {
      setPreview(null);
      setDims(null);
      return;
    }
    const url = URL.createObjectURL(file);
    let alive = true;
    decodeImage(url)
      .then((d) => {
        if (!alive) return;
        setPreview(url);
        setDims(d);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setLocalError(e.message);
        setFile(null);
      });
    return () => {
      alive = false;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const mutation = useMutation({
    mutationFn: () => uploadImage(sensorId, file!, capturedAt ? new Date(capturedAt).toISOString() : undefined),
    onSuccess: (reading) => {
      setResult(reading);
      void qc.invalidateQueries({ queryKey: ['readings'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
      void qc.invalidateQueries({ queryKey: ['sensors'] });
      toast.success(`Análise ${reading.id} concluída e registrada.`);
    },
  });
  const elapsed = useElapsed(mutation.isPending);

  const pick = (f: File | undefined) => {
    setLocalError(null);
    mutation.reset();
    if (!f) return;
    const problem = validateImageFile(f, maxMb);
    if (problem) {
      setFile(null);
      if (input.current) input.current.value = '';
      return setLocalError(problem);
    }
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setCapturedAt('');
    setLocalError(null);
    mutation.reset();
    if (input.current) input.current.value = '';
  };

  if (sensors.isPending) return <LoadingBlock />;
  if (!active.length)
    return (
      <div className="card">
        <EmptyState icon={<Cpu aria-hidden="true" />} title="Nenhum sensor ativo" action={<Link to="/sensores" className="btn btn-secondary btn-sm">Ir para sensores</Link>}>
          Toda análise é associada a um sensor (talhão e variedade). Cadastre ou reative um sensor para enviar imagens.
        </EmptyState>
      </div>
    );

  const step = result ? 3 : mutation.isPending ? 2 : preview ? 1 : 0;
  const stepper = (
    <ol className="upload-steps" aria-label="Etapas do envio">
      {STEPS.map((s, i) => (
        <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
          <span>{i < step ? <CircleCheck aria-hidden="true" /> : i + 1}</span>
          {s}
        </li>
      ))}
    </ol>
  );

  if (result)
    return (
      <section className="card upload-result">
        {stepper}
        <div className="upload-done">
          <CircleCheck aria-hidden="true" />
          <div>
            <strong>Análise {result.id} registrada</strong>
            <span>A leitura já aparece no histórico, nos indicadores e na página do sensor.</span>
          </div>
          <div className="row" style={{ gap: 8, marginLeft: 'auto' }}>
            <Link to={`/historico/${result.id}`} className="btn btn-secondary btn-sm">
              Abrir análise
            </Link>
            <button className="btn btn-primary btn-sm" onClick={reset}>
              <RotateCcw /> Enviar outra foto
            </button>
          </div>
        </div>
        <div className="upload-result-body">
          <AnalysisComparison reading={result} />
          <DetectionSummary reading={result} anomalyMinConfidence={model.data?.anomalyMinConfidence} />
          <ReadingDetail reading={result} infoOnly />
        </div>
      </section>
    );

  const sensor = active.find((s) => s.id === sensorId);
  const hint = mutation.isError ? errorHint(mutation.error) : null;
  return (
    <section className="card card-pad upload">
      {stepper}
      <div className="upload-grid">
        <div>
          <div
            className={`dropzone ${drag ? 'is-drag' : ''} ${preview ? 'has-file' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <>
                <img src={preview} alt="Prévia da foto selecionada" />
                <button className="icon-btn dropzone-clear" onClick={reset} aria-label="Remover foto" disabled={mutation.isPending}>
                  <X />
                </button>
              </>
            ) : (
              <button type="button" className="dropzone-empty" onClick={() => input.current?.click()}>
                <ImageUp aria-hidden="true" />
                <strong>Arraste a foto do cacho ou clique para escolher</strong>
                <span>JPEG, PNG ou WEBP · até {maxMb} MB · os metadados (inclusive GPS) são removidos no servidor</span>
              </button>
            )}
            <input ref={input} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          {file && preview && (
            <p className="muted small" style={{ marginTop: 8 }}>
              {file.name} · {formatBytes(file.size)}
              {dims ? ` · ${dims.width} × ${dims.height} px` : ''}
            </p>
          )}
        </div>
        <div className="form">
          <div className="field">
            <label htmlFor="up-sensor">Sensor / talhão</label>
            <select id="up-sensor" className="select" value={sensorId} onChange={(e) => setSensorId(e.target.value)} disabled={mutation.isPending}>
              {active.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name} ({s.block})
                </option>
              ))}
            </select>
            {sensor && (
              <span className="field-hint">
                Variedade do talhão: {VARIETY_BY_ID[sensor.varietyId]?.name ?? sensor.varietyId}.
                {model.data && !model.data.yoloLoaded && ' A análise de cor usa essa informação como variedade.'}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="up-at">Data e hora da captura</label>
            <input id="up-at" className="input" type="datetime-local" value={capturedAt} max={toLocalInput(new Date())} onChange={(e) => setCapturedAt(e.target.value)} disabled={mutation.isPending} />
            <span className="field-hint">Deixe em branco para usar o horário do envio.</span>
          </div>
          {(localError || mutation.isError) && (
            <div className="form-error" role="alert">
              {localError ?? errorMessage(mutation.error)}
              {hint && <span className="form-error-hint">{hint}</span>}
            </div>
          )}
          {mutation.isPending && (
            <div className="upload-progress" role="status">
              <span className="spinner" aria-hidden="true" />
              Enviando e analisando a foto… {elapsed > 0 && `${elapsed} s`}
              {model.data && elapsed >= 5 && <small>Limite de {model.data.timeoutSeconds.toFixed(0)} s por análise.</small>}
            </div>
          )}
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!preview || !sensorId || mutation.isPending}>
            <Upload /> {mutation.isError ? 'Tentar novamente' : 'Analisar foto'}
          </button>
          {model.data && <ModelInfo model={model.data} />}
        </div>
      </div>
    </section>
  );
}
