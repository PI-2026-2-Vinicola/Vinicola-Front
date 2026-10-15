import { Activity, CircleAlert, Clock, ExternalLink, MapPin, RefreshCw, Rss } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChartCard } from '../components/charts/ChartCard';
import { TimeSeriesChart } from '../components/charts/Charts';
import { PageHeader } from '../components/layout/PageHeader';
import { DeviceMap } from '../components/map/DeviceMap';
import { IntegrationPending, SourceNote } from '../components/ui/Integration';
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import type { ThingSpeakFeed, ThingSpeakField, ThingSpeakPeriod } from '../data/types';
import { useThingSpeak } from '../hooks/queries';
import { formatDate, formatDateTime, formatNumber, formatRelative, formatTime } from '../lib/format';
import { chartableFields, fieldSeries, formatFieldValue, hoursSince, SERIES_COLORS, spansMultipleDays, timeLabel } from '../lib/thingspeak';
import { channelUrl, PERIOD_OPTIONS } from '../services/thingspeak';

const POSITION_SOURCE = {
  registro: 'Enviada pelo dispositivo a cada registro',
  campos: 'Enviada pelo dispositivo nos campos Latitude/Longitude',
  canal: 'Posição fixa informada nas configurações do canal',
} as const;

function NotConfigured({ admin }: { admin: boolean }) {
  return (
    <IntegrationPending
      title="O monitoramento pelo ThingSpeak ainda não foi configurado"
      action={
        <Link to="/sobre#thingspeak" className="btn btn-secondary btn-sm">
          Como a integração funciona
        </Link>
      }
    >
      {admin ? (
        <>
          <p>
            Defina no arquivo <code>.env</code> da API o <strong>THINGSPEAK_CHANNEL_ID</strong> do canal e, se ele for privado, a <strong>THINGSPEAK_READ_API_KEY</strong> (aba
            “API Keys” do canal). Reinicie a API para aplicar.
          </p>
          <p>As credenciais MQTT do dispositivo (client ID, usuário e senha) servem para publicar no canal e não dão acesso à leitura pela API REST.</p>
        </>
      ) : (
        <p>Os dados dos sensores aparecerão aqui assim que um administrador configurar o canal do ThingSpeak no servidor.</p>
      )}
    </IntegrationPending>
  );
}

function FieldCard({ field, color }: { field: ThingSpeakField; color: string }) {
  const value = field.numeric ? formatFieldValue(field.latest, field.unit) : (field.latestText ?? '—');
  return (
    <article className="card field-card" style={{ ['--series' as string]: color }}>
      <header>
        <span className="field-card-key mono">{field.key}</span>
        <h3>{field.name}</h3>
      </header>
      <strong className={`field-card-value ${field.numeric ? '' : 'is-text'}`}>{value}</strong>
      <dl>
        <div>
          <dt>Última leitura</dt>
          <dd>{field.latestAt ? formatRelative(field.latestAt) : 'sem dados'}</dd>
        </div>
        {field.numeric && field.count > 0 && (
          <div>
            <dt>Mín. – máx.</dt>
            <dd>
              {formatFieldValue(field.min, field.unit)} – {formatFieldValue(field.max, field.unit)}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}

/** Contagem regressiva até a próxima atualização automática. */
function useCountdown(updatedAt: number, seconds: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.ceil((updatedAt + seconds * 1000 - now) / 1000));
}

function ChannelView({ feed, period, onPeriod, updatedAt, fetching }: { feed: ThingSpeakFeed; period: ThingSpeakPeriod; onPeriod: (p: ThingSpeakPeriod) => void; updatedAt: number; fetching: boolean }) {
  const ch = feed.channel!;
  const next = useCountdown(updatedAt, feed.refreshSeconds);
  const withDay = spansMultipleDays(feed.entries);
  const labels = feed.entries.map((e) => timeLabel(e.createdAt, withDay));
  const charts = chartableFields(feed.fields);
  const textFields = feed.fields.filter((f) => !f.numeric);
  const age = hoursSince(feed.lastEntryAt);
  const colorOf = (key: string) => SERIES_COLORS[(Number(key.replace('field', '')) - 1) % SERIES_COLORS.length];

  return (
    <>
      <section className="card monitor-bar">
        <div className="monitor-channel">
          <span className="kpi-icon">
            <Rss aria-hidden="true" />
          </span>
          <div>
            <h2>{ch.name ?? `Canal ${ch.id}`}</h2>
            <p className="muted">
              Canal {ch.id}
              {feed.lastEntryAt ? ` · última leitura ${formatRelative(feed.lastEntryAt)} (${formatDateTime(feed.lastEntryAt)})` : ' · sem leituras no período'}
            </p>
          </div>
        </div>
        <div className="monitor-controls">
          <div className="segmented" role="group" aria-label="Período">
            {PERIOD_OPTIONS.map((o) => (
              <button key={o.value} aria-pressed={period === o.value} onClick={() => onPeriod(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
          <span className="monitor-refresh" aria-live="polite">
            <RefreshCw className={fetching ? 'spin' : ''} aria-hidden="true" />
            {fetching ? 'Atualizando…' : `Atualizado às ${formatTime(new Date(updatedAt))} · próxima em ${next}s`}
          </span>
        </div>
      </section>

      {feed.stale && (
        <div className="notice notice-warn" role="alert">
          <CircleAlert />
          <span>
            Exibindo a última resposta válida, obtida em {feed.fetchedAt ? formatDateTime(feed.fetchedAt) : '—'}. {feed.warning}
          </span>
        </div>
      )}
      {age !== null && age > 24 && (
        <div className="notice notice-warn">
          <Clock />
          <span>O canal não recebe novos registros desde {formatDate(feed.lastEntryAt!)}. Verifique se o dispositivo está ligado e conectado.</span>
        </div>
      )}

      {feed.fields.length === 0 ? (
        <section className="card">
          <EmptyState title="O canal não tem campos configurados">Nenhum campo (field1 a field8) foi nomeado nas configurações do canal no ThingSpeak.</EmptyState>
        </section>
      ) : (
        <>
          <div className="field-grid">
            {feed.fields.map((f) => (
              <FieldCard key={f.key} field={f} color={colorOf(f.key)} />
            ))}
          </div>

          {feed.entries.length === 0 ? (
            <section className="card">
              <EmptyState icon={<Activity aria-hidden="true" />} title="Nenhum registro neste período">
                O canal existe, mas não recebeu dados no período escolhido. Tente um período maior.
              </EmptyState>
            </section>
          ) : (
            <div className="grid-2">
              {charts.map((f) => (
                <ChartCard
                  key={f.key}
                  title={f.name}
                  subtitle={`${feed.aggregation ?? ''}${f.unit ? ` · ${f.unit}` : ''}`}
                  table={{ columns: ['Data e hora', f.unit ? `Valor (${f.unit})` : 'Valor'], rows: feed.entries.filter((e) => e.values[f.key] != null).map((e) => [formatDateTime(e.createdAt), e.values[f.key]!]) }}
                >
                  <TimeSeriesChart labels={labels} data={fieldSeries(feed.entries, f.key)} label={f.name} color={colorOf(f.key)} unit={f.unit} />
                </ChartCard>
              ))}
            </div>
          )}

          {textFields.length > 0 && (
            <p className="muted small">Campos de texto ({textFields.map((f) => f.name).join(', ')}) exibem apenas o último valor recebido.</p>
          )}
        </>
      )}

      <section className="card card-pad">
        <h3 className="card-title">Localização do dispositivo</h3>
        {feed.position ? (
          <>
            <p className="card-sub">
              {POSITION_SOURCE[feed.position.source]}
              {feed.position.at && <> · {formatDateTime(feed.position.at)} ({formatRelative(feed.position.at)})</>} · {feed.position.latitude.toLocaleString('pt-BR')},{' '}
              {feed.position.longitude.toLocaleString('pt-BR')}
            </p>
            <DeviceMap position={feed.position} entries={feed.entries} />
          </>
        ) : (
          <EmptyState icon={<MapPin aria-hidden="true" />} title="O canal não recebeu localização">
            Para exibir a posição, o dispositivo deve enviar <code>lat</code> e <code>long</code> junto com os campos (ou campos chamados “Latitude” e “Longitude”), ou a posição
            fixa deve ser informada nas configurações do canal.
          </EmptyState>
        )}
      </section>

      <section className="card card-pad channel-info">
        <h3 className="card-title">Sobre o canal</h3>
        {ch.description && <p>{ch.description}</p>}
        <dl className="kv">
          <dt>Identificador</dt>
          <dd className="mono">{ch.id}</dd>
          <dt>Registros no período</dt>
          <dd>{formatNumber(feed.entries.length)}</dd>
          {ch.lastEntryId !== null && (
            <>
              <dt>Total de entradas no canal</dt>
              <dd>{formatNumber(ch.lastEntryId)}</dd>
            </>
          )}
          {ch.createdAt && (
            <>
              <dt>Criado em</dt>
              <dd>{formatDate(ch.createdAt)}</dd>
            </>
          )}
          {ch.latitude !== null && ch.longitude !== null && (ch.latitude !== 0 || ch.longitude !== 0) && (
            <>
              <dt>Localização informada</dt>
              <dd>
                <MapPin size={14} aria-hidden="true" /> {ch.latitude.toLocaleString('pt-BR')}, {ch.longitude.toLocaleString('pt-BR')}
              </dd>
            </>
          )}
        </dl>
        <a className="link" href={channelUrl(ch.id)} target="_blank" rel="noopener noreferrer">
          Abrir o canal no ThingSpeak <ExternalLink />
        </a>
        <SourceNote
          source="ThingSpeak (MathWorks), API REST de leitura"
          fetchedAt={feed.fetchedAt}
          extra={`atualização automática a cada ${feed.refreshSeconds} s; os valores não são gravados na OASIS`}
        />
      </section>
    </>
  );
}

export default function Monitoring() {
  const [params, setParams] = useSearchParams();
  const period = PERIOD_OPTIONS.find((o) => o.value === params.get('periodo'))?.value ?? 'recent';
  const feed = useThingSpeak(period);
  const { can } = useAuth();
  const setPeriod = (p: ThingSpeakPeriod) => {
    const next = new URLSearchParams(window.location.search);
    if (p === 'recent') next.delete('periodo');
    else next.set('periodo', p);
    setParams(next, { replace: true });
  };
  const data = feed.data;

  return (
    <div className="page">
      <PageHeader
        eyebrow="IoT · ThingSpeak"
        title="Monitoramento"
        description="Leituras que os dispositivos publicam no canal do ThingSpeak configurado para o projeto, atualizadas automaticamente."
        actions={
          data?.configured && (
            <button className="btn btn-secondary" onClick={() => void feed.refetch()} disabled={feed.isFetching}>
              <RefreshCw className={feed.isFetching ? 'spin' : ''} /> Atualizar agora
            </button>
          )
        }
      />
      {feed.isPending ? (
        <section className="card">
          <LoadingBlock height={320} label="Consultando o ThingSpeak…" />
        </section>
      ) : feed.isError ? (
        <section className="card">
          <ErrorState error={feed.error} onRetry={() => void feed.refetch()} />
        </section>
      ) : !data!.configured ? (
        <NotConfigured admin={can('administracao')} />
      ) : (
        <ChannelView feed={data!} period={period} onPeriod={setPeriod} updatedAt={feed.dataUpdatedAt} fetching={feed.isFetching} />
      )}
    </div>
  );
}
