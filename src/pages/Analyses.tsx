import { ArrowRight, BarChart3, BellRing, Gauge, Grape, ImageUp, ScanSearch, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ImageUpload } from '../components/analysis/ImageUpload';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { HorizontalBars, QualityDonut, QualityEvolutionChart, QualityLegend, VolumeLineChart } from '../components/charts/Charts';
import { PageHeader } from '../components/layout/PageHeader';
import { ClassificationBadge, QualityBadge, SourceBadge, VarietyTag } from '../components/ui/Badges';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { PeriodPicker, VarietyChips } from '../components/ui/Filters';
import { KpiCard } from '../components/ui/KpiCard';
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States';
import { MATURATION_LABEL, SOURCE_LABEL } from '../data/labels';
import type { Maturation, Reading, ReadingSource, VarietyId } from '../data/types';
import { VARIETY_BY_ID } from '../data/varieties';
import { useBreakdown, useByDay, useReadings, useSensors, useSummary } from '../hooks/queries';
import { formatDateTime, formatNumber } from '../lib/format';
import { PERIOD_TEXT } from '../lib/period';
import { usePeriodParams } from '../lib/usePeriodParams';

function Panel() {
  const [params, setParams] = useSearchParams();
  const { period, from, to, setPeriod, query } = usePeriodParams('30');
  const varietyId = (params.get('variedade') as VarietyId | null) ?? 'todas';
  const sensorId = params.get('sensor') ?? '';
  const [open, setOpen] = useState<Reading | null>(null);
  const sensors = useSensors();
  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(window.location.search);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const f = { ...query, varietyId: varietyId === 'todas' ? undefined : varietyId, sensorId: sensorId || undefined };
  const summary = useSummary(f);
  const byDay = useByDay(f);
  const bySensor = useBreakdown('sensor', f);
  const byMaturation = useBreakdown('maturation', f);
  const bySource = useBreakdown('source', f);
  const recent = useReadings(f, 1, 8);
  const s = summary.data;
  const counts = s?.quality ?? { boa: 0, atencao: 0, critica: 0, total: 0 };
  const color = varietyId !== 'todas' ? VARIETY_BY_ID[varietyId].chartColor : '#a3325a';
  const daysWithData = (byDay.data ?? []).filter((d) => d.total > 0).length;

  return (
    <div className="stack">
      <section className="card filter-bar">
        <div className="filter-bar-row">
          <PeriodPicker value={period} from={from} to={to} onChange={setPeriod} />
          <select className="select" value={sensorId} onChange={(e) => setParam('sensor', e.target.value || null)} aria-label="Sensor">
            <option value="">Todos os sensores</option>
            {(sensors.data ?? []).map((x) => (
              <option key={x.id} value={x.id}>
                {x.id} · {x.block}
              </option>
            ))}
          </select>
        </div>
        <VarietyChips value={varietyId} onChange={(v) => setParam('variedade', v === 'todas' ? null : v)} />
      </section>

      {summary.isError && <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />}

      <div className="kpi-grid">
        <KpiCard loading={summary.isPending} icon={<ScanSearch />} label="Análises" value={s?.readings ?? null} foot={PERIOD_TEXT[period]} />
        <KpiCard loading={summary.isPending} icon={<Gauge />} label="Qualidade (Boa)" value={s?.qualityRatio != null ? s.qualityRatio * 100 : null} decimals={1} suffix="%" accent="good" />
        <KpiCard loading={summary.isPending} icon={<Sparkles />} label="Confiança média" value={s?.avgConfidence != null ? s.avgConfidence * 100 : null} decimals={1} suffix="%" accent="neutral" />
        <KpiCard loading={summary.isPending} icon={<Grape />} label="Cachos identificados" value={s?.clusters ?? null} />
        <KpiCard loading={summary.isPending} icon={<BellRing />} label="Alertas" value={s?.alerts ?? null} accent={counts.critica ? 'bad' : 'warn'} foot={s ? `${counts.critica} necessitam atenção` : undefined} />
      </div>

      <div className="grid-main-side">
        <ChartCard title="Volume de análises" subtitle={`Por dia · ${PERIOD_TEXT[period]}`} table={byDay.data ? { columns: ['Dia', 'Análises'], rows: byDay.data.map((b) => [b.label, b.total]) } : undefined}>
          {!byDay.data ? <LoadingBlock /> : counts.total === 0 ? <EmptyState compact title="Sem análises com estes filtros" /> : <VolumeLineChart days={byDay.data} color={color} />}
        </ChartCard>
        <ChartCard title="Qualidade" subtitle="Distribuição das classificações" legend={counts.total ? <QualityLegend counts={counts} /> : undefined}>
          {counts.total === 0 ? <EmptyState compact title="Sem análises" /> : <QualityDonut counts={counts} />}
        </ChartCard>
      </div>

      <ChartCard title="Evolução das classificações" subtitle="Percentual de cada classificação por dia" legend={<QualityLegend />}>
        {!byDay.data ? <LoadingBlock /> : daysWithData < 2 ? <EmptyState compact title="Dados insuficientes">São necessárias análises em pelo menos dois dias do período.</EmptyState> : <QualityEvolutionChart days={byDay.data} />}
      </ChartCard>

      <div className="grid-3">
        <ChartCard title="Por sensor" size="sm" table={bySensor.data ? { columns: ['Sensor', 'Análises'], rows: bySensor.data.map((g) => [g.key, g.total]) } : undefined}>
          {!bySensor.data ? <LoadingBlock height={180} /> : bySensor.data.length === 0 ? <EmptyState compact title="Sem dados" /> : <HorizontalBars labels={bySensor.data.map((g) => g.key)} values={bySensor.data.map((g) => g.total)} tooltipLabel="Análises" />}
        </ChartCard>
        <ChartCard title="Estágio de maturação" size="sm" table={byMaturation.data ? { columns: ['Estágio', 'Análises'], rows: byMaturation.data.map((g) => [MATURATION_LABEL[g.key as Maturation] ?? g.key, g.total]) } : undefined}>
          {!byMaturation.data ? (
            <LoadingBlock height={180} />
          ) : byMaturation.data.length === 0 ? (
            <EmptyState compact title="Sem dados" />
          ) : (
            <HorizontalBars labels={byMaturation.data.map((g) => MATURATION_LABEL[g.key as Maturation] ?? g.key)} values={byMaturation.data.map((g) => g.total)} color={color} tooltipLabel="Análises" />
          )}
        </ChartCard>
        <ChartCard title="Origem dos dados" size="sm" table={bySource.data ? { columns: ['Origem', 'Análises'], rows: bySource.data.map((g) => [SOURCE_LABEL[g.key as ReadingSource] ?? g.key, g.total]) } : undefined}>
          {!bySource.data ? (
            <LoadingBlock height={180} />
          ) : bySource.data.length === 0 ? (
            <EmptyState compact title="Sem dados" />
          ) : (
            <HorizontalBars labels={bySource.data.map((g) => SOURCE_LABEL[g.key as ReadingSource] ?? g.key)} values={bySource.data.map((g) => g.total)} color="#86264e" tooltipLabel="Análises" />
          )}
        </ChartCard>
      </div>

      <section className="card">
        <div className="card-head card-pad" style={{ marginBottom: 0 }}>
          <div>
            <h3 className="card-title">Análises recentes</h3>
            <p className="card-sub">{recent.data ? `${formatNumber(recent.data.total)} análises correspondem aos filtros` : ' '}</p>
          </div>
          <Link to={`/historico?${new URLSearchParams({ ...(varietyId !== 'todas' ? { variedade: varietyId } : {}), ...(sensorId ? { sensor: sensorId } : {}) }).toString()}`} className="link">
            Ver no histórico <ArrowRight />
          </Link>
        </div>
        {recent.isPending ? (
          <LoadingBlock height={200} />
        ) : recent.isError ? (
          <ErrorState error={recent.error} compact onRetry={() => void recent.refetch()} />
        ) : recent.data.items.length === 0 ? (
          <EmptyState compact title="Nenhuma análise com estes filtros" />
        ) : (
          <div className="table-wrap">
            <table className="table table-cards">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Data e hora</th>
                  <th>Sensor</th>
                  <th>Uva</th>
                  <th>Qualidade</th>
                  <th>Confiança</th>
                  <th>Classificação</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.items.map((r) => (
                  <tr key={r.id} className="row-link" onClick={() => setOpen(r)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(r)}>
                    <td data-label="Código" className="mono">{r.id}</td>
                    <td data-label="Data e hora">{formatDateTime(r.capturedAt)}</td>
                    <td data-label="Sensor">{r.sensorId}</td>
                    <td data-label="Uva"><VarietyTag id={r.varietyId} /></td>
                    <td data-label="Qualidade"><QualityBadge quality={r.quality} /></td>
                    <td data-label="Confiança"><ConfidenceBar value={r.confidence} /></td>
                    <td data-label="Classificação"><ClassificationBadge value={r.classification} /></td>
                    <td data-label="Origem"><SourceBadge source={r.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export default function Analyses() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('aba') === 'painel' ? 'painel' : 'enviar';
  const setTab = (t: 'enviar' | 'painel') => {
    const next = new URLSearchParams(window.location.search);
    if (t === 'enviar') next.delete('aba');
    else next.set('aba', t);
    setParams(next, { replace: true });
  };
  return (
    <div className="page">
      <PageHeader title="Análises" description="Envie imagens para análise e acompanhe os resultados processados pela plataforma." />
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'enviar'} onClick={() => setTab('enviar')}>
          <ImageUp /> Enviar imagem
        </button>
        <button role="tab" aria-selected={tab === 'painel'} onClick={() => setTab('painel')}>
          <BarChart3 /> Painel analítico
        </button>
      </div>
      {tab === 'enviar' ? <ImageUpload /> : <Panel />}
    </div>
  );
}
