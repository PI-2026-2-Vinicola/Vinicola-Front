import { CalendarRange, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIntegrations, useMunicipalities, useZarc, useZarcCultures } from '../../hooks/queries';
import { filterByRisk, formatHarvest, formatWindow, monthsCovered, MONTHS, RISK_OPTIONS } from '../../lib/zarc';
import { EMBRAPA_LINKS } from '../../services/embrapa';
import { IntegrationPending, SourceNote } from '../ui/Integration';
import { EmptyState, ErrorState, LoadingBlock } from '../ui/States';

function MonthStrip({ months, risk }: { months: number[]; risk: number | null }) {
  return (
    <div className="zarc-months" aria-hidden="true">
      {MONTHS.map((m, i) => (
        <i key={m} className={months.includes(i + 1) ? `on risk-${risk ?? 'na'}` : ''} title={m} />
      ))}
    </div>
  );
}

/** Janelas de plantio do Zarc para culturas de uva (API Agritec v2) nos municípios do Submédio São Francisco. */
export function ZarcPanel() {
  const integrations = useIntegrations();
  const configured = integrations.data?.embrapa.configured ?? false;
  const municipalities = useMunicipalities();
  const cultures = useZarcCultures(configured);
  const [ibge, setIbge] = useState<number | null>(null);
  const [cultureId, setCultureId] = useState<number | null>(null);
  const [maxRisk, setMaxRisk] = useState<number>(40);
  const zarc = useZarc(configured ? cultureId : null, ibge);

  useEffect(() => {
    if (ibge === null && municipalities.data?.length) setIbge(municipalities.data[0].ibgeCode);
  }, [ibge, municipalities.data]);
  useEffect(() => {
    if (cultureId === null && cultures.data?.length) setCultureId((cultures.data.find((c) => c.hasZoning) ?? cultures.data[0]).id);
  }, [cultureId, cultures.data]);

  if (integrations.isPending) return <LoadingBlock height={240} />;
  if (integrations.isError) return <ErrorState error={integrations.error} onRetry={() => void integrations.refetch()} />;
  if (!configured)
    return (
      <IntegrationPending
        title="A consulta ao Zarc ainda não está disponível neste servidor"
        action={
          <Link to="/sobre#embrapa" className="btn btn-secondary btn-sm">
            Como a integração funciona
          </Link>
        }
      >
        <p>As janelas de plantio vêm da API Agritec v2, da plataforma AgroAPI da Embrapa, que exige credenciais de acesso configuradas no servidor.</p>
        <p className="small">
          Administradores: defina <code>EMBRAPA_CONSUMER_KEY</code> e <code>EMBRAPA_CONSUMER_SECRET</code> no arquivo <code>.env</code> da API e reinicie o serviço.
        </p>
      </IntegrationPending>
    );

  const data = zarc.data;
  const windows = data ? filterByRisk(data.windows, maxRisk) : [];
  const municipality = municipalities.data?.find((m) => m.ibgeCode === ibge);

  return (
    <div className="stack">
      <section className="card card-pad zarc-intro">
        <p>
          O <strong>Zoneamento Agrícola de Risco Climático (Zarc)</strong>, do Ministério da Agricultura e Pecuária, indica para cada município os períodos de plantio com menor
          risco de perdas por eventos climáticos adversos, conforme o tipo de solo e o ciclo da cultura. Os riscos são publicados em três faixas: até 20%, 30% ou 40%.
        </p>
        <a className="link" href={EMBRAPA_LINKS.zarc} target="_blank" rel="noopener noreferrer">
          Saiba mais sobre o Zarc <ExternalLink />
        </a>
      </section>

      <section className="card filter-bar zarc-filters">
        <div className="filter-bar-row">
          <div className="field">
            <label htmlFor="zarc-muni">Município</label>
            <select id="zarc-muni" className="select" value={ibge ?? ''} onChange={(e) => setIbge(Number(e.target.value))}>
              {(municipalities.data ?? []).map((m) => (
                <option key={m.ibgeCode} value={m.ibgeCode}>
                  {m.name} – {m.uf}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="zarc-cultura">Cultura (dados do Agritec)</label>
            <select id="zarc-cultura" className="select" value={cultureId ?? ''} onChange={(e) => setCultureId(Number(e.target.value))} disabled={!cultures.data?.length}>
              {(cultures.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName ?? c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <span className="field-label" id="zarc-risco">
              Risco máximo
            </span>
            <div className="segmented" role="group" aria-labelledby="zarc-risco">
              {RISK_OPTIONS.map((r) => (
                <button key={r} aria-pressed={maxRisk === r} onClick={() => setMaxRisk(r)}>
                  até {r}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        {cultures.isPending ? (
          <LoadingBlock height={220} label="Consultando as culturas do Agritec…" />
        ) : cultures.isError ? (
          <ErrorState error={cultures.error} onRetry={() => void cultures.refetch()} />
        ) : cultures.data.length === 0 ? (
          <EmptyState icon={<CalendarRange aria-hidden="true" />} title="O Agritec não retornou culturas de uva">
            A lista de culturas da API Agritec v2 não contém nenhuma cultura de uva no momento.
          </EmptyState>
        ) : zarc.isPending ? (
          <LoadingBlock height={220} label="Consultando o Zarc…" />
        ) : zarc.isError ? (
          <ErrorState error={zarc.error} onRetry={() => void zarc.refetch()} />
        ) : windows.length === 0 ? (
          <EmptyState icon={<CalendarRange aria-hidden="true" />} title="Nenhuma janela de plantio indicada">
            O Zarc não indica janela de plantio para {data!.culture.fullName ?? data!.culture.name} em {municipality?.name ?? data!.municipality} com risco de até {maxRisk}%.
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table zarc-table">
                <thead>
                  <tr>
                    <th>Solo</th>
                    <th>Ciclo</th>
                    <th>Janela de plantio</th>
                    <th>
                      <span className="sr-only">Meses</span>
                      <div className="zarc-months-head" aria-hidden="true">
                        {MONTHS.map((m) => (
                          <span key={m}>{m[0]}</span>
                        ))}
                      </div>
                    </th>
                    <th>Risco</th>
                    <th>Safra</th>
                  </tr>
                </thead>
                <tbody>
                  {windows.map((w, i) => (
                    <tr key={i}>
                      <td>{w.soil ?? '—'}</td>
                      <td>{w.cycle ?? '—'}</td>
                      <td className="nowrap">{formatWindow(w)}</td>
                      <td>
                        <MonthStrip months={monthsCovered(w)} risk={w.risk} />
                      </td>
                      <td className="nowrap">{w.risk !== null ? `até ${w.risk}%` : '—'}</td>
                      <td className="nowrap">{formatHarvest(w)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-pad zarc-notes">
              <div className="zarc-legend" aria-label="Legenda das faixas de risco">
                <span>
                  <i style={{ background: 'var(--good)' }} /> até 20% de risco
                </span>
                <span>
                  <i style={{ background: 'var(--warn)' }} /> até 30%
                </span>
                <span>
                  <i style={{ background: '#e07b39' }} /> até 40%
                </span>
                <span>Cada barra mostra os meses da janela de plantio (jan → dez).</span>
              </div>
              {Object.keys(data!.soils).length > 0 && (
                <details>
                  <summary>O que significam os tipos de solo</summary>
                  <dl className="kv">
                    {Object.entries(data!.soils).map(([k, v]) => (
                      <div key={k} style={{ display: 'contents' }}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
              {data!.info.grupos && (
                <details>
                  <summary>Ciclos de desenvolvimento</summary>
                  <p>{data!.info.grupos}</p>
                </details>
              )}
              <SourceNote
                source={data!.source}
                fetchedAt={data!.fetchedAt}
                extra={[data!.info.safra && `safra ${data!.info.safra}`, windows[0]?.ordinance ?? data!.info.portaria].filter(Boolean).join(' · ') || undefined}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
