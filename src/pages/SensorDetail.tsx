import { BellRing, CalendarRange, Gauge, ScanSearch, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { AnalysesByDayChart, QualityLegend } from '../components/charts/Charts';
import { GrapeScene } from '../components/grape/GrapeScene';
import { PageHero } from '../components/layout/PageHero';
import { QualityBadge, SensorStatusBadge, VarietyTag } from '../components/ui/Badges';
import { PeriodSegmented } from '../components/ui/Filters';
import { KpiCard } from '../components/ui/KpiCard';
import { BatteryMeter, SignalMeter } from '../components/ui/Meters';
import { useData } from '../context/DataContext';
import { QUALITY_COLOR } from '../data/labels';
import type { Reading } from '../data/types';
import { VARIETY_BY_ID } from '../data/varieties';
import { formatDate, formatDateTime, formatRelative, formatShortDate, formatTime } from '../lib/format';
import { avgConfidence, countByQuality, filterReadings, ratio, timeBuckets, type PeriodPreset } from '../lib/stats';
import { resolveImageUrl } from '../services/api';
import NotFound from './NotFound';

const PAGE = 12;

export default function SensorDetail() {
  const { id } = useParams();
  const { sensorById, readings, now } = useData();
  const sensor = id ? sensorById[id] : undefined;
  const [period, setPeriod] = useState<PeriodPreset>('7');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<Reading | null>(null);

  const own = useMemo(() => readings.filter((r) => r.sensorId === id), [readings, id]);
  const list = useMemo(() => filterReadings(own, { period, from, to }, now), [own, period, from, to, now]);
  const buckets = useMemo(() => timeBuckets(list, { period, from, to }, now), [list, period, from, to, now]);

  if (!sensor) return <NotFound />;
  const counts = countByQuality(list);
  const last = own[0];

  return (
    <>
      <PageHero
        crumbs={[{ to: '/sensores', label: 'Sensores' }]}
        eyebrow={`${sensor.device} · firmware ${sensor.firmware}`}
        title={`Sensor ${sensor.id}`}
        description={
          <>
            {sensor.name} · Local: {sensor.location} · Variedade do talhão: {VARIETY_BY_ID[sensor.varietyId].name}
          </>
        }
        actions={<SensorStatusBadge status={sensor.status} />}
      />
      <div className="container page-body">
        <div className="card toolbar" style={{ marginBottom: 20 }}>
          <div className="toolbar-group">
            <span className="toolbar-label">
              <CalendarRange /> Período
            </span>
            <PeriodSegmented
              value={period}
              onChange={(p) => {
                setPeriod(p);
                setLimit(PAGE);
              }}
              options={[
                { value: '1', label: 'Hoje' },
                { value: '7', label: '7 dias' },
                { value: '30', label: '30 dias' },
                { value: 'custom', label: 'Personalizado' },
              ]}
            />
            {period === 'custom' && (
              <div className="row" style={{ gap: 8 }}>
                <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Data inicial" style={{ width: 160 }} />
                <span className="muted">até</span>
                <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Data final" style={{ width: 160 }} />
              </div>
            )}
          </div>
          <div className="toolbar-group">
            <BatteryMeter value={sensor.battery} />
            <SignalMeter dbm={sensor.signal} />
          </div>
        </div>

        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <KpiCard icon={<ScanSearch />} label="Análises no período" value={counts.total} />
          <KpiCard icon={<Gauge />} label="Leituras “Boa”" value={ratio(counts.boa, counts.total) * 100} decimals={1} suffix="%" accent="good" />
          <KpiCard icon={<Sparkles />} label="Confiança média" value={avgConfidence(list) * 100} decimals={1} suffix="%" />
          <KpiCard icon={<BellRing />} label="Alertas" value={counts.atencao + counts.critica} accent="warn" foot={`${counts.critica} necessitam atenção`} />
        </div>

        <div className="grid-main-side" style={{ marginTop: 20 }}>
          <ChartCard
            title="Leituras do sensor"
            subtitle="Classificação por período"
            legend={<QualityLegend counts={counts} />}
            table={{ columns: ['Período', 'Boa', 'Atenção', 'Necessita atenção'], rows: buckets.map((b) => [b.label, b.boa, b.atencao, b.critica]) }}
          >
            <AnalysesByDayChart days={buckets} />
          </ChartCard>
          <section className="card card-pad sensor-panel">
            <h3 className="card-title">Última captura</h3>
            {last ? (
              <>
                <button onClick={() => setOpen(last)} style={{ borderRadius: 16, overflow: 'hidden' }} aria-label="Abrir última captura">
                  <GrapeScene
                    className="scene"
                    seed={last.imageSeed}
                    varietyId={last.varietyId}
                    detections={last.detections}
                    capturedAt={last.capturedAt}
                    sensorId={sensor.id}
                    block={sensor.block}
                    imageUrl={resolveImageUrl(last)}
                    hud
                  />
                </button>
                <dl className="kv">
                  <dt>Data</dt>
                  <dd>{formatDateTime(last.capturedAt)}</dd>
                  <dt>Resultado</dt>
                  <dd>
                    <QualityBadge quality={last.quality} />
                  </dd>
                </dl>
              </>
            ) : (
              <div className="empty">Sem leituras registradas.</div>
            )}
            <dl className="kv">
              <dt>Variedade</dt>
              <dd>
                <VarietyTag id={sensor.varietyId} />
              </dd>
              <dt>Intervalo de captura</dt>
              <dd>{sensor.captureIntervalMin} min</dd>
              <dt>Instalado em</dt>
              <dd>{formatDate(`${sensor.installedAt}T12:00:00`)}</dd>
              <dt>Coordenadas</dt>
              <dd className="mono">
                {sensor.lat.toFixed(5)}, {sensor.lng.toFixed(5)}
              </dd>
              <dt>Última comunicação</dt>
              <dd>{formatRelative(sensor.lastCommunication)}</dd>
            </dl>
          </section>
        </div>

        <section className="card card-pad" style={{ marginTop: 20 }}>
          <div className="card-head">
            <div>
              <h3 className="card-title">Últimas leituras</h3>
              <p className="card-sub">
                {list.length} leituras no período · {sensor.location}
              </p>
            </div>
            <Link to={`/historico?sensor=${sensor.id}`} className="link">
              Abrir no histórico
            </Link>
          </div>
          {list.length === 0 ? (
            <div className="empty">Nenhuma leitura neste período.</div>
          ) : (
            <ol className="timeline">
              {list.slice(0, limit).map((r) => (
                <li key={r.id} style={{ ['--q' as string]: QUALITY_COLOR[r.quality] }}>
                  <time dateTime={r.capturedAt}>
                    {formatShortDate(r.capturedAt)} — {formatTime(r.capturedAt)}
                    <small className="mono">{r.id}</small>
                  </time>
                  <div>
                    <strong style={{ fontSize: 14 }}>{VARIETY_BY_ID[r.varietyId].name}</strong>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {' '}
                      — {r.visualCondition}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 10 }}>
                    <QualityBadge quality={r.quality} />
                    <button className="link" onClick={() => setOpen(r)}>
                      Visualizar
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {list.length > limit && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLimit((l) => l + PAGE)}>
                Carregar mais ({list.length - limit} restantes)
              </button>
            </div>
          )}
        </section>
      </div>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </>
  );
}
