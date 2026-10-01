import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ChevronDown, ChevronUp, CircleCheck, Cpu, Download, FileSpreadsheet, FileUp, RotateCcw, ScanSearch, Thermometer, TriangleAlert } from 'lucide-react';
import { Fragment, useRef, useState, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState, ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { IMPORT_KIND_LABEL, IMPORT_STATUS_LABEL } from '../data/labels';
import type { ImportJob, ImportKind, ImportPreview, RowError } from '../data/types';
import { useImports } from '../hooks/queries';
import { formatBytes, formatDateTime, formatNumber } from '../lib/format';
import { downloadTemplate, previewImport, runImport } from '../services/api';

const KINDS: { kind: ImportKind; icon: typeof Cpu; text: string; required: string[]; optional: string[] }[] = [
  {
    kind: 'readings',
    icon: ScanSearch,
    text: 'Resultados de análises já realizadas (planilhas de campo, outro sistema, laboratório).',
    required: ['sensor_id', 'captured_at', 'quality', 'confidence'],
    optional: ['variety_id', 'maturation', 'classification', 'visual_condition', 'observations', 'clusters_detected', 'model_version'],
  },
  {
    kind: 'sensors',
    icon: Cpu,
    text: 'Cadastro de vários sensores de uma vez. Os tokens dos dispositivos são gerados depois, na página de cada sensor.',
    required: ['id', 'name', 'block', 'location', 'variety_id'],
    optional: ['latitude', 'longitude', 'device', 'firmware', 'capture_interval_min', 'installed_at'],
  },
  {
    kind: 'environment',
    icon: Thermometer,
    text: 'Temperatura, umidade, luminosidade e umidade do solo por sensor e horário (estação, datalogger).',
    required: ['sensor_id', 'measured_at'],
    optional: ['temperature_c', 'humidity_pct', 'luminosity_lux', 'soil_moisture_pct'],
  },
];

const ACCEPT = '.csv,.txt,.xlsx,.json';
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** Valor da amostra: datas/horas no horário local, vazios como "—". */
function cell(v: string | number | null | undefined) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'string' && ISO_DATETIME.test(v)) return formatDateTime(v);
  return String(v);
}
const MAX_MB = 10;

function ErrorTable({ errors, total }: { errors: RowError[]; total?: number }) {
  const [all, setAll] = useState(false);
  const shown = all ? errors : errors.slice(0, 15);
  return (
    <div className="error-table">
      <table className="table">
        <thead>
          <tr>
            <th className="num">Linha</th>
            <th>Coluna</th>
            <th>Problema</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((e, i) => (
            <tr key={i}>
              <td className="num mono">{e.row || '—'}</td>
              <td className="mono">{e.field ?? '—'}</td>
              <td>{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.length > 15 && (
        <button className="btn btn-ghost btn-sm" onClick={() => setAll((a) => !a)}>
          {all ? 'Mostrar menos' : `Mostrar todos os ${errors.length} erros`}
        </button>
      )}
      {total !== undefined && total > errors.length && <p className="muted small">Exibindo os primeiros {errors.length} de {total} erros.</p>}
    </div>
  );
}

function PreviewPanel({ preview, kind, onConfirm, onCancel, running, runError }: { preview: ImportPreview; kind: ImportKind; onConfirm: (mode: 'skip' | 'update') => void; onCancel: () => void; running: boolean; runError: string | null }) {
  const [mode, setMode] = useState<'skip' | 'update'>('skip');
  const toWrite = preview.valid + (mode === 'update' ? preview.duplicates : 0);
  const columns = preview.sample.length ? Object.keys(preview.sample[0]) : preview.columns;
  return (
    <section className="card card-pad">
      <div className="card-head">
        <div>
          <h3 className="card-title">Pré-visualização · {preview.filename}</h3>
          <p className="card-sub">Validação feita pelo servidor. Nada foi gravado ainda.</p>
        </div>
      </div>
      <div className="import-counts">
        <div>
          <span>Linhas no arquivo</span>
          <strong>{formatNumber(preview.total)}</strong>
        </div>
        <div className="tone-good">
          <span>Válidas e novas</span>
          <strong>{formatNumber(preview.valid)}</strong>
        </div>
        <div className="tone-warn">
          <span>Já existentes</span>
          <strong>{formatNumber(preview.duplicates)}</strong>
        </div>
        <div className="tone-bad">
          <span>Com erro</span>
          <strong>{formatNumber(preview.invalid)}</strong>
        </div>
      </div>

      {preview.sample.length > 0 && (
        <>
          <h4 className="subhead">Amostra do que será gravado</h4>
          <div className="table-wrap sample-table">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="mono">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sample.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c}>{cell(row[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {preview.errors.length > 0 && (
        <>
          <h4 className="subhead">
            <TriangleAlert aria-hidden="true" /> Linhas com erro (serão ignoradas)
          </h4>
          <ErrorTable errors={preview.errors} total={preview.invalid} />
        </>
      )}

      {preview.duplicates > 0 && (
        <fieldset className="radio-group">
          <legend>Registros que já existem ({formatNumber(preview.duplicates)})</legend>
          <label>
            <input type="radio" name="dup" checked={mode === 'skip'} onChange={() => setMode('skip')} /> Ignorar — manter o que já está gravado
          </label>
          <label>
            <input type="radio" name="dup" checked={mode === 'update'} onChange={() => setMode('update')} /> Atualizar com os valores do arquivo
          </label>
        </fieldset>
      )}

      {runError && <div className="form-error">{runError}</div>}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={running}>
          Escolher outro arquivo
        </button>
        <button className="btn btn-primary" onClick={() => onConfirm(mode)} disabled={running || toWrite === 0}>
          {running ? <span className="spinner" /> : <FileUp />} {toWrite === 0 ? 'Nada a importar' : `Importar ${formatNumber(toWrite)} ${kind === 'sensors' ? 'sensor(es)' : 'registro(s)'}`}
        </button>
      </div>
    </section>
  );
}

function JobResult({ job, onAgain }: { job: ImportJob; onAgain: () => void }) {
  const link = job.kind === 'sensors' ? '/sensores' : job.kind === 'readings' ? '/historico?origem=importacao' : '/sensores';
  return (
    <section className="card card-pad import-result">
      <div className="upload-done">
        <CircleCheck aria-hidden="true" />
        <div>
          <strong>Importação {IMPORT_STATUS_LABEL[job.status]?.toLowerCase()}</strong>
          <span>
            {formatNumber(job.inserted)} inserido(s) · {formatNumber(job.updated)} atualizado(s) · {formatNumber(job.duplicates)} já existente(s) ignorado(s) · {formatNumber(job.invalid)} com erro
          </span>
        </div>
      </div>
      {job.errors.length > 0 && <ErrorTable errors={job.errors} total={job.invalid} />}
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onAgain}>
          <RotateCcw /> Nova importação
        </button>
        <Link to={link} className="btn btn-primary">
          Ver dados importados <ArrowRight />
        </Link>
      </div>
    </section>
  );
}

function JobsHistory() {
  const jobs = useImports();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="card">
      <div className="card-head card-pad" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="card-title">Importações anteriores</h3>
          <p className="card-sub">Últimas 50 execuções, com resultado e erros por linha</p>
        </div>
      </div>
      {jobs.isPending ? (
        <LoadingBlock height={160} />
      ) : jobs.isError ? (
        <ErrorState error={jobs.error} compact onRetry={() => void jobs.refetch()} />
      ) : jobs.data.length === 0 ? (
        <EmptyState compact icon={<FileSpreadsheet aria-hidden="true" />} title="Nenhuma importação realizada" />
      ) : (
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Arquivo</th>
                <th>Situação</th>
                <th className="num">Inseridos</th>
                <th className="num">Atualizados</th>
                <th className="num">Ignorados</th>
                <th className="num">Com erro</th>
                <th>Responsável</th>
                <th aria-label="Detalhes" />
              </tr>
            </thead>
            <tbody>
              {jobs.data.map((j) => (
                <Fragment key={j.id}>
                  <tr>
                    <td data-label="Data">{formatDateTime(j.createdAt)}</td>
                    <td data-label="Tipo">{IMPORT_KIND_LABEL[j.kind]}</td>
                    <td data-label="Arquivo" className="mono small">
                      {j.filename}
                    </td>
                    <td data-label="Situação">
                      <span className={`badge badge-import-${j.status}`}>{IMPORT_STATUS_LABEL[j.status] ?? j.status}</span>
                    </td>
                    <td data-label="Inseridos" className="num">{formatNumber(j.inserted)}</td>
                    <td data-label="Atualizados" className="num">{formatNumber(j.updated)}</td>
                    <td data-label="Ignorados" className="num">{formatNumber(j.duplicates)}</td>
                    <td data-label="Com erro" className="num">{formatNumber(j.invalid)}</td>
                    <td data-label="Responsável">{j.createdByName ?? '—'}</td>
                    <td data-label="">
                      {j.errors.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setOpen(open === j.id ? null : j.id)} aria-expanded={open === j.id}>
                          Erros {open === j.id ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {open === j.id && (
                    <tr className="row-expanded">
                      <td colSpan={10}>
                        <ErrorTable errors={j.errors} total={j.invalid} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Import() {
  const [params, setParams] = useSearchParams();
  const kind = (KINDS.find((k) => k.kind === params.get('tipo'))?.kind ?? 'readings') as ImportKind;
  const qc = useQueryClient();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [job, setJob] = useState<ImportJob | null>(null);

  const preview = useMutation({ mutationFn: (f: File) => previewImport(kind, f) });
  const run = useMutation({
    mutationFn: (mode: 'skip' | 'update') => runImport(kind, file!, mode),
    onSuccess: (j) => {
      setJob(j);
      for (const key of ['readings', 'stats', 'sensors', 'imports']) void qc.invalidateQueries({ queryKey: [key] });
      toast.success(`Importação concluída: ${j.inserted} inserido(s), ${j.updated} atualizado(s).`);
    },
    onError: () => void qc.invalidateQueries({ queryKey: ['imports'] }),
  });

  const reset = () => {
    setFile(null);
    setJob(null);
    setLocalError(null);
    preview.reset();
    run.reset();
    if (input.current) input.current.value = '';
  };
  const setKind = (k: ImportKind) => {
    reset();
    const next = new URLSearchParams(window.location.search);
    next.set('tipo', k);
    setParams(next, { replace: true });
  };
  const pick = (f: File | undefined) => {
    reset();
    if (!f) return;
    if (!/\.(csv|txt|xlsx|json)$/i.test(f.name)) return setLocalError('Formato não suportado. Use CSV, Excel (.xlsx) ou JSON.');
    if (f.size > MAX_MB * 1024 * 1024) return setLocalError(`O arquivo tem ${formatBytes(f.size)}; o limite é ${MAX_MB} MB.`);
    setFile(f);
    preview.mutate(f);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  };
  const def = KINDS.find((k) => k.kind === kind)!;

  return (
    <div className="page">
      <PageHeader eyebrow="Dados de campo"
        title="Importação de dados" description="Traga dados reais de planilhas e outros sistemas. Cada linha é validada; duplicados e erros são identificados antes de gravar." />

      <div className="kind-grid" role="radiogroup" aria-label="Tipo de dado">
        {KINDS.map((k) => (
          <button key={k.kind} className={`card kind-card ${kind === k.kind ? 'is-selected' : ''}`} role="radio" aria-checked={kind === k.kind} onClick={() => setKind(k.kind)}>
            <k.icon aria-hidden="true" />
            <strong>{IMPORT_KIND_LABEL[k.kind]}</strong>
            <span>{k.text}</span>
          </button>
        ))}
      </div>

      {job ? (
        <JobResult job={job} onAgain={reset} />
      ) : preview.data && file ? (
        <PreviewPanel preview={preview.data} kind={kind} onConfirm={(m) => run.mutate(m)} onCancel={reset} running={run.isPending} runError={run.isError ? errorMessage(run.error) : null} />
      ) : (
        <section className="card card-pad">
          <div className="upload-grid">
            <div
              className={`dropzone ${drag ? 'is-drag' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              {preview.isPending ? (
                <div className="dropzone-empty" role="status">
                  <span className="spinner" aria-hidden="true" />
                  <strong>Validando {file?.name}…</strong>
                </div>
              ) : (
                <button type="button" className="dropzone-empty" onClick={() => input.current?.click()}>
                  <FileUp aria-hidden="true" />
                  <strong>Arraste o arquivo ou clique para escolher</strong>
                  <span>CSV (; ou ,), Excel .xlsx ou JSON · até {MAX_MB} MB</span>
                </button>
              )}
              <input ref={input} type="file" accept={ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} />
            </div>
            <div className="import-help">
              <h3 className="card-title">{IMPORT_KIND_LABEL[kind]}</h3>
              <p className="muted small">Cabeçalhos em português também são aceitos (ex.: “data_hora”, “qualidade”, “variedade”, “temperatura”).</p>
              <dl className="kv">
                <dt>Obrigatórias</dt>
                <dd className="mono small">{def.required.join(', ')}</dd>
                <dt>Opcionais</dt>
                <dd className="mono small">{def.optional.join(', ')}</dd>
              </dl>
              <ul className="bullets small">
                <li>Datas em dd/mm/aaaa hh:mm ou ISO 8601; sem fuso = horário da propriedade.</li>
                <li>Números com vírgula ou ponto decimal; confiança em 0–1 ou 0–100.</li>
                {kind !== 'sensors' && <li>Os sensores precisam estar cadastrados antes.</li>}
                {kind === 'readings' && <li>Qualidade: Boa, Atenção ou Necessita atenção.</li>}
              </ul>
              <button className="btn btn-secondary btn-sm" onClick={() => void downloadTemplate(kind).catch((e) => toast.error(errorMessage(e)))}>
                <Download /> Baixar modelo CSV
              </button>
            </div>
          </div>
          {(localError || preview.isError) && (
            <div className="form-error" role="alert" style={{ marginTop: 16 }}>
              {localError ?? errorMessage(preview.error)}
            </div>
          )}
        </section>
      )}

      <JobsHistory />
    </div>
  );
}
