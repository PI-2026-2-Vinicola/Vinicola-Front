import { ArrowRight, BellRing, Cpu, Droplets, FileUp, Gauge, Grape, ImageUp, ScanSearch, Sparkles, Thermometer } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ReadingListItem } from '../components/analysis/ReadingListItem';
import { ReadingModal } from '../components/analysis/ReadingModal';
import { ChartCard } from '../components/charts/ChartCard';
import { AnalysesByDayChart, HorizontalBars, QualityDonut, QualityEvolutionChart, QualityLegend } from '../components/charts/Charts';
import { PageHeader } from '../components/layout/PageHeader';
import { SensorMap } from '../components/map/SensorMap';
import { PeriodPicker } from '../components/ui/Filters';
import { KpiCard } from '../components/ui/KpiCard';
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { QUALITY_COLOR, QUALITY_LABEL, QUALITY_ORDER } from '../data/labels';
import type { Reading } from '../data/types';
import { VARIETY_BY_ID } from '../data/varieties';
import { useBreakdown, useByDay, useByHour, useReadings, useSensors, useSummary } from '../hooks/queries';
import { formatDateTime, formatLongDate, formatNumber, formatPct, formatRelative } from '../lib/format';
import { PERIOD_TEXT, pointsChange, ratio, relativeChange } from '../lib/period';
import { usePeriodParams } from '../lib/usePeriodParams';

function GettingStarted() {
  const { can } = useAuth();
  return (
    <section className="card card-pad onboarding">
      <h2>Nenhuma leitura registrada ainda</h2>
      <p>Os indicadores aparecem assim que houver dados. Para começar:</p>
      <ol className="steps">
        {can('gerenciarSensores') && (
          <li>
            <Cpu aria-hidden="true" />
            <div>
              <strong>Cadastre os sensores</strong>
              <span>Código, talhão, variedade e coordenadas. O token do dispositivo é exibido no cadastro.</span>
            </div>
            <Link to="/sensores?novo=1" className="btn btn-secondary btn-sm">
              Cadastrar
            </Link>
          </li>
        )}
        {can('importacao') && (
          <li>
            <FileUp aria-hidden="true" />
            <div>
              <strong>Importe dados existentes</strong>
              <span>Leituras históricas, sensores ou medições ambientais em CSV, Excel ou JSON.</span>
            </div>
            <Link to="/importacao" className="btn btn-secondary btn-sm">
              Importar
            </Link>
          </li>
        )}
        <li>
          <ImageUp aria-hidden="true" />
          <div>
            <strong>Envie uma imagem</strong>
            <span>Foto de um cacho, associada a um sensor, analisada na hora.</span>
          </div>
          <Link to="/analises" className="btn btn-secondary btn-sm">
            Enviar
          </Link>
        </li>
      </ol>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { period, from, to, setPeriod, query } = usePeriodParams('7');
  const [open, setOpen] = useState<Reading | null>(null);
  const hourly = period === '1';
  const evolutionQuery = hourly ? { days: 7 } : query;

  const summary = useSummary(query);
  const byDay = useByDay(query, !hourly);
  const byHour = useByHour(query, hourly);
  const evolution = useByDay(evolutionQuery);
  const bySensor = useBreakdown('sensor', query);
  const byVariety = useBreakdown('variety', query);
  const sensors = useSensors();
  const alerts = useReadings({ ...query, quality: ['atencao', 'critica'] }, 1, 5);
  const latest = useReadings({}, 1, 6);

  const s = summary.data;
  const counts = s?.quality ?? { boa: 0, atencao: 0, critica: 0, total: 0 };
  const buckets = hourly ? byHour.data : byDay.data;
  const evoDays = (evolution.data ?? []).filter((d) => d.total > 0).length;
  const noData = s && s.readings === 0 && latest.data?.total === 0;

  return (
    <div className="page">
      <PageHeader
        title={`Olá, ${user?.name.split(' ')[0]}`}
        description={`Painel de ${formatLongDate(new Date())}${s?.lastReadingAt ? ` · última leitura ${formatRelative(s.lastReadingAt)}` : ''}`}
        actions={<PeriodPicker value={period} from={from} to={to} onChange={setPeriod} />}
      />

      {summary.isError && <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />}
      {noData && <GettingStarted />}

      <div className="kpi-grid">
        <KpiCard
          loading={sensors.isPending}
          icon={<Cpu />}
          label="Sensores comunicando"
          value={s ? s.sensorsOnline + s.sensorsAttention : null}
          total={s ? String(s.sensorsTotal) : undefined}
          foot={s ? (s.sensorsTotal ? `${s.sensorsOffline} offline · ${s.sensorsAttention} em atenção` : 'nenhum sensor cadastrado') : undefined}
        />
        <KpiCard
          loading={summary.isPending}
          icon={<ScanSearch />}
          label="Leituras"
          value={s?.readings ?? null}
          delta={s ? relativeChange(s.readings, s.previous?.readings) : null}
          foot={PERIOD_TEXT[period]}
        />
        <KpiCard
          loading={summary.isPending}
          icon={<Gauge />}
          label="Qualidade (Boa)"
          value={s?.qualityRatio != null ? s.qualityRatio * 100 : null}
          decimals={1}
          suffix="%"
          accent="good"
          delta={s ? pointsChange(s.qualityRatio, s.previous?.qualityRatio) : null}
          deltaMode="points"
          foot={s?.readings ? 'das leituras do período' : 'sem leituras no período'}
        />
        <KpiCard
          loading={summary.isPending}
          icon={<BellRing />}
          label="Alertas"
          value={s?.alerts ?? null}
          accent={counts.critica ? 'bad' : 'warn'}
          upIsGood={false}
          foot={s ? `${counts.critica} necessitam atenção · ${counts.atencao} em atenção` : undefined}
        />
        <KpiCard loading={summary.isPending} icon={<Grape />} label="Cachos identificados" value={s?.clusters ?? null} foot={s ? `em ${formatNumber(s.readings)} leituras` : undefined} />
        <KpiCard loading={summary.isPending} icon={<Sparkles />} label="Confiança média" value={s?.avgConfidence != null ? s.avgConfidence * 100 : null} decimals={1} suffix="%" accent="neutral" foot="detecção do cacho" />
        {s && s.environment.measurements > 0 && (
          <>
            <KpiCard icon={<Thermometer />} label="Temperatura média" value={s.environment.avgTemperatureC} decimals={1} suffix=" °C" accent="neutral" foot={`${formatNumber(s.environment.measurements)} medições`} />
            <KpiCard icon={<Droplets />} label="Umidade média do ar" value={s.environment.avgHumidityPct} decimals={0} suffix="%" accent="neutral" foot={s.environment.lastMeasuredAt ? `última ${formatRelative(s.environment.lastMeasuredAt)}` : undefined} />
          </>
        )}
      </div>

      <div className="grid-main-side">
        <ChartCard
          title="Leituras por período"
          subtitle={hourly ? 'Por hora, hoje' : `Por dia · ${PERIOD_TEXT[period]}`}
          legend={<QualityLegend />}
          table={buckets ? { columns: ['Período', 'Boa', 'Atenção', 'Necessita atenção', 'Total'], rows: buckets.map((b) => [b.label, b.boa, b.atencao, b.critica, b.total]) } : undefined}
        >
          {!buckets ? <LoadingBlock /> : counts.total === 0 ? <EmptyState compact title="Sem leituras no período" /> : <AnalysesByDayChart days={buckets} />}
        </ChartCard>
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h3 className="card-title">Distribuição de qualidade</h3>
              <p className="card-sub">{PERIOD_TEXT[period]}</p>
            </div>
          </div>
          {counts.total === 0 ? (
            <EmptyState compact title="Sem leituras no período" />
          ) : (
            <>
              <div className="chart-box sm">
                <QualityDonut counts={counts} />
              </div>
              <div className="quality-bars">
                {QUALITY_ORDER.map((q) => (
                  <div key={q} className="quality-bar">
                    <span className="legend">
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
            </>
          )}
        </section>
      </div>

      <div className="grid-main-side">
        <ChartCard
          title="Evolução das classificações"
          subtitle={`Percentual diário · ${PERIOD_TEXT[hourly ? '7' : period]}`}
          legend={<QualityLegend />}
          table={evolution.data ? { columns: ['Dia', '% Boa', '% Atenção', '% Necessita atenção', 'Leituras'], rows: evolution.data.map((d) => [d.label, ...QUALITY_ORDER.map((q) => (d.total ? `${Math.round((d[q] / d.total) * 100)}%` : '—')), d.total]) } : undefined}
        >
          {evolution.isPending ? (
            <LoadingBlock />
          ) : evoDays < 2 ? (
            <EmptyState compact title="Dados insuficientes para a evolução">São necessárias leituras em pelo menos dois dias do período.</EmptyState>
          ) : (
            <QualityEvolutionChart days={evolution.data!} />
          )}
        </ChartCard>
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h3 className="card-title">Alertas recentes</h3>
              <p className="card-sub">Leituras que precisam de atenção</p>
            </div>
            <Link to="/historico?qualidade=atencao,critica" className="link">
              Ver todos <ArrowRight />
            </Link>
          </div>
          {alerts.isPending ? (
            <LoadingBlock height={200} />
          ) : alerts.isError ? (
            <ErrorState error={alerts.error} compact onRetry={() => void alerts.refetch()} />
          ) : alerts.data.items.length ? (
            <div className="list">
              {alerts.data.items.map((r) => (
                <ReadingListItem key={r.id} reading={r} onOpen={setOpen} />
              ))}
            </div>
          ) : (
            <EmptyState compact title="Nenhum alerta no período" />
          )}
        </section>
      </div>

      <div className="grid-2">
        <ChartCard
          title="Leituras por sensor"
          subtitle={PERIOD_TEXT[period]}
          size="sm"
          table={bySensor.data ? { columns: ['Sensor', 'Leituras', '% Boa'], rows: bySensor.data.map((g) => [g.key, g.total, formatPct(ratio(g.boa, g.total))]) } : undefined}
        >
          {!bySensor.data ? <LoadingBlock height={200} /> : bySensor.data.length === 0 ? <EmptyState compact title="Sem leituras no período" /> : <HorizontalBars labels={bySensor.data.map((g) => g.key)} values={bySensor.data.map((g) => g.total)} tooltipLabel="Leituras" />}
        </ChartCard>
        <ChartCard
          title="Leituras por variedade"
          subtitle={PERIOD_TEXT[period]}
          size="sm"
          table={byVariety.data ? { columns: ['Variedade', 'Leituras', '% Boa'], rows: byVariety.data.map((g) => [VARIETY_BY_ID[g.key as keyof typeof VARIETY_BY_ID]?.name ?? g.key, g.total, formatPct(ratio(g.boa, g.total))]) } : undefined}
        >
          {!byVariety.data ? (
            <LoadingBlock height={200} />
          ) : byVariety.data.length === 0 ? (
            <EmptyState compact title="Sem leituras no período" />
          ) : (
            <HorizontalBars labels={byVariety.data.map((g) => VARIETY_BY_ID[g.key as keyof typeof VARIETY_BY_ID]?.name ?? g.key)} values={byVariety.data.map((g) => g.total)} color="#c05478" />
          )}
        </ChartCard>
      </div>

      <div className="map-layout">
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h3 className="card-title">Mapa dos sensores</h3>
              <p className="card-sub">Posição cadastrada de cada dispositivo</p>
            </div>
            <Link to="/sensores" className="link">
              Sensores <ArrowRight />
            </Link>
          </div>
          {sensors.isPending ? <LoadingBlock height={360} /> : sensors.isError ? <ErrorState error={sensors.error} onRetry={() => void sensors.refetch()} /> : <SensorMap sensors={sensors.data} height={360} />}
        </section>
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h3 className="card-title">Últimas leituras</h3>
              <p className="card-sub">{latest.data?.items[0] ? `mais recente em ${formatDateTime(latest.data.items[0].capturedAt)}` : 'Todas as origens'}</p>
            </div>
            <Link to="/historico" className="link">
              Histórico <ArrowRight />
            </Link>
          </div>
          {latest.isPending ? (
            <LoadingBlock height={240} />
          ) : latest.isError ? (
            <ErrorState error={latest.error} compact onRetry={() => void latest.refetch()} />
          ) : latest.data.items.length ? (
            <div className="list">
              {latest.data.items.map((r) => (
                <ReadingListItem key={r.id} reading={r} onOpen={setOpen} />
              ))}
            </div>
          ) : (
            <EmptyState compact title="Nenhuma leitura registrada" />
          )}
        </section>
      </div>
      <ReadingModal reading={open} onClose={() => setOpen(null)} />
    </div>
  );
}
