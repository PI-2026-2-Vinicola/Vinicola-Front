import { ArrowRight, Cpu, LayoutGrid, MapPin, Rows3 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GrapeScene } from '../components/grape/GrapeScene';
import { PageHero } from '../components/layout/PageHero';
import { SensorMap } from '../components/map/SensorMap';
import { QualityBadge, SensorStatusBadge, VarietyTag } from '../components/ui/Badges';
import { BatteryMeter, SignalMeter } from '../components/ui/Meters';
import { Reveal } from '../components/ui/Reveal';
import { useData } from '../context/DataContext';
import { SENSOR_STATUS_LABEL } from '../data/labels';
import { FARM } from '../data/sensors';
import type { SensorStatus } from '../data/types';
import { formatDateTime, formatNumber, formatPct, formatRelative } from '../lib/format';
import { countByQuality, ratio } from '../lib/stats';
import { resolveImageUrl } from '../services/api';

export default function Sensors() {
  const { sensors, readings, sensorStats } = useData();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(sensors[0]?.id ?? '');
  const [status, setStatus] = useState<SensorStatus | 'todos'>('todos');
  const [view, setView] = useState<'cards' | 'tabela'>('cards');

  const lastReadings = useMemo(() => Object.fromEntries(Object.entries(sensorStats).map(([k, v]) => [k, v.lastReading])), [sensorStats]);
  const quality = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of sensors) {
      const c = countByQuality(readings.filter((r) => r.sensorId === s.id));
      out[s.id] = ratio(c.boa, c.total);
    }
    return out;
  }, [sensors, readings]);

  const list = sensors.filter((s) => status === 'todos' || s.status === status);
  const sel = sensors.find((s) => s.id === selected);
  const selLast = sel ? lastReadings[sel.id] : undefined;
  const count = (st: SensorStatus) => sensors.filter((s) => s.status === st).length;

  return (
    <>
      <PageHero
        eyebrow="Rede de dispositivos"
        title="Sensores IoT"
        description={`Dispositivos ESP32 + câmera instalados nos talhões da ${FARM.name}. Acompanhe status, localização e comunicação de cada sensor.`}
      />
      <div className="container page-body">
        <div className="card toolbar" style={{ marginBottom: 20 }}>
          <div className="toolbar-group">
            <SensorStatusBadge status="online" /> <strong>{count('online')}</strong>
            <SensorStatusBadge status="atencao" /> <strong>{count('atencao')}</strong>
            <SensorStatusBadge status="offline" /> <strong>{count('offline')}</strong>
          </div>
          <div className="toolbar-group" style={{ fontSize: 13.5, color: 'var(--ink-500)' }}>
            {formatNumber(readings.length)} análises registradas nos últimos 30 dias
          </div>
        </div>

        <div className="map-layout">
          <Reveal>
            <section className="card card-pad">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Mapa dos sensores</h3>
                  <p className="card-sub">Clique em um marcador para ver os detalhes</p>
                </div>
              </div>
              <SensorMap sensors={sensors} lastReadings={lastReadings} selectedId={selected} onSelect={setSelected} height={500} />
            </section>
          </Reveal>
          <Reveal delay={80}>
            {sel && (
              <section className="card card-pad sensor-panel" style={{ height: '100%' }}>
                <div className="row-between">
                  <div>
                    <h3 className="card-title">{sel.name}</h3>
                    <p className="card-sub mono">{sel.id}</p>
                  </div>
                  <SensorStatusBadge status={sel.status} />
                </div>
                {selLast ? (
                  <GrapeScene
                    className="scene"
                    seed={selLast.imageSeed}
                    varietyId={selLast.varietyId}
                    detections={selLast.detections}
                    capturedAt={selLast.capturedAt}
                    sensorId={sel.id}
                    block={sel.block}
                    imageUrl={resolveImageUrl(selLast)}
                    hud
                  />
                ) : (
                  <div className="empty">Sem leituras.</div>
                )}
                <dl className="kv">
                  <dt>Localização</dt>
                  <dd>{sel.location}</dd>
                  <dt>Variedade do talhão</dt>
                  <dd>
                    <VarietyTag id={sel.varietyId} />
                  </dd>
                  <dt>Última leitura</dt>
                  <dd>{selLast ? formatDateTime(selLast.capturedAt) : '—'}</dd>
                  <dt>Resultado</dt>
                  <dd>{selLast ? <QualityBadge quality={selLast.quality} /> : '—'}</dd>
                  <dt>Análises</dt>
                  <dd>{formatNumber(sensorStats[sel.id]?.analyses ?? 0)}</dd>
                  <dt>Última comunicação</dt>
                  <dd>{formatRelative(sel.lastCommunication)}</dd>
                </dl>
                <Link to={`/sensores/${sel.id}`} className="btn btn-primary" style={{ marginTop: 'auto' }}>
                  Histórico do sensor <ArrowRight className="arrow" />
                </Link>
              </section>
            )}
          </Reveal>
        </div>

        <div className="section-title">
          <div>
            <h2>Todos os sensores</h2>
            <p>Status, última leitura e comunicação de cada dispositivo.</p>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <div className="segmented" role="group" aria-label="Filtrar status">
              {(['todos', 'online', 'atencao', 'offline'] as const).map((s) => (
                <button key={s} aria-pressed={status === s} onClick={() => setStatus(s)}>
                  {s === 'todos' ? 'Todos' : SENSOR_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="segmented" role="group" aria-label="Visualização">
              <button aria-pressed={view === 'cards'} onClick={() => setView('cards')} aria-label="Cartões">
                <LayoutGrid size={16} />
              </button>
              <button aria-pressed={view === 'tabela'} onClick={() => setView('tabela')} aria-label="Tabela">
                <Rows3 size={16} />
              </button>
            </div>
          </div>
        </div>

        {view === 'cards' ? (
          <div className="sensor-grid">
            {list.map((s, i) => {
              const last = lastReadings[s.id];
              return (
                <Reveal key={s.id} delay={i * 50}>
                  <article
                    className={`card card-hover sensor-card ${selected === s.id ? 'is-selected' : ''}`}
                    onClick={() => navigate(`/sensores/${s.id}`)}
                    onMouseEnter={() => setSelected(s.id)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/sensores/${s.id}`)}
                  >
                    <div className="sensor-card-head">
                      <div className="row">
                        <div className="kpi-icon">
                          <Cpu />
                        </div>
                        <div>
                          <h3>{s.name}</h3>
                          <span className="sub">
                            <span className="mono">{s.id}</span> · <MapPin /> {s.location}
                          </span>
                        </div>
                      </div>
                      <SensorStatusBadge status={s.status} />
                    </div>
                    <div className="sensor-stats">
                      <div>
                        <span>Análises</span>
                        <strong>{formatNumber(sensorStats[s.id]?.analyses ?? 0)}</strong>
                      </div>
                      <div>
                        <span>% Boa</span>
                        <strong>{formatPct(quality[s.id] ?? 0)}</strong>
                      </div>
                      <div>
                        <span>Última leitura</span>
                        <strong>{last ? formatRelative(last.capturedAt) : '—'}</strong>
                      </div>
                    </div>
                    <div className="sensor-foot">
                      <BatteryMeter value={s.battery} />
                      <SignalMeter dbm={s.signal} />
                      <span>Com. {formatRelative(s.lastCommunication)}</span>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="card table-wrap">
            <table className="table table-cards">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>ID</th>
                  <th>Localização</th>
                  <th>Status</th>
                  <th>Última leitura</th>
                  <th className="num">Análises</th>
                  <th>Última comunicação</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const last = lastReadings[s.id];
                  return (
                    <tr key={s.id} onClick={() => navigate(`/sensores/${s.id}`)} style={{ cursor: 'pointer' }}>
                      <td data-label="Nome">
                        <strong>{s.name}</strong>
                      </td>
                      <td data-label="ID" className="mono">
                        {s.id}
                      </td>
                      <td data-label="Localização">{s.location}</td>
                      <td data-label="Status">
                        <SensorStatusBadge status={s.status} />
                      </td>
                      <td data-label="Última leitura">{last ? formatDateTime(last.capturedAt) : '—'}</td>
                      <td data-label="Análises" className="num">
                        {formatNumber(sensorStats[s.id]?.analyses ?? 0)}
                      </td>
                      <td data-label="Última comunicação">{formatRelative(s.lastCommunication)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
