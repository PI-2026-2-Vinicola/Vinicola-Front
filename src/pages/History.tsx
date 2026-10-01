import { ArrowDownUp, ChevronLeft, ChevronRight, Download, FilterX, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ReadingThumb } from '../components/analysis/ReadingListItem';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { AnalysesByDayChart, QualityLegend } from '../components/charts/Charts';
import { PageHeader } from '../components/layout/PageHeader';
import { ClassificationBadge, QualityBadge, SourceBadge, VarietyTag } from '../components/ui/Badges';
import { ConfidenceBar } from '../components/ui/ConfidenceBar';
import { PeriodPicker } from '../components/ui/Filters';
import { EmptyState, ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { CLASSIFICATIONS, MATURATION_LABEL, MATURATION_ORDER, QUALITY_LABEL, QUALITY_ORDER, SOURCE_LABEL } from '../data/labels';
import type { Quality, Reading, ReadingSource } from '../data/types';
import { VARIETIES } from '../data/varieties';
import { useByDay, useReadings, useSensors, useSummary } from '../hooks/queries';
import { formatDate, formatNumber, formatPct, formatTime } from '../lib/format';
import { isPeriod, periodQuery, type Period } from '../lib/period';
import { exportReadings, type ReadingQuery, type ReadingSort } from '../services/api';

const PAGE_SIZE = 25;
const SOURCES: ReadingSource[] = ['sensor', 'upload', 'importacao', 'demonstracao'];

/** Lê os filtros da URL (links como /historico?sensor=S-001&qualidade=critica funcionam direto). */
function useHistoryFilters() {
  const [params, setParams] = useSearchParams();
  const rawPeriod = params.get('periodo');
  const period: Period = isPeriod(rawPeriod) ? rawPeriod : '30';
  const from = params.get('de') ?? '';
  const to = params.get('ate') ?? '';
  const quality = (params.get('qualidade') ?? '').split(',').filter((q): q is Quality => (QUALITY_ORDER as string[]).includes(q));
  const filters: ReadingQuery = {
    ...periodQuery(period, from, to),
    sensorId: params.get('sensor') || undefined,
    varietyId: params.get('variedade') || undefined,
    quality,
    classification: params.get('classificacao') || undefined,
    maturation: params.get('maturacao') || undefined,
    block: params.get('bloco') || undefined,
    source: params.get('origem') || undefined,
    q: params.get('q') || undefined,
  };
  const sort = (params.get('ordem') as ReadingSort | null) ?? 'recentes';
  const page = Math.max(1, Number(params.get('pagina') ?? 1) || 1);
  const update = (patch: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!keepPage) next.delete('pagina');
    setParams(next, { replace: true });
  };
  const clear = () => setParams(new URLSearchParams(), { replace: true });
  const active = [...params.keys()].filter((k) => !['pagina', 'ordem'].includes(k)).length;
  return { params, period, from, to, quality, filters, sort, page, update, clear, active };
}

export default function History() {
  const { params, period, from, to, quality, filters, sort, page, update, clear, active } = useHistoryFilters();
  const toast = useToast();
  const sensors = useSensors();
  const [searchText, setSearchText] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState<Reading | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const readings = useReadings(filters, page, PAGE_SIZE, sort);
  const summary = useSummary(filters);
  const byDay = useByDay(filters);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== searchText.trim()) update({ q: searchText.trim() || null });
    }, 350);
    return () => clearTimeout(t);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocks = useMemo(() => [...new Set((sensors.data ?? []).map((s) => s.block))].sort(), [sensors.data]);
  const total = readings.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = summary.data?.quality;

  const toggleQuality = (q: Quality) => {
    const next = quality.includes(q) ? quality.filter((x) => x !== q) : [...quality, q];
    update({ qualidade: next.length ? next.join(',') : null });
  };
  const toggleSort = (key: 'data' | 'confianca') => {
    const next: ReadingSort = key === 'data' ? (sort === 'recentes' ? 'antigas' : 'recentes') : sort === 'confianca_desc' ? 'confianca_asc' : 'confianca_desc';
    update({ ordem: next === 'recentes' ? null : next }, false);
  };
  const doExport = async () => {
    setExporting(true);
    try {
      await exportReadings(filters);
      toast.success('Exportação gerada.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Registro completo"
        title="Histórico de análises"
        description="Todas as leituras registradas — de sensores, envios manuais e importações — com filtros combináveis."
        actions={
          <button className="btn btn-secondary" onClick={doExport} disabled={exporting || total === 0}>
            {exporting ? <span className="spinner" /> : <Download />} Exportar CSV
          </button>
        }
      />

      <section className={`card card-pad filters-card ${filtersOpen ? 'is-open' : ''}`}>
        <button className="btn btn-secondary btn-sm filters-toggle" onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
          <SlidersHorizontal /> Filtros{active ? ` (${active})` : ''}
        </button>
        <div className="filters">
          <div className="field span-2">
            <label htmlFor="h-search">Pesquisar</label>
            <div className="input-icon">
              <Search aria-hidden="true" />
              <input id="h-search" className="input" placeholder="Código, sensor, local, variedade, observação…" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="h-sensor">Sensor</label>
            <select id="h-sensor" className="select" value={params.get('sensor') ?? ''} onChange={(e) => update({ sensor: e.target.value || null })}>
              <option value="">Todos</option>
              {(sensors.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} · {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="h-block">Bloco</label>
            <select id="h-block" className="select" value={params.get('bloco') ?? ''} onChange={(e) => update({ bloco: e.target.value || null })}>
              <option value="">Todos</option>
              {blocks.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="h-variety">Variedade</label>
            <select id="h-variety" className="select" value={params.get('variedade') ?? ''} onChange={(e) => update({ variedade: e.target.value || null })}>
              <option value="">Todas</option>
              {VARIETIES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="h-class">Classificação</label>
            <select id="h-class" className="select" value={params.get('classificacao') ?? ''} onChange={(e) => update({ classificacao: e.target.value || null })}>
              <option value="">Todas</option>
              {CLASSIFICATIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="h-mat">Maturação</label>
            <select id="h-mat" className="select" value={params.get('maturacao') ?? ''} onChange={(e) => update({ maturacao: e.target.value || null })}>
              <option value="">Todas</option>
              {[...MATURATION_ORDER, 'nao_informada' as const].map((m) => (
                <option key={m} value={m}>
                  {MATURATION_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="h-source">Origem</label>
            <select id="h-source" className="select" value={params.get('origem') ?? ''} onChange={(e) => update({ origem: e.target.value || null })}>
              <option value="">Todas</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters-foot">
          <PeriodPicker value={period} from={from} to={to} onChange={(p, f, t) => update({ periodo: p === '30' ? null : p, de: p === 'custom' ? f || null : null, ate: p === 'custom' ? t || null : null })} options={[{ value: '7', label: '7 dias' }, { value: '30', label: '30 dias' }, { value: '90', label: '90 dias' }, { value: '365', label: '12 meses' }]} />
          <div className="chip-row" role="group" aria-label="Qualidade">
            {QUALITY_ORDER.map((q) => (
              <button key={q} className="chip" aria-pressed={quality.includes(q)} onClick={() => toggleQuality(q)}>
                {QUALITY_LABEL[q]}
              </button>
            ))}
          </div>
          {active > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchText('');
                clear();
              }}
            >
              <FilterX /> Limpar filtros
            </button>
          )}
        </div>
      </section>

      <div className="grid-main-side">
        <ChartCard title="Leituras filtradas" subtitle="Por dia e classificação" legend={<QualityLegend counts={counts} />} size="sm">
          {!byDay.data ? <LoadingBlock height={200} /> : total === 0 ? <EmptyState compact title="Nenhuma leitura" /> : <AnalysesByDayChart days={byDay.data} />}
        </ChartCard>
        <section className="card card-pad">
          <h3 className="card-title">Resumo</h3>
          <p className="card-sub">Indicadores dos filtros atuais</p>
          {summary.isPending ? (
            <LoadingBlock height={160} />
          ) : summary.isError ? (
            <ErrorState error={summary.error} compact />
          ) : (
            <div className="vs-numbers">
              <div>
                <span>Total</span>
                <strong>{formatNumber(summary.data.readings)}</strong>
              </div>
              <div>
                <span>Confiança média</span>
                <strong>{formatPct(summary.data.avgConfidence, 1)}</strong>
              </div>
              {QUALITY_ORDER.map((q) => (
                <div key={q} style={q === 'critica' ? { gridColumn: '1 / -1' } : undefined}>
                  <span>
                    <QualityBadge quality={q} />
                  </span>
                  <strong>
                    {formatNumber(summary.data.quality[q])} <small>{summary.data.readings ? formatPct(summary.data.quality[q] / summary.data.readings) : ''}</small>
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        {readings.isPending ? (
          <LoadingBlock height={360} />
        ) : readings.isError ? (
          <ErrorState error={readings.error} onRetry={() => void readings.refetch()} />
        ) : readings.data.items.length === 0 ? (
          <EmptyState icon={<Search aria-hidden="true" />} title="Nenhuma análise encontrada">
            {active ? 'Ajuste os filtros ou a pesquisa.' : 'Ainda não há leituras registradas.'}
          </EmptyState>
        ) : (
          <div className={`table-wrap ${readings.isPlaceholderData ? 'is-refreshing' : ''}`}>
            <table className="table table-cards">
              <thead>
                <tr>
                  <th aria-label="Imagem" />
                  <th>
                    <button className="th-sort" onClick={() => toggleSort('data')}>
                      Data <ArrowDownUp size={13} />
                    </button>
                  </th>
                  <th>Sensor</th>
                  <th>Uva</th>
                  <th>Qualidade</th>
                  <th>
                    <button className="th-sort" onClick={() => toggleSort('confianca')}>
                      Confiança <ArrowDownUp size={13} />
                    </button>
                  </th>
                  <th>Classificação</th>
                  <th>Maturação</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                {readings.data.items.map((r) => (
                  <tr key={r.id} className="row-link" onClick={() => setOpen(r)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(r)}>
                    <td data-label="" className="cell-thumb">
                      <ReadingThumb reading={r} />
                    </td>
                    <td data-label="Data">
                      <strong>{formatDate(r.capturedAt)}</strong> <span className="tabular muted">{formatTime(r.capturedAt)}</span>
                      <div className="mono muted small">{r.id}</div>
                    </td>
                    <td data-label="Sensor">
                      <strong>{r.sensorId}</strong>
                      <div className="muted small">
                        {r.block} · {r.location}
                      </div>
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
                    <td data-label="Classificação">
                      <ClassificationBadge value={r.classification} />
                    </td>
                    <td data-label="Maturação">{MATURATION_LABEL[r.maturation] ?? r.maturation}</td>
                    <td data-label="Origem">
                      <SourceBadge source={r.source} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>{total ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${formatNumber(total)} análises` : '0 análises'}</span>
          <div className="row">
            <button className="icon-btn" onClick={() => update({ pagina: String(page - 1) }, true)} disabled={page <= 1} aria-label="Página anterior">
              <ChevronLeft />
            </button>
            <span>
              Página {Math.min(page, pages)} de {pages}
            </span>
            <button className="icon-btn" onClick={() => update({ pagina: String(page + 1) }, true)} disabled={page >= pages} aria-label="Próxima página">
              <ChevronRight />
            </button>
          </div>
        </div>
      </section>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </div>
  );
}
