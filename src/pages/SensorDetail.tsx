import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, ChevronLeft, ChevronRight, Gauge, KeyRound, Pause, Pencil, Play, ScanSearch, Sparkles, Thermometer } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReadingListItem } from '../components/analysis/ReadingListItem';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { AnalysesByDayChart, EnvironmentChart, QualityLegend, TelemetryChart } from '../components/charts/Charts';
import { PageHeader } from '../components/layout/PageHeader';
import { SensorForm, type SensorFormValues } from '../components/sensors/SensorForm';
import { TokenReveal } from '../components/sensors/TokenReveal';
import { SensorStatusBadge, VarietyTag } from '../components/ui/Badges';
import { PeriodPicker } from '../components/ui/Filters';
import { KpiCard } from '../components/ui/KpiCard';
import { BatteryMeter, SignalMeter } from '../components/ui/Meters';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import type { Reading } from '../data/types';
import { keys, useByDay, useReadings, useSensor, useSensorEnvironment, useSensorTelemetry, useSummary } from '../hooks/queries';
import { formatDate, formatDateTime, formatMeasure, formatNumber, formatRelative, formatShortDate, formatTime, toLocalInput } from '../lib/format';
import { PERIOD_TEXT } from '../lib/period';
import { usePeriodParams } from '../lib/usePeriodParams';
import { ApiError } from '../services/http';
import { addEnvironment, regenerateSensorToken, updateSensor } from '../services/api';
import NotFound from './NotFound';

const shortStamp = (iso: string) => `${formatShortDate(iso)} ${formatTime(iso)}`;

function EnvironmentForm({ sensorId, onDone }: { sensorId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [at, setAt] = useState(toLocalInput(new Date()));
  const [values, setValues] = useState({ temperatureC: '', humidityPct: '', luminosityLux: '', soilMoisturePct: '' });
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => {
      const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
      return addEnvironment(sensorId, {
        measuredAt: new Date(at).toISOString(),
        temperatureC: num(values.temperatureC),
        humidityPct: num(values.humidityPct),
        luminosityLux: num(values.luminosityLux),
        soilMoisturePct: num(values.soilMoisturePct),
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sensors', sensorId] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Medição registrada.');
      onDone();
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (Object.values(values).every((v) => v.trim() === '')) return setError('Informe ao menos uma medição.');
    if (Object.values(values).some((v) => v.trim() !== '' && Number.isNaN(Number(v.replace(',', '.'))))) return setError('Use apenas números.');
    setError(null);
    mutation.mutate();
  };
  const field = (k: keyof typeof values, label: string, hint: string) => (
    <div className="field">
      <label htmlFor={`env-${k}`}>{label}</label>
      <input id={`env-${k}`} className="input" inputMode="decimal" value={values[k]} onChange={(e) => setValues({ ...values, [k]: e.target.value })} placeholder={hint} />
    </div>
  );
  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="env-at">Data e hora da medição</label>
          <input id="env-at" className="input" type="datetime-local" value={at} max={toLocalInput(new Date())} onChange={(e) => setAt(e.target.value)} required />
        </div>
        {field('temperatureC', 'Temperatura (°C)', '−20 a 60')}
        {field('humidityPct', 'Umidade do ar (%)', '0 a 100')}
        {field('luminosityLux', 'Luminosidade (lux)', '0 a 200000')}
        {field('soilMoisturePct', 'Umidade do solo (%)', '0 a 100')}
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <span className="spinner" />} Registrar medição
        </button>
      </div>
    </form>
  );
}

export default function SensorDetail() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const sensor = useSensor(id);
  const { period, from, to, setPeriod, query } = usePeriodParams('30');
  const f = { ...query, sensorId: id };
  const summary = useSummary(f);
  const byDay = useByDay(f);
  const env = useSensorEnvironment(id, query);
  const telemetryDays = query.days ? Math.min(query.days, 366) : 90;
  const telemetry = useSensorTelemetry(id, telemetryDays);
  const [page, setPage] = useState(1);
  const readings = useReadings(f, page, 10);
  const [open, setOpen] = useState<Reading | null>(null);
  const [modal, setModal] = useState<'edit' | 'token' | 'env' | 'toggle' | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.sensors });
  };
  const edit = useMutation({
    mutationFn: (v: SensorFormValues) => {
      const { id: _id, lat, lng, ...rest } = v;
      return updateSensor(id, lat === null ? { ...rest, clearLocation: true } : { ...rest, lat, lng });
    },
    onSuccess: () => {
      refresh();
      toast.success('Sensor atualizado.');
      setModal(null);
    },
  });
  const regen = useMutation({ mutationFn: () => regenerateSensorToken(id), onSuccess: (r) => setToken(r.deviceToken) });
  const toggle = useMutation({
    mutationFn: (active: boolean) => updateSensor(id, { active }),
    onSuccess: (s) => {
      refresh();
      toast.success(s.active ? 'Sensor reativado.' : 'Sensor desativado.');
      setModal(null);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (sensor.isError && sensor.error instanceof ApiError && sensor.error.status === 404) return <NotFound inline title="Sensor não encontrado" back="/sensores" />;
  if (sensor.isPending) return <div className="page"><LoadingBlock height={480} /></div>;
  if (sensor.isError) return <div className="page"><ErrorState error={sensor.error} onRetry={() => void sensor.refetch()} /></div>;
  const s = sensor.data;
  const sum = summary.data;
  const envPoints = env.data ?? [];
  const telePoints = telemetry.data ?? [];

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ to: '/sensores', label: 'Sensores' }]}
        title={
          <span className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
            {s.name} <SensorStatusBadge status={s.status} />
          </span>
        }
        description={`${s.id} · ${s.block} · ${s.location}`}
        actions={
          <>
            <PeriodPicker value={period} from={from} to={to} onChange={setPeriod} />
            {can('gerenciarSensores') && (
              <button className="btn btn-secondary" onClick={() => setModal('edit')}>
                <Pencil /> Editar
              </button>
            )}
          </>
        }
      />
      <p className={`status-banner status-${s.status}`}>{s.statusReason}</p>

      <div className="kpi-grid">
        <KpiCard loading={summary.isPending} icon={<ScanSearch />} label="Leituras" value={sum?.readings ?? null} foot={PERIOD_TEXT[period]} />
        <KpiCard loading={summary.isPending} icon={<Gauge />} label="Qualidade (Boa)" value={sum?.qualityRatio != null ? sum.qualityRatio * 100 : null} decimals={1} suffix="%" accent="good" />
        <KpiCard loading={summary.isPending} icon={<Sparkles />} label="Confiança média" value={sum?.avgConfidence != null ? sum.avgConfidence * 100 : null} decimals={1} suffix="%" accent="neutral" />
        <KpiCard loading={summary.isPending} icon={<BellRing />} label="Alertas" value={sum?.alerts ?? null} accent="warn" foot={sum ? `${sum.quality.critica} necessitam atenção` : undefined} />
        <KpiCard
          loading={summary.isPending}
          icon={<Thermometer />}
          label="Temperatura média"
          value={sum?.environment.avgTemperatureC ?? null}
          decimals={1}
          suffix=" °C"
          accent="neutral"
          foot={sum?.environment.measurements ? `${formatNumber(sum.environment.measurements)} medições · umidade ${formatMeasure(sum.environment.avgHumidityPct, '%', 0)}` : 'sem medições ambientais'}
        />
      </div>

      <div className="grid-main-side">
        <ChartCard
          title="Leituras do sensor"
          subtitle={`Por dia · ${PERIOD_TEXT[period]}`}
          legend={<QualityLegend counts={sum?.quality} />}
          table={byDay.data ? { columns: ['Dia', 'Boa', 'Atenção', 'Necessita atenção'], rows: byDay.data.map((b) => [b.label, b.boa, b.atencao, b.critica]) } : undefined}
        >
          {!byDay.data ? <LoadingBlock /> : (sum?.readings ?? 0) === 0 ? <EmptyState compact title="Sem leituras no período" /> : <AnalysesByDayChart days={byDay.data} />}
        </ChartCard>
        <section className="card card-pad sensor-panel">
          <h3 className="card-title">Dispositivo</h3>
          <dl className="kv">
            <dt>Variedade do talhão</dt>
            <dd>
              <VarietyTag id={s.varietyId} />
            </dd>
            <dt>Dispositivo</dt>
            <dd>{s.device ?? '—'}</dd>
            <dt>Firmware</dt>
            <dd>{s.firmware ?? '—'}</dd>
            <dt>Bateria / sinal</dt>
            <dd className="row" style={{ gap: 10 }}>
              <BatteryMeter value={s.battery} />
              <SignalMeter dbm={s.signal} />
            </dd>
            <dt>Intervalo de captura</dt>
            <dd>{s.captureIntervalMin} min</dd>
            <dt>Última comunicação</dt>
            <dd>{s.lastCommunication ? `${formatDateTime(s.lastCommunication)} (${formatRelative(s.lastCommunication)})` : 'nunca'}</dd>
            <dt>Coordenadas</dt>
            <dd className="mono">{s.hasValidLocation ? `${s.lat!.toFixed(5)}, ${s.lng!.toFixed(5)}` : 'não informadas'}</dd>
            <dt>Instalado em</dt>
            <dd>{s.installedAt ? formatDate(`${s.installedAt}T12:00:00`) : '—'}</dd>
            <dt>Total de análises</dt>
            <dd>{formatNumber(s.analysesCount)}</dd>
          </dl>
          {(can('gerenciarSensores') || can('medicoesManuais')) && (
            <div className="panel-actions">
              {can('medicoesManuais') && (
                <button className="btn btn-secondary btn-sm" onClick={() => setModal('env')}>
                  <Thermometer /> Registrar medição
                </button>
              )}
              {can('gerenciarSensores') && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => setModal('token')}>
                    <KeyRound /> Gerar novo token
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal('toggle')}>
                    {s.active ? <Pause /> : <Play />} {s.active ? 'Desativar' : 'Reativar'}
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid-2">
        <ChartCard
          title="Condições ambientais"
          subtitle="Temperatura e umidade do ar medidas no talhão"
          table={envPoints.length ? { columns: ['Data/hora', 'Temperatura (°C)', 'Umidade (%)', 'Luminosidade (lux)', 'Umidade do solo (%)', 'Origem'], rows: envPoints.map((p) => [formatDateTime(p.measuredAt), p.temperatureC ?? '—', p.humidityPct ?? '—', p.luminosityLux ?? '—', p.soilMoisturePct ?? '—', p.source]) } : undefined}
        >
          {env.isPending ? (
            <LoadingBlock />
          ) : env.isError ? (
            <ErrorState error={env.error} compact />
          ) : envPoints.length === 0 ? (
            <EmptyState compact icon={<Thermometer aria-hidden="true" />} title="Sem medições ambientais no período">
              O dispositivo envia temperatura e umidade quando tem um DHT22; também é possível registrar ou importar medições.
            </EmptyState>
          ) : (
            <EnvironmentChart labels={envPoints.map((p) => shortStamp(p.measuredAt))} temperature={envPoints.map((p) => p.temperatureC)} humidity={envPoints.map((p) => p.humidityPct)} />
          )}
        </ChartCard>
        <ChartCard
          title="Bateria e sinal"
          subtitle={`Informados pelo dispositivo · últimos ${telemetryDays} dias`}
          table={telePoints.length ? { columns: ['Data/hora', 'Bateria (%)', 'Sinal (dBm)', 'Firmware'], rows: telePoints.map((p) => [formatDateTime(p.receivedAt), p.battery ?? '—', p.signal ?? '—', p.firmware ?? '—']) } : undefined}
        >
          {telemetry.isPending ? (
            <LoadingBlock />
          ) : telePoints.length === 0 ? (
            <EmptyState compact title="Sem telemetria no período">O histórico aparece quando o dispositivo envia bateria e sinal.</EmptyState>
          ) : (
            <TelemetryChart labels={telePoints.map((p) => shortStamp(p.receivedAt))} battery={telePoints.map((p) => p.battery)} signal={telePoints.map((p) => p.signal)} />
          )}
        </ChartCard>
      </div>

      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h3 className="card-title">Leituras do período</h3>
            <p className="card-sub">{readings.data ? `${formatNumber(readings.data.total)} leituras · ${PERIOD_TEXT[period]}` : ' '}</p>
          </div>
          <Link to={`/historico?sensor=${s.id}`} className="link">
            Abrir no histórico
          </Link>
        </div>
        {readings.isPending ? (
          <LoadingBlock height={200} />
        ) : readings.isError ? (
          <ErrorState error={readings.error} compact onRetry={() => void readings.refetch()} />
        ) : readings.data.items.length === 0 ? (
          <EmptyState compact title="Nenhuma leitura neste período" />
        ) : (
          <>
            <div className="list">
              {readings.data.items.map((r) => (
                <ReadingListItem key={r.id} reading={r} onOpen={setOpen} relative={false} />
              ))}
            </div>
            {readings.data.total > 10 && (
              <div className="pagination">
                <span>
                  Página {page} de {Math.ceil(readings.data.total / 10)}
                </span>
                <div className="row">
                  <button className="icon-btn" onClick={() => setPage((p) => p - 1)} disabled={page === 1} aria-label="Página anterior">
                    <ChevronLeft />
                  </button>
                  <button className="icon-btn" onClick={() => setPage((p) => p + 1)} disabled={page * 10 >= readings.data.total} aria-label="Próxima página">
                    <ChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <ReadingModal reading={open} onClose={() => setOpen(null)} />
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} label="Editar sensor" size="sm">
        <div className="modal-body">
          <h2 className="modal-title">Editar {s.id}</h2>
          <SensorForm initial={s} onSubmit={(v) => edit.mutate(v)} submitting={edit.isPending} submitLabel="Salvar alterações" serverError={edit.isError ? errorMessage(edit.error) : null} />
        </div>
      </Modal>
      <Modal open={modal === 'env'} onClose={() => setModal(null)} label="Registrar medição" size="sm">
        <div className="modal-body">
          <h2 className="modal-title">Registrar medição ambiental</h2>
          <p className="muted small">Lançamento manual para {s.id}. Fica identificado como “manual” no histórico.</p>
          <EnvironmentForm sensorId={s.id} onDone={() => setModal(null)} />
        </div>
      </Modal>
      <Modal
        open={modal === 'token'}
        onClose={() => {
          setModal(null);
          setToken(null);
          regen.reset();
        }}
        label="Gerar novo token"
        size="sm"
      >
        <div className="modal-body">
          {token ? (
            <TokenReveal sensorId={s.id} token={token} onDone={() => { setModal(null); setToken(null); regen.reset(); }} />
          ) : (
            <>
              <h2 className="modal-title">Gerar novo token?</h2>
              <p>O token atual de {s.id} deixará de funcionar imediatamente. O dispositivo só voltará a enviar dados depois de receber o novo token.</p>
              {regen.isError && <div className="form-error">{errorMessage(regen.error)}</div>}
              <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => setModal(null)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={() => regen.mutate()} disabled={regen.isPending}>
                  {regen.isPending && <span className="spinner" />} Gerar token
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
      <Modal open={modal === 'toggle'} onClose={() => setModal(null)} label="Alterar situação do sensor" size="sm">
        <div className="modal-body">
          <h2 className="modal-title">{s.active ? 'Desativar' : 'Reativar'} {s.id}?</h2>
          <p>{s.active ? 'Sensores desativados não recebem novas imagens e aparecem como “Inativo”. O histórico é mantido.' : 'O sensor volta a aceitar imagens e o status passa a ser calculado pela comunicação.'}</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className={`btn ${s.active ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggle.mutate(!s.active)} disabled={toggle.isPending}>
              {toggle.isPending && <span className="spinner" />} {s.active ? 'Desativar' : 'Reativar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
