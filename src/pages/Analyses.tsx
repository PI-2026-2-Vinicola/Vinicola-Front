import { ArrowRight, BarChart3, BellRing, CalendarRange, Cpu, Gauge, Grape, ScanSearch, Sparkles, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PipelineSimulator } from '../components/analysis/PipelineSimulator';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { VarietyHistory } from '../components/analysis/VarietyHistory';
import { ChartCard } from '../components/charts/ChartCard';
import { HorizontalBars, MultiLineChart, QualityDonut, QualityEvolutionChart, QualityLegend, VolumeLineChart } from '../components/charts/Charts';
import { PageHero } from '../components/layout/PageHero';
import { ClassificationBadge, QualityBadge, VarietyTag } from '../components/ui/Badges';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { PeriodSegmented, VarietyChips } from '../components/ui/Filters';
import { KpiCard } from '../components/ui/KpiCard';
import { useData } from '../context/DataContext';
import { MATURATION_LABEL, MATURATION_ORDER } from '../data/labels';
import type { Reading, VarietyId } from '../data/types';
import { VARIETIES, VARIETY_BY_ID } from '../data/varieties';
import { formatDateTime, formatNumber } from '../lib/format';
import { avgConfidence, countBy, countByQuality, filterReadings, groupByDay, periodRange, ratio, timeBuckets, type PeriodPreset } from '../lib/stats';

export default function Analyses() {
  const { readings, sensors, now } = useData();
  const [params, setParams] = useSearchParams();
  const tab = params.get('aba') === 'processamento' ? 'processamento' : 'painel';
  const varietyId = (params.get('variedade') as VarietyId | null) ?? 'todas';
  const [period, setPeriod] = useState<PeriodPreset>('30');
  const [sensorId, setSensorId] = useState('todos');
  const [open, setOpen] = useState<Reading | null>(null);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v === null) next.delete(k);
    else next.set(k, v);
    setParams(next, { replace: true });
  };

  const filters = { varietyId: varietyId as VarietyId | 'todas', sensorId, period };
  const list = useMemo(() => filterReadings(readings, filters, now), [readings, varietyId, sensorId, period, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = countByQuality(list);
  const buckets = useMemo(() => timeBuckets(list, { period }, now), [list, period, now]);
  const evolution = period === '1' ? timeBuckets(filterReadings(readings, { ...filters, period: '7' }, now), { period: '7' }, now) : buckets;
  const bySensor = countBy(list, (r) => r.sensorId);
  const byVariety = countBy(list, (r) => r.varietyId);
  const byMaturation = countBy(list, (r) => r.maturation);
  const varietyRows = VARIETIES.map((v) => ({ v, n: byVariety[v.id] ?? 0 })).sort((a, b) => b.n - a.n);
  const color = varietyId !== 'todas' ? VARIETY_BY_ID[varietyId].chartColor : '#a3325a';

  // Séries por variedade (identidade categórica fixa, validada para daltonismo).
  const multi = useMemo(() => {
    const scope = filterReadings(readings, { sensorId, period: period === '1' ? '7' : period }, now);
    const [start, end] = periodRange({ period: period === '1' ? '7' : period }, now);
    const labels = groupByDay([], start, end).map((d) => d.label);
    const series = VARIETIES.map((v) => ({ label: v.name, color: v.chartColor, data: groupByDay(scope.filter((r) => r.varietyId === v.id), start, end).map((d) => d.total) }));
    return { labels, series };
  }, [readings, sensorId, period, now]);

  return (
    <>
      <PageHero
        eyebrow="Inteligência de dados"
        title="Análises"
        description="Registro e processamento das imagens pelos modelos de visão computacional, com indicadores filtráveis por variedade, sensor e período."
      />
      <div className="container page-body">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="tabs" role="tablist" style={{ padding: '0 12px' }}>
            <button role="tab" aria-selected={tab === 'painel'} onClick={() => setParam('aba', null)}>
              <BarChart3 /> Painel analítico
            </button>
            <button role="tab" aria-selected={tab === 'processamento'} onClick={() => setParam('aba', 'processamento')}>
              <Workflow /> Registro e processamento
            </button>
          </div>
          {tab === 'painel' && (
            <div className="toolbar" style={{ alignItems: 'flex-start' }}>
              <div className="stack" style={{ gap: 10, flex: 1, minWidth: 0 }}>
                <span className="toolbar-label">
                  <Grape /> Variedade
                </span>
                <VarietyChips value={varietyId} onChange={(v) => setParam('variedade', v === 'todas' ? null : v)} />
              </div>
              <div className="toolbar-group" style={{ alignItems: 'flex-end' }}>
                <div className="field">
                  <span className="toolbar-label">
                    <CalendarRange /> Período
                  </span>
                  <PeriodSegmented value={period} onChange={setPeriod} />
                </div>
                <div className="field" style={{ minWidth: 200 }}>
                  <label className="toolbar-label" htmlFor="an-sensor">
                    <Cpu /> Sensor
                  </label>
                  <select id="an-sensor" className="select" value={sensorId} onChange={(e) => setSensorId(e.target.value)}>
                    <option value="todos">Todos os sensores</option>
                    {sensors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} · {s.block}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {tab === 'processamento' ? (
          <PipelineSimulator />
        ) : (
          <div className="stack">
            <div className="kpi-grid">
              <KpiCard icon={<ScanSearch />} label="Análises" value={counts.total} foot={varietyId === 'todas' ? 'todas as variedades' : VARIETY_BY_ID[varietyId].name} />
              <KpiCard icon={<Gauge />} label="Qualidade geral" value={ratio(counts.boa, counts.total) * 100} decimals={1} suffix="%" accent="good" foot="leituras “Boa”" />
              <KpiCard icon={<Sparkles />} label="Confiança média" value={avgConfidence(list) * 100} decimals={1} suffix="%" foot="saída do modelo YOLO" />
              <KpiCard icon={<Grape />} label="Uvas analisadas" value={list.reduce((s, r) => s + r.clustersDetected, 0)} foot="cachos identificados" />
              <KpiCard icon={<BellRing />} label="Alertas" value={counts.atencao + counts.critica} accent={counts.critica ? 'bad' : 'warn'} foot={`${counts.critica} necessitam atenção`} />
            </div>

            {varietyId !== 'todas' && <VarietyHistory varietyId={varietyId} readings={list} days={buckets} />}

            <div className="grid-main-side">
              <ChartCard
                title="Análises por período"
                subtitle={varietyId === 'todas' ? 'Quantidade de análises ao longo do tempo' : `Quantidade de análises · ${VARIETY_BY_ID[varietyId].name}`}
                table={{ columns: ['Período', 'Análises'], rows: buckets.map((b) => [b.label, b.total]) }}
              >
                <VolumeLineChart days={buckets} color={color} />
              </ChartCard>
              <ChartCard title="Qualidade" subtitle="Distribuição das classificações" legend={<QualityLegend counts={counts} />} table={{ columns: ['Classificação', 'Leituras'], rows: [['Boa', counts.boa], ['Atenção', counts.atencao], ['Necessita atenção', counts.critica]] }}>
                <QualityDonut counts={counts} />
              </ChartCard>
            </div>

            <ChartCard
              title="Evolução"
              subtitle="Comportamento das classificações ao longo do período (% por dia)"
              legend={<QualityLegend />}
              table={{ columns: ['Dia', 'Boa', 'Atenção', 'Necessita atenção', 'Total'], rows: evolution.map((d) => [d.label, d.boa, d.atencao, d.critica, d.total]) }}
            >
              <QualityEvolutionChart days={evolution} />
            </ChartCard>

            <div className="grid-2">
              <ChartCard title="Atividade dos sensores" subtitle="Quantidade de leituras por sensor" size="sm" table={{ columns: ['Sensor', 'Leituras'], rows: sensors.map((s) => [s.id, bySensor[s.id] ?? 0]) }}>
                <HorizontalBars labels={sensors.map((s) => `${s.id} · ${s.block}`)} values={sensors.map((s) => bySensor[s.id] ?? 0)} tooltipLabel="Leituras" />
              </ChartCard>
              {varietyId === 'todas' ? (
                <ChartCard title="Distribuição das variedades" subtitle="Quantidade de cada tipo identificado" size="sm" table={{ columns: ['Variedade', 'Leituras'], rows: varietyRows.map(({ v, n }) => [v.name, n]) }}>
                  <HorizontalBars labels={varietyRows.map(({ v }) => v.name)} values={varietyRows.map(({ n }) => n)} color="#c05478" />
                </ChartCard>
              ) : (
                <ChartCard title="Estágios de maturação" subtitle={`Leituras por estágio · ${VARIETY_BY_ID[varietyId].name}`} size="sm" table={{ columns: ['Estágio', 'Leituras'], rows: MATURATION_ORDER.map((m) => [MATURATION_LABEL[m], byMaturation[m] ?? 0]) }}>
                  <HorizontalBars labels={MATURATION_ORDER.map((m) => MATURATION_LABEL[m])} values={MATURATION_ORDER.map((m) => byMaturation[m] ?? 0)} color={color} />
                </ChartCard>
              )}
            </div>

            {varietyId === 'todas' && (
              <ChartCard
                title="Análises por variedade"
                subtitle="Leituras diárias de cada variedade identificada"
                legend={VARIETIES.map((v) => (
                  <span key={v.id}>
                    <i style={{ background: v.chartColor, height: 3, width: 14, borderRadius: 2 }} />
                    {v.name}
                  </span>
                ))}
                table={{ columns: ['Dia', ...VARIETIES.map((v) => v.name)], rows: multi.labels.map((l, i) => [l, ...multi.series.map((s) => s.data[i])]) }}
              >
                <MultiLineChart labels={multi.labels} series={multi.series} />
              </ChartCard>
            )}

            <section className="card">
              <div className="card-head card-pad" style={{ marginBottom: 0 }}>
                <div>
                  <h3 className="card-title">Análises recentes</h3>
                  <p className="card-sub">{formatNumber(list.length)} análises correspondem aos filtros</p>
                </div>
                <Link to={`/historico?${new URLSearchParams({ ...(varietyId !== 'todas' ? { variedade: varietyId } : {}), ...(sensorId !== 'todos' ? { sensor: sensorId } : {}) }).toString()}`} className="link">
                  Ver no histórico <ArrowRight />
                </Link>
              </div>
              <div className="table-wrap" style={{ padding: '0 12px 12px' }}>
                <table className="table table-cards">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data e hora</th>
                      <th>Sensor</th>
                      <th>Uva</th>
                      <th>Qualidade</th>
                      <th>Confiança</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {list.slice(0, 8).map((r) => (
                      <tr key={r.id}>
                        <td data-label="ID" className="mono">{r.id}</td>
                        <td data-label="Data e hora">{formatDateTime(r.capturedAt)}</td>
                        <td data-label="Sensor">{r.sensorId}</td>
                        <td data-label="Uva"><VarietyTag id={r.varietyId} /></td>
                        <td data-label="Qualidade"><QualityBadge quality={r.quality} /></td>
                        <td data-label="Confiança"><ConfidenceBar value={r.confidence} /></td>
                        <td data-label="Status"><ClassificationBadge value={r.classification} /></td>
                        <td data-label="">
                          <button className="btn btn-sm btn-secondary" onClick={() => setOpen(r)}>
                            Visualizar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </>
  );
}
