import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleCheck, Cpu, ImageUp, RotateCcw, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { useSensors } from '../../hooks/queries';
import { formatBytes, toLocalInput } from '../../lib/format';
import { uploadImage } from '../../services/api';
import { EmptyState, errorMessage, LoadingBlock } from '../ui/States';
import { useToast } from '../ui/Toast';
import { ReadingDetail } from './ReadingDetail';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 8;

/** Envio manual de imagem: validação → upload → análise na API → gravação → resultado. */
export function ImageUpload() {
  const sensors = useSensors();
  const qc = useQueryClient();
  const toast = useToast();
  const [sensorId, setSensorId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState<Reading | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const active = (sensors.data ?? []).filter((s) => s.active);

  useEffect(() => {
    if (!sensorId && active.length) setSensorId(active[0].id);
  }, [active, sensorId]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
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

  const pick = (f: File | undefined) => {
    setLocalError(null);
    mutation.reset();
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setLocalError('Formato não suportado. Envie JPEG, PNG ou WEBP.');
    if (f.size > MAX_MB * 1024 * 1024) return setLocalError(`A imagem tem ${formatBytes(f.size)}; o limite é ${MAX_MB} MB.`);
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

  if (result)
    return (
      <section className="card">
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
              <RotateCcw /> Enviar outra imagem
            </button>
          </div>
        </div>
        <ReadingDetail reading={result} />
      </section>
    );

  const sensor = active.find((s) => s.id === sensorId);
  return (
    <section className="card card-pad upload">
      <div className="upload-grid">
        <div>
          <div
            className={`dropzone ${drag ? 'is-drag' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
          >
            {preview ? (
              <>
                <img src={preview} alt="Pré-visualização da imagem selecionada" />
                <button className="icon-btn dropzone-clear" onClick={reset} aria-label="Remover imagem" disabled={mutation.isPending}>
                  <X />
                </button>
              </>
            ) : (
              <button type="button" className="dropzone-empty" onClick={() => input.current?.click()}>
                <ImageUp aria-hidden="true" />
                <strong>Arraste a foto do cacho ou clique para escolher</strong>
                <span>JPEG, PNG ou WEBP · até {MAX_MB} MB · os metadados (inclusive GPS) são removidos no servidor</span>
              </button>
            )}
            <input ref={input} type="file" accept={ACCEPT.join(',')} hidden onChange={(e) => pick(e.target.files?.[0])} />
          </div>
          {file && (
            <p className="muted small" style={{ marginTop: 8 }}>
              {file.name} · {formatBytes(file.size)}
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
            {sensor && <span className="field-hint">Variedade do talhão: {VARIETY_BY_ID[sensor.varietyId]?.name ?? sensor.varietyId}. A análise de cor usa essa informação.</span>}
          </div>
          <div className="field">
            <label htmlFor="up-at">Data e hora da captura</label>
            <input id="up-at" className="input" type="datetime-local" value={capturedAt} max={toLocalInput(new Date())} onChange={(e) => setCapturedAt(e.target.value)} disabled={mutation.isPending} />
            <span className="field-hint">Deixe em branco para usar o horário do envio.</span>
          </div>
          {(localError || mutation.isError) && (
            <div className="form-error" role="alert">
              {localError ?? errorMessage(mutation.error)}
            </div>
          )}
          {mutation.isPending && (
            <div className="upload-progress" role="status">
              <span className="spinner" aria-hidden="true" />
              Enviando e analisando a imagem…
            </div>
          )}
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={!file || !sensorId || mutation.isPending}>
            <Upload /> Analisar imagem
          </button>
          <ol className="pipeline-mini" aria-label="Etapas">
            <li>Validação do arquivo</li>
            <li>Correção de orientação e remoção de metadados</li>
            <li>Detecção do cacho e de anomalias</li>
            <li>Classificação e maturação</li>
            <li>Gravação da imagem, miniatura e resultado</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
