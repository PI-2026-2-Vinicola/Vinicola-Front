import { ArrowRight, BookOpen } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { VarietyHistory } from '../components/analysis/VarietyHistory';
import { ChartCard } from '../components/charts/ChartCard';
import { PageHeader } from '../components/layout/PageHeader';
import { ClassificationBadge } from '../components/ui/Badges';
import { PeriodPicker } from '../components/ui/Filters';
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States';
import { CLASSIFICATIONS, QUALITY_COLOR, QUALITY_LABEL, QUALITY_ORDER } from '../data/labels';
import type { Group, VarietyId } from '../data/types';
import { VARIETIES, VARIETY_BY_ID } from '../data/varieties';
import { useBreakdown } from '../hooks/queries';
import { formatNumber, formatPct } from '../lib/format';
import { PERIOD_TEXT, ratio } from '../lib/period';
import { usePeriodParams } from '../lib/usePeriodParams';

type TypeFilter = 'todas' | 'Tinta' | 'Branca';

function VarietyCard({ id, group, selected, onSelect }: { id: VarietyId; group?: Group; selected: boolean; onSelect: () => void }) {
  const v = VARIETY_BY_ID[id];
  const total = group?.total ?? 0;
  return (
    <button className={`card variety-card ${selected ? 'is-selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
      <div className="variety-card-head">
        <span className="variety-dot" style={{ background: v.chartColor }} aria-hidden="true" />
        <div>
          <strong>{v.name}</strong>
          <span>Uva {v.type.toLowerCase()}</span>
        </div>
        <span className="variety-total">{formatNumber(total)}</span>
      </div>
      {total === 0 ? (
        <p className="muted small">Sem leituras no período.</p>
      ) : (
        <>
          <div className="stack-bar" role="img" aria-label={QUALITY_ORDER.map((q) => `${QUALITY_LABEL[q]} ${formatPct(ratio(group![q], total))}`).join(', ')}>
            {QUALITY_ORDER.map((q) => (
              <i key={q} style={{ width: `${ratio(group![q], total) * 100}%`, background: QUALITY_COLOR[q] }} />
            ))}
          </div>
          <dl className="variety-card-stats">
            {QUALITY_ORDER.map((q) => (
              <div key={q}>
                <dt>{QUALITY_LABEL[q]}</dt>
                <dd>{formatPct(ratio(group![q], total))}</dd>
              </div>
            ))}
            <div>
              <dt>Confiança</dt>
              <dd>{formatPct(group!.avgConfidence)}</dd>
            </div>
          </dl>
        </>
      )}
    </button>
  );
}

export default function Classification() {
  const [params, setParams] = useSearchParams();
  const { period, from, to, setPeriod, query } = usePeriodParams('30');
  const type = (params.get('tipo') as TypeFilter | null) ?? 'todas';
  const selected = params.get('variedade') as VarietyId | null;
  const byVariety = useBreakdown('variety', query);
  const byClass = useBreakdown('classification', query);
  const set = (k: string, v: string | null) => {
    const next = new URLSearchParams(window.location.search);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  const groups = Object.fromEntries((byVariety.data ?? []).map((g) => [g.key, g])) as Record<string, Group>;
  const varieties = VARIETIES.filter((v) => type === 'todas' || v.type === type);
  const totalClass = (byClass.data ?? []).reduce((s, g) => s + g.total, 0);

  return (
    <div className="page">
      <PageHeader
        title="Classificação das uvas"
        description="Resultado das análises por variedade: quantidade, distribuição das classificações, confiança e maturação."
        actions={
          <Link to="/uvas" className="btn btn-secondary">
            <BookOpen /> Critérios por variedade
          </Link>
        }
      />
      <section className="card filter-bar">
        <div className="filter-bar-row">
          <PeriodPicker value={period} from={from} to={to} onChange={setPeriod} />
          <div className="segmented" role="group" aria-label="Tipo de uva">
            {(['todas', 'Tinta', 'Branca'] as const).map((t) => (
              <button key={t} aria-pressed={type === t} onClick={() => set('tipo', t === 'todas' ? null : t)}>
                {t === 'todas' ? 'Todas' : t === 'Tinta' ? 'Tintas' : 'Brancas'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {byVariety.isPending ? (
        <LoadingBlock height={260} />
      ) : byVariety.isError ? (
        <ErrorState error={byVariety.error} onRetry={() => void byVariety.refetch()} />
      ) : (
        <div className="variety-grid">
          {varieties.map((v) => (
            <VarietyCard key={v.id} id={v.id} group={groups[v.id]} selected={selected === v.id} onSelect={() => set('variedade', selected === v.id ? null : v.id)} />
          ))}
        </div>
      )}

      {selected && VARIETY_BY_ID[selected] ? (
        <VarietyHistory varietyId={selected} filters={query} />
      ) : (
        <p className="muted small">Selecione uma variedade para ver a evolução das classificações e os estágios de maturação.</p>
      )}

      <ChartCard title="Classificação geral" subtitle={`Todas as variedades · ${PERIOD_TEXT[period]}`}>
        {byClass.isPending ? (
          <LoadingBlock height={160} />
        ) : totalClass === 0 ? (
          <EmptyState compact title="Sem análises no período" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Classificação</th>
                <th className="num">Análises</th>
                <th className="num">Percentual</th>
                <th className="num">Confiança média</th>
              </tr>
            </thead>
            <tbody>
              {CLASSIFICATIONS.map((c) => {
                const g = byClass.data!.find((x) => x.key === c);
                return (
                  <tr key={c}>
                    <td>
                      <ClassificationBadge value={c} />
                    </td>
                    <td className="num">{formatNumber(g?.total ?? 0)}</td>
                    <td className="num">{formatPct(ratio(g?.total ?? 0, totalClass), 1)}</td>
                    <td className="num">{formatPct(g?.avgConfidence ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </ChartCard>
      <Link to="/historico" className="link">
        Consultar leituras no histórico <ArrowRight />
      </Link>
    </div>
  );
}
