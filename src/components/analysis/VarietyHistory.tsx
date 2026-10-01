import { ArrowRight, CircleCheck, Hash, OctagonAlert, Sparkles, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MATURATION_LABEL } from '../../data/labels';
import type { Maturation, VarietyId } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { useBreakdown, useByDay, useSummary } from '../../hooks/queries';
import { formatNumber, formatPct } from '../../lib/format';
import type { ReadingQuery } from '../../services/api';
import { ChartCard } from '../charts/ChartCard';
import { AnalysesByDayChart, HorizontalBars, QualityLegend } from '../charts/Charts';
import { EmptyState, ErrorState, LoadingBlock } from '../ui/States';

/** Resumo, evolução e maturação de uma variedade a partir das leituras gravadas. */
export function VarietyHistory({ varietyId, filters }: { varietyId: VarietyId; filters: ReadingQuery }) {
  const v = VARIETY_BY_ID[varietyId];
  const f = { ...filters, varietyId };
  const summary = useSummary(f);
  const days = useByDay(f);
  const maturation = useBreakdown('maturation', f);

  if (summary.isPending) return <LoadingBlock height={320} />;
  if (summary.isError) return <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />;
  const s = summary.data;
  const c = s.quality;
  if (c.total === 0)
    return (
      <div className="card">
        <EmptyState title={`Nenhuma leitura de ${v.name} no período`}>Amplie o período ou envie imagens de um sensor instalado em talhão desta variedade.</EmptyState>
      </div>
    );

  const mat = maturation.data ?? [];
  return (
    <div className="variety-summary">
      <section className="card card-pad">
        <span className="eyebrow">Histórico da variedade</span>
        <h3 className="vs-name">{v.name}</h3>
        <span className="muted small">
          Uva {v.type.toLowerCase()} · {v.color}
        </span>
        <div className="vs-numbers">
          <div>
            <span>
              <Hash /> Total analisado
            </span>
            <strong>{formatNumber(c.total)}</strong>
          </div>
          <div>
            <span>
              <Sparkles /> Confiança média
            </span>
            <strong>{formatPct(s.avgConfidence, 1)}</strong>
          </div>
          <div>
            <span className="tone-good">
              <CircleCheck /> Boa
            </span>
            <strong>
              {formatNumber(c.boa)} <small>{formatPct(c.boa / c.total)}</small>
            </strong>
          </div>
          <div>
            <span className="tone-warn">
              <TriangleAlert /> Atenção
            </span>
            <strong>
              {formatNumber(c.atencao)} <small>{formatPct(c.atencao / c.total)}</small>
            </strong>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span className="tone-bad">
              <OctagonAlert /> Necessita atenção
            </span>
            <strong>
              {formatNumber(c.critica)} <small>{formatPct(c.critica / c.total)}</small>
            </strong>
          </div>
        </div>
        <div className="row" style={{ gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <Link to={`/uvas/${v.id}`} className="link">
            Critérios de classificação <ArrowRight />
          </Link>
          <Link to={`/historico?variedade=${v.id}`} className="link">
            Ver leituras <ArrowRight />
          </Link>
        </div>
      </section>
      <ChartCard
        title="Evolução das classificações"
        subtitle={`${v.name} · leituras por dia`}
        legend={<QualityLegend counts={c} />}
        table={days.data ? { columns: ['Dia', 'Boa', 'Atenção', 'Necessita atenção', 'Confiança média'], rows: days.data.map((d) => [d.label, d.boa, d.atencao, d.critica, formatPct(d.avgConfidence)]) } : undefined}
      >
        {days.isPending ? <LoadingBlock /> : days.isError ? <ErrorState error={days.error} compact /> : <AnalysesByDayChart days={days.data} />}
      </ChartCard>
      <ChartCard title="Estágios de maturação" subtitle="Estimados pela cor das bagas (ou informados na importação)" size="sm">
        {maturation.isPending ? (
          <LoadingBlock height={180} />
        ) : mat.length === 0 ? (
          <EmptyState compact title="Sem dados de maturação" />
        ) : (
          <HorizontalBars labels={mat.map((m) => MATURATION_LABEL[m.key as Maturation] ?? m.key)} values={mat.map((m) => m.total)} color={v.chartColor} tooltipLabel="Leituras" />
        )}
      </ChartCard>
    </div>
  );
}
