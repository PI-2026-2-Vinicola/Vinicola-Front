import { ArrowRight, CircleCheck, Hash, OctagonAlert, Sparkles, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Reading, VarietyId } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatNumber, formatPct } from '../../lib/format';
import { avgConfidence, countByQuality, groupByDay, type DayBucket } from '../../lib/stats';
import { ChartCard } from '../charts/ChartCard';
import { AnalysesByDayChart, QualityLegend } from '../charts/Charts';
import { GrapeScene } from '../grape/GrapeScene';

/** Resumo e evolução temporal de uma variedade (histórico por variedade). */
export function VarietyHistory({ varietyId, readings, days }: { varietyId: VarietyId; readings: Reading[]; days?: DayBucket[] }) {
  const v = VARIETY_BY_ID[varietyId];
  const c = countByQuality(readings);
  const series =
    days ??
    (() => {
      if (!readings.length) return [];
      const times = readings.map((r) => new Date(r.capturedAt).getTime());
      return groupByDay(readings, Math.min(...times), Math.max(...times));
    })();
  return (
    <div className="variety-summary">
      <section className="card card-pad">
        <div className="vs-head">
          <div className="vs-thumb">
            <GrapeScene className="scene" seed={4242} varietyId={varietyId} detections={[{ kind: 'cacho', label: '', confidence: 1, box: [0.2, 0.14, 0.6, 0.74] }]} showBoxes={false} />
          </div>
          <div>
            <span className="eyebrow">Histórico da variedade</span>
            <h3 className="display" style={{ fontSize: 26, marginTop: 4 }}>
              {v.name}
            </h3>
            <span className="muted" style={{ fontSize: 13.5 }}>
              Uva {v.type.toLowerCase()} · {v.color}
            </span>
          </div>
        </div>
        <div className="vs-numbers">
          <div>
            <span>
              <Hash /> Total analisado
            </span>
            <strong>{formatNumber(c.total)}</strong>
          </div>
          <div>
            <span>
              <Sparkles /> Média de confiança
            </span>
            <strong>{formatPct(avgConfidence(readings), 1)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--good-ink)' }}>
              <CircleCheck /> Boa
            </span>
            <strong>{formatNumber(c.boa)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--warn-ink)' }}>
              <TriangleAlert /> Atenção
            </span>
            <strong>{formatNumber(c.atencao)}</strong>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: 'var(--bad-ink)' }}>
              <OctagonAlert /> Necessita atenção
            </span>
            <strong>{formatNumber(c.critica)}</strong>
          </div>
        </div>
        <Link to={`/uvas/${v.id}`} className="link" style={{ marginTop: 16 }}>
          Critérios de classificação da variedade <ArrowRight />
        </Link>
      </section>
      <ChartCard
        title="Evolução das classificações"
        subtitle={`${v.name} · leituras por dia`}
        legend={<QualityLegend counts={c} />}
        table={{ columns: ['Dia', 'Boa', 'Atenção', 'Necessita atenção', 'Confiança média'], rows: series.map((d) => [d.label, d.boa, d.atencao, d.critica, d.total ? formatPct(d.avgConfidence) : '—']) }}
      >
        <AnalysesByDayChart days={series} />
      </ChartCard>
    </div>
  );
}
