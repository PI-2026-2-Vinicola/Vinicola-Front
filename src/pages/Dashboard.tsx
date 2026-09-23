import { ArrowRight, BellRing, Cpu, Gauge, Grape, ScanSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReadingListItem } from '../components/analysis/ReadingListItem';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { AnalysesByDayChart, HorizontalBars, QualityDonut, QualityEvolutionChart, QualityLegend } from '../components/charts/Charts';
import { PageHero } from '../components/layout/PageHero';
import { SensorMap } from '../components/map/SensorMap';
import { PeriodSegmented } from '../components/ui/Filters';
import { KpiCard } from '../components/ui/KpiCard';
import { Reveal } from '../components/ui/Reveal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { QUALITY_COLOR, QUALITY_LABEL, QUALITY_ORDER } from '../data/labels';
import { FARM } from '../data/sensors';
import type { Reading } from '../data/types';
import { VARIETIES } from '../data/varieties';
import { formatLongDate, formatNumber, formatPct } from '../lib/format';
import { countBy, countByQuality, filterReadings, previousPeriod, ratio, timeBuckets, trend, type PeriodPreset } from '../lib/stats';

const PERIOD_TEXT: Record<string, string> = { '1': 'hoje', '7': 'últimos 7 dias', '14': 'últimos 14 dias', '30': 'últimos 30 dias' };

export default function Dashboard() {
  const { user } = useAuth();
  const { sensors, readings, now, sensorStats } = useData();
  const [period, setPeriod] = useState<PeriodPreset>('7');
  const [open, setOpen] = useState<Reading | null>(null);

  const current = useMemo(() => filterReadings(readings, { period }, now), [readings, period, now]);
  const previous = useMemo(() => previousPeriod(readings, { period }, now), [readings, period, now]);
  const counts = countByQuality(current);
  const prevCounts = previous ? countByQuality(previous) : null;
  const buckets = useMemo(() => timeBuckets(current, { period }, now), [current, period, now]);
  const evolution = useMemo(() => timeBuckets(filterReadings(readings, { period: period === '1' ? '7' : period }, now), { period: period === '1' ? '7' : period }, now), [readings, period, now]);

  const active = sensors.filter((s) => s.status !== 'offline');
  const clusters = current.reduce((s, r) => s + r.clustersDetected, 0);
  const alerts = counts.atencao + counts.critica;
  const qualityNow = ratio(counts.boa, counts.total);
  const qualityPrev = prevCounts ? ratio(prevCounts.boa, prevCounts.total) : 0;

  const bySensor = countBy(current, (r) => r.sensorId);
  const byVariety = countBy(current, (r) => r.varietyId);
  const varietyRows = VARIETIES.map((v) => ({ v, n: byVariety[v.id] ?? 0 })).sort((a, b) => b.n - a.n);
  const recentAlerts = current.filter((r) => r.quality !== 'boa').slice(0, 5);
  const lastReadings = Object.fromEntries(Object.entries(sensorStats).map(([k, v]) => [k, v.lastReading]));

  return (
    <>
      <PageHero
        eyebrow="Visão geral"
        title={`Olá, ${user?.name.split(' ')[0]}.`}
        description={
          <>
            Operação de {formatLongDate(now)} em <strong style={{ color: '#fff' }}>{FARM.name}</strong> · {FARM.city}.
          </>
        }
      />
      <div className="container page-body">
        <div className="card toolbar" style={{ marginBottom: 20 }}>
          <div className="toolbar-group">
            <span className="toolbar-label">Período</span>
            <PeriodSegmented value={period} onChange={setPeriod} />
          </div>
          <div className="toolbar-group" style={{ fontSize: 13.5, color: 'var(--ink-500)' }}>
            Mostrando {formatNumber(counts.total)} análises · {PERIOD_TEXT[period]}
          </div>
        </div>

        <div className="kpi-grid">
          <KpiCard icon={<Cpu />} label="Sensores ativos" value={active.length} total={String(sensors.length)} foot={`${sensors.filter((s) => s.status === 'offline').length} offline · ${sensors.filter((s) => s.status === 'atencao').length} em atenção`} />
          <KpiCard icon={<ScanSearch />} label="Leituras realizadas" value={counts.total} delta={prevCounts ? trend(counts.total, prevCounts.total) : null} foot={prevCounts ? 'vs. período anterior' : PERIOD_TEXT[period]} />
          <KpiCard icon={<Grape />} label="Uvas analisadas" value={clusters} foot={`cachos em ${formatNumber(current.length)} imagens processadas`} />
          <KpiCard
            icon={<Gauge />}
            label="Qualidade geral"
            value={qualityNow * 100}
            decimals={1}
            suffix="%"
            accent="good"
            delta={prevCounts && prevCounts.total ? qualityNow - qualityPrev : null}
            foot={prevCounts ? 'p.p. de leituras “Boa”' : 'leituras classificadas como Boa'}
          />
          <KpiCard icon={<BellRing />} label="Alertas" value={alerts} accent={counts.critica ? 'bad' : 'warn'} foot={`${counts.critica} necessitam atenção · ${counts.atencao} em atenção`} />
        </div>

        <div className="grid-main-side" style={{ marginTop: 20 }}>
          <Reveal>
            <ChartCard
              title="Análises por período"
              subtitle={period === '1' ? 'Leituras por hora, hoje' : `Leituras por dia · ${PERIOD_TEXT[period]}`}
              legend={<QualityLegend />}
              table={{ columns: ['Período', 'Boa', 'Atenção', 'Necessita atenção', 'Total'], rows: buckets.map((b) => [b.label, b.boa, b.atencao, b.critica, b.total]) }}
            >
              <AnalysesByDayChart days={buckets} />
            </ChartCard>
          </Reveal>
          <Reveal delay={80}>
            <section className="card card-pad" style={{ height: '100%' }}>
              <div className="card-head">
                <div>
                  <h3 className="card-title">Distribuição de qualidade</h3>
                  <p className="card-sub">Classificação das leituras · {PERIOD_TEXT[period]}</p>
                </div>
              </div>
              <div className="chart-box sm">
                <QualityDonut counts={counts} />
              </div>
              <div className="quality-bars">
                {QUALITY_ORDER.map((q) => (
                  <div key={q} className="quality-bar">
                    <span className="legend" style={{ fontSize: 13.5 }}>
                      <span>
                        <i style={{ background: QUALITY_COLOR[q] }} />
                        {QUALITY_LABEL[q]}
                      </span>
                    </span>
                    <div className="track">
                      <div className="fill" style={{ width: `${ratio(counts[q], counts.total) * 100}%`, background: QUALITY_COLOR[q] }} />
                    </div>
                    <span className="val">
                      {formatNumber(counts[q])}
                      <small>{formatPct(ratio(counts[q], counts.total))}</small>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        </div>

        <div className="grid-main-side" style={{ marginTop: 20 }}>
          <Reveal>
            <ChartCard
              title="Evolução das classificações"
              subtitle={`Percentual diário de cada classificação · ${PERIOD_TEXT[period === '1' ? '7' : period]}`}
              legend={<QualityLegend />}
              table={{ columns: ['Dia', '% Boa', '% Atenção', '% Necessita atenção'], rows: evolution.map((d) => [d.label, ...QUALITY_ORDER.map((q) => (d.total ? `${Math.round((d[q] / d.total) * 100)}%` : '—'))]) }}
            >
              <QualityEvolutionChart days={evolution} />
            </ChartCard>
          </Reveal>
          <Reveal delay={80}>
            <section className="card card-pad" style={{ height: '100%' }}>
              <div className="card-head">
                <div>
                  <h3 className="card-title">Alertas recentes</h3>
                  <p className="card-sub">Leituras que precisam de atenção</p>
                </div>
                <Link to="/historico?qualidade=critica" className="link">
                  Ver todos <ArrowRight />
                </Link>
              </div>
              <div className="list">
                {recentAlerts.length ? recentAlerts.map((r) => <ReadingListItem key={r.id} reading={r} onOpen={setOpen} />) : <div className="empty">Nenhum alerta no período.</div>}
              </div>
            </section>
          </Reveal>
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <Reveal>
            <ChartCard title="Atividade dos sensores" subtitle="Leituras por sensor" size="sm" table={{ columns: ['Sensor', 'Leituras'], rows: sensors.map((s) => [`${s.id} · ${s.block}`, bySensor[s.id] ?? 0]) }}>
              <HorizontalBars labels={sensors.map((s) => s.id)} values={sensors.map((s) => bySensor[s.id] ?? 0)} tooltipLabel="Leituras" />
            </ChartCard>
          </Reveal>
          <Reveal delay={60}>
            <ChartCard title="Distribuição das variedades" subtitle="Leituras por variedade identificada" size="sm" table={{ columns: ['Variedade', 'Leituras'], rows: varietyRows.map(({ v, n }) => [v.name, n]) }}>
              <HorizontalBars labels={varietyRows.map(({ v }) => v.name)} values={varietyRows.map(({ n }) => n)} color="#c05478" />
            </ChartCard>
          </Reveal>
        </div>

        <div className="map-layout" style={{ marginTop: 20 }}>
          <Reveal>
            <section className="card card-pad">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Mapa dos sensores</h3>
                  <p className="card-sub">
                    {FARM.name} · {FARM.region}
                  </p>
                </div>
                <Link to="/sensores" className="link">
                  Sensores <ArrowRight />
                </Link>
              </div>
              <SensorMap sensors={sensors} lastReadings={lastReadings} height={380} compact />
            </section>
          </Reveal>
          <Reveal delay={80}>
            <section className="card card-pad" style={{ height: '100%' }}>
              <div className="card-head">
                <div>
                  <h3 className="card-title">Últimas leituras</h3>
                  <p className="card-sub">Imagens processadas pela IA</p>
                </div>
                <Link to="/historico" className="link">
                  Histórico <ArrowRight />
                </Link>
              </div>
              <div className="list">
                {readings.slice(0, 6).map((r) => (
                  <ReadingListItem key={r.id} reading={r} onOpen={setOpen} />
                ))}
              </div>
            </section>
          </Reveal>
        </div>
      </div>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </>
  );
}
