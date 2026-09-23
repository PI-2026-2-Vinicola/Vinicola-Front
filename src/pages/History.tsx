import { ArrowDownUp, ChevronLeft, ChevronRight, Download, FilterX, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { AnalysesByDayChart, QualityLegend } from '../components/charts/Charts';
import { PageHero } from '../components/layout/PageHero';
import { ClassificationBadge, QualityBadge, VarietyTag } from '../components/ui/Badges';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { VarietyChips } from '../components/ui/Filters';
import { useData } from '../context/DataContext';
import { QUALITY_LABEL, QUALITY_ORDER } from '../data/labels';
import type { Classification, Quality, Reading, VarietyId } from '../data/types';
import { VARIETIES, VARIETY_BY_ID } from '../data/varieties';
import { formatDate, formatNumber, formatPct, formatTime } from '../lib/format';
import { avgConfidence, countByQuality, DEFAULT_FILTERS, filterReadings, timeBuckets, type PeriodPreset, type ReadingFilters } from '../lib/stats';

const PAGE_SIZE = 15;
const CLASSIFICATIONS: Classification[] = ['APROVADA', 'EM OBSERVAÇÃO', 'REVISÃO NECESSÁRIA'];

function fromParams(p: URLSearchParams): ReadingFilters {
  return {
    ...DEFAULT_FILTERS,
    search: p.get('q') ?? '',
    varietyId: (p.get('variedade') as VarietyId) ?? 'todas',
    sensorId: p.get('sensor') ?? 'todos',
    quality: (p.get('qualidade') as Quality) ?? 'todas',
    classification: (p.get('classificacao') as Classification) ?? 'todas',
    period: (p.get('periodo') as PeriodPreset) ?? '30',
    from: p.get('de') ?? undefined,
    to: p.get('ate') ?? undefined,
  };
}

const PARAM_KEYS: Record<keyof ReadingFilters, string> = {
  search: 'q',
  varietyId: 'variedade',
  sensorId: 'sensor',
  quality: 'qualidade',
  classification: 'classificacao',
  period: 'periodo',
  from: 'de',
  to: 'ate',
};

function toCsv(rows: Reading[]) {
  const head = ['id', 'data', 'hora', 'sensor', 'local', 'variedade', 'qualidade', 'confianca', 'maturacao', 'classificacao', 'observacoes'];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.id, formatDate(r.capturedAt), formatTime(r.capturedAt), r.sensorId, r.location, VARIETY_BY_ID[r.varietyId].name, QUALITY_LABEL[r.quality], r.confidence, r.maturation, r.classification, r.observations]
      .map(esc)
      .join(';'),
  );
  return [head.join(';'), ...lines].join('\n');
}

export default function History() {
  const { readings, sensors, now, varietyNames } = useData();
  const [params, setParams] = useSearchParams();
  const filters = fromParams(params);
  const [searchText, setSearchText] = useState(filters.search);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: 'data' | 'confianca'; dir: 1 | -1 }>({ key: 'data', dir: -1 });
  const [open, setOpen] = useState<Reading | null>(null);

  const update = (patch: Partial<ReadingFilters>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch) as [keyof ReadingFilters, string | undefined][]) {
      const def = DEFAULT_FILTERS[k];
      if (v === undefined || v === '' || v === def) next.delete(PARAM_KEYS[k]);
      else next.set(PARAM_KEYS[k], v);
    }
    setParams(next, { replace: true });
    setPage(1);
  };

  // Pesquisa com pequeno atraso (debounce).
  useEffect(() => {
    const t = setTimeout(() => searchText !== filters.search && update({ search: searchText }), 250);
    return () => clearTimeout(t);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => {
    const out = filterReadings(readings, filters, now, varietyNames);
    if (sort.key === 'confianca') out.sort((a, b) => (a.confidence - b.confidence) * sort.dir);
    else if (sort.dir === 1) out.reverse();
    return out;
  }, [readings, params, now, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = countByQuality(list);
  const buckets = useMemo(() => timeBuckets(list, filters, now), [list]); // eslint-disable-line react-hooks/exhaustive-deps
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const current = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = [...params.keys()].length > 0;

  const exportCsv = () => {
    const blob = new Blob(['﻿' + toCsv(list)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `osais-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const toggleSort = (key: 'data' | 'confianca') => setSort((s) => ({ key, dir: s.key === key ? ((s.dir * -1) as 1 | -1) : -1 }));

  return (
    <>
      <PageHero
        eyebrow="Registro completo"
        title="Histórico de Análises"
        description="Todas as leituras processadas pela IA, com filtros por período, sensor, variedade, classificação e qualidade."
        actions={
          <button className="btn btn-glass btn-sm" onClick={exportCsv}>
            <Download /> Exportar CSV
          </button>
        }
      />
      <div className="container page-body">
        <section className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="filters">
            <div className="field">
              <label htmlFor="h-search">Pesquisar</label>
              <div className="input-icon">
                <Search />
                <input id="h-search" className="input" placeholder="ID, sensor, local, variedade, observação…" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="h-period">Período</label>
              <select id="h-period" className="select" value={filters.period} onChange={(e) => update({ period: e.target.value as PeriodPreset })}>
                <option value="1">Hoje</option>
                <option value="7">Últimos 7 dias</option>
                <option value="14">Últimos 14 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="todos">Todo o histórico</option>
                <option value="custom">Personalizado…</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-sensor">Sensor</label>
              <select id="h-sensor" className="select" value={filters.sensorId} onChange={(e) => update({ sensorId: e.target.value })}>
                <option value="todos">Todos</option>
                {sensors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} · {s.block}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-variety">Variedade</label>
              <select id="h-variety" className="select" value={filters.varietyId} onChange={(e) => update({ varietyId: e.target.value as VarietyId })}>
                <option value="todas">Todas</option>
                {VARIETIES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-class">Classificação</label>
              <select id="h-class" className="select" value={filters.classification} onChange={(e) => update({ classification: e.target.value as Classification })}>
                <option value="todas">Todas</option>
                {CLASSIFICATIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="h-quality">Qualidade</label>
              <select id="h-quality" className="select" value={filters.quality} onChange={(e) => update({ quality: e.target.value as Quality })}>
                <option value="todas">Todas</option>
                {QUALITY_ORDER.map((q) => (
                  <option key={q} value={q}>
                    {QUALITY_LABEL[q]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {filters.period === 'custom' && (
            <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              <div className="field">
                <label htmlFor="h-from">De</label>
                <input id="h-from" className="input" type="date" value={filters.from ?? ''} onChange={(e) => update({ from: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="h-to">Até</label>
                <input id="h-to" className="input" type="date" value={filters.to ?? ''} onChange={(e) => update({ to: e.target.value })} />
              </div>
            </div>
          )}
          <hr className="divider" />
          <div className="row-between">
            <VarietyChips value={filters.varietyId} onChange={(v) => update({ varietyId: v })} />
            {hasFilters && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setSearchText('');
                  setParams(new URLSearchParams(), { replace: true });
                  setPage(1);
                }}
              >
                <FilterX /> Limpar filtros
              </button>
            )}
          </div>
        </section>

        <div className="grid-main-side" style={{ marginBottom: 20 }}>
          <ChartCard title="Leituras filtradas" subtitle="Distribuição por período e classificação" legend={<QualityLegend counts={counts} />} size="sm">
            <AnalysesByDayChart days={buckets} />
          </ChartCard>
          <section className="card card-pad">
            <h3 className="card-title">Resumo</h3>
            <p className="card-sub">Indicadores para os filtros atuais</p>
            <div className="vs-numbers">
              <div>
                <span>Total</span>
                <strong>{formatNumber(counts.total)}</strong>
              </div>
              <div>
                <span>Confiança média</span>
                <strong>{formatPct(avgConfidence(list), 1)}</strong>
              </div>
              {QUALITY_ORDER.map((q) => (
                <div key={q} style={q === 'critica' ? { gridColumn: '1 / -1' } : undefined}>
                  <span>
                    <QualityBadge quality={q} />
                  </span>
                  <strong>
                    {formatNumber(counts[q])} <small className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{counts.total ? formatPct(counts[q] / counts.total) : '0%'}</small>
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="card">
          <div className="table-wrap" style={{ padding: 12 }}>
            {current.length === 0 ? (
              <div className="empty">
                <Search />
                <strong>Nenhuma análise encontrada</strong>
                <span>Ajuste os filtros ou a pesquisa.</span>
              </div>
            ) : (
              <table className="table table-cards">
                <thead>
                  <tr>
                    <th>
                      <button className="row" style={{ gap: 4, font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit' }} onClick={() => toggleSort('data')}>
                        Data <ArrowDownUp size={13} />
                      </button>
                    </th>
                    <th>Hora</th>
                    <th>Sensor</th>
                    <th>Uva</th>
                    <th>Qualidade</th>
                    <th>
                      <button className="row" style={{ gap: 4, font: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit' }} onClick={() => toggleSort('confianca')}>
                        Confiança <ArrowDownUp size={13} />
                      </button>
                    </th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {current.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Data">
                        <strong>{formatDate(r.capturedAt)}</strong>
                        <div className="mono muted">{r.id}</div>
                      </td>
                      <td data-label="Hora" className="tabular">{formatTime(r.capturedAt)}</td>
                      <td data-label="Sensor">
                        <strong style={{ fontWeight: 550 }}>{r.sensorId}</strong>
                        <div className="muted" style={{ fontSize: 12.5 }}>{r.block}</div>
                      </td>
                      <td data-label="Uva">
                        <VarietyTag id={r.varietyId} />
                      </td>
                      <td data-label="Qualidade">
                        <QualityBadge quality={r.quality} />
                      </td>
                      <td data-label="Confiança">
                        <ConfidenceBar value={r.confidence} />
                      </td>
                      <td data-label="Status">
                        <ClassificationBadge value={r.classification} />
                      </td>
                      <td data-label="">
                        <button className="btn btn-sm btn-secondary" onClick={() => setOpen(r)}>
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="pagination">
            <span>
              {list.length ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, list.length)} de ${formatNumber(list.length)} análises` : '0 análises'}
            </span>
            <div className="row">
              <button className="icon-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Página anterior">
                <ChevronLeft />
              </button>
              <span>
                Página {page} de {pages}
              </span>
              <button className="icon-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Próxima página">
                <ChevronRight />
              </button>
            </div>
          </div>
        </section>
      </div>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </>
  );
}
