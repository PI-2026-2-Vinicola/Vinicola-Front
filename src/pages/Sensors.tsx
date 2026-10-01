import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Cpu, LayoutGrid, MapPin, MapPinOff, Plus, Rows3, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { SensorMap } from '../components/map/SensorMap';
import { SensorForm, type SensorFormValues } from '../components/sensors/SensorForm';
import { TokenReveal } from '../components/sensors/TokenReveal';
import { SensorStatusBadge, VarietyTag } from '../components/ui/Badges';
import { BatteryMeter, SignalMeter } from '../components/ui/Meters';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { SENSOR_STATUS_LABEL } from '../data/labels';
import type { Sensor, SensorStatus } from '../data/types';
import { keys, useSensors } from '../hooks/queries';
import { formatDateTime, formatNumber, formatPct, formatRelative } from '../lib/format';
import { createSensor } from '../services/api';

const STATUSES: SensorStatus[] = ['online', 'atencao', 'offline', 'inativo'];

function NewSensorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [created, setCreated] = useState<{ id: string; token: string } | null>(null);
  const mutation = useMutation({
    mutationFn: (v: SensorFormValues) => createSensor(v),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: keys.sensors });
      setCreated({ id: res.sensor.id, token: res.deviceToken });
      toast.success(`Sensor ${res.sensor.id} cadastrado.`);
    },
  });
  const close = () => {
    setCreated(null);
    mutation.reset();
    onClose();
  };
  return (
    <Modal open={open} onClose={close} label="Novo sensor" size="sm">
      <div className="modal-body">
        {created ? (
          <TokenReveal sensorId={created.id} token={created.token} onDone={close} />
        ) : (
          <>
            <h2 className="modal-title">Novo sensor</h2>
            <p className="muted small">O status passa a “online” quando o dispositivo enviar o primeiro sinal com o token gerado.</p>
            <SensorForm onSubmit={(v) => mutation.mutate(v)} submitting={mutation.isPending} submitLabel="Cadastrar sensor" serverError={mutation.isError ? errorMessage(mutation.error) : null} />
          </>
        )}
      </div>
    </Modal>
  );
}

export default function Sensors() {
  const { can } = useAuth();
  const sensors = useSensors();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState<SensorStatus | 'todos'>('todos');
  const [block, setBlock] = useState('todos');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'tabela'>('tabela');
  const [creating, setCreating] = useState(params.get('novo') === '1' && can('gerenciarSensores'));

  useEffect(() => {
    if (params.get('novo')) {
      const next = new URLSearchParams(window.location.search);
      next.delete('novo');
      setParams(next, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const all = sensors.data ?? [];
  const blocks = useMemo(() => [...new Set(all.map((s) => s.block))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [all]);
  const term = search.trim().toLowerCase();
  const list = all.filter(
    (s) =>
      (status === 'todos' || s.status === status) &&
      (block === 'todos' || s.block === block) &&
      (!term || [s.id, s.name, s.location, s.block].some((x) => x.toLowerCase().includes(term))),
  );
  const count = (st: SensorStatus) => all.filter((s) => s.status === st).length;
  const sel = all.find((s) => s.id === selected);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Rede de dispositivos"
        title="Sensores"
        description="Dispositivos de captura instalados nos talhões. O status é calculado pela última comunicação, bateria e sinal informados pelo próprio dispositivo."
        actions={
          can('gerenciarSensores') && (
            <button className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus /> Novo sensor
            </button>
          )
        }
      />

      {sensors.isPending ? (
        <LoadingBlock height={420} />
      ) : sensors.isError ? (
        <ErrorState error={sensors.error} onRetry={() => void sensors.refetch()} />
      ) : all.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Cpu aria-hidden="true" />}
            title="Nenhum sensor cadastrado"
            action={
              can('gerenciarSensores') ? (
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                    <Plus /> Cadastrar sensor
                  </button>
                  <Link to="/importacao?tipo=sensors" className="btn btn-secondary btn-sm">
                    Importar planilha
                  </Link>
                </div>
              ) : undefined
            }
          >
            {can('gerenciarSensores') ? 'Cadastre os dispositivos ou importe uma planilha de sensores.' : 'Peça a um administrador para cadastrar os dispositivos.'}
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="status-strip">
            {STATUSES.map((st) => (
              <button key={st} className={`status-pill ${status === st ? 'active' : ''}`} onClick={() => setStatus(status === st ? 'todos' : st)} aria-pressed={status === st}>
                <SensorStatusBadge status={st} />
                <strong>{count(st)}</strong>
              </button>
            ))}
          </div>

          <div className="map-layout">
            <section className="card card-pad">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Mapa</h3>
                  <p className="card-sub">Clique em um marcador para ver os detalhes</p>
                </div>
              </div>
              <SensorMap sensors={all} selectedId={selected} onSelect={setSelected} height={440} />
            </section>
            <section className="card card-pad sensor-panel">
              {sel ? (
                <>
                  <div className="row-between">
                    <div>
                      <h3 className="card-title">{sel.name}</h3>
                      <p className="card-sub mono">{sel.id}</p>
                    </div>
                    <SensorStatusBadge status={sel.status} />
                  </div>
                  <p className="status-reason">{sel.statusReason}</p>
                  <dl className="kv">
                    <dt>Local</dt>
                    <dd>
                      {sel.block} · {sel.location}
                    </dd>
                    <dt>Variedade</dt>
                    <dd>
                      <VarietyTag id={sel.varietyId} />
                    </dd>
                    <dt>Análises</dt>
                    <dd>{formatNumber(sel.analysesCount)}</dd>
                    <dt>% Boa</dt>
                    <dd>{formatPct(sel.qualityRatio)}</dd>
                    <dt>Última leitura</dt>
                    <dd>{sel.lastReadingAt ? formatDateTime(sel.lastReadingAt) : 'nenhuma'}</dd>
                    <dt>Comunicação</dt>
                    <dd>{formatRelative(sel.lastCommunication)}</dd>
                    <dt>Bateria / sinal</dt>
                    <dd className="row" style={{ gap: 10 }}>
                      <BatteryMeter value={sel.battery} />
                      <SignalMeter dbm={sel.signal} />
                    </dd>
                  </dl>
                  <Link to={`/sensores/${sel.id}`} className="btn btn-primary" style={{ marginTop: 'auto' }}>
                    Detalhes e histórico <ArrowRight />
                  </Link>
                </>
              ) : (
                <EmptyState compact icon={<MapPin aria-hidden="true" />} title="Selecione um sensor">
                  Clique em um marcador ou em uma linha da lista.
                </EmptyState>
              )}
            </section>
          </div>

          <section className="card">
            <div className="table-toolbar">
              <div className="input-icon">
                <Search aria-hidden="true" />
                <input className="input" placeholder="Código, nome, bloco ou local…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Pesquisar sensores" />
              </div>
              <select className="select" value={block} onChange={(e) => setBlock(e.target.value)} aria-label="Filtrar por bloco">
                <option value="todos">Todos os blocos</option>
                {blocks.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value as SensorStatus | 'todos')} aria-label="Filtrar por status">
                <option value="todos">Todos os status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {SENSOR_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <div className="segmented" role="group" aria-label="Visualização">
                <button aria-pressed={view === 'tabela'} onClick={() => setView('tabela')} aria-label="Tabela">
                  <Rows3 size={16} />
                </button>
                <button aria-pressed={view === 'cards'} onClick={() => setView('cards')} aria-label="Cartões">
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
            {list.length === 0 ? (
              <EmptyState compact title="Nenhum sensor corresponde aos filtros" />
            ) : view === 'tabela' ? (
              <div className="table-wrap">
                <table className="table table-cards">
                  <thead>
                    <tr>
                      <th>Sensor</th>
                      <th>Local</th>
                      <th>Status</th>
                      <th className="num">Análises</th>
                      <th className="num">% Boa</th>
                      <th>Última leitura</th>
                      <th>Comunicação</th>
                      <th>Bateria / sinal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((s) => (
                      <SensorRow key={s.id} s={s} onOpen={() => navigate(`/sensores/${s.id}`)} onHover={() => setSelected(s.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sensor-grid">
                {list.map((s) => (
                  <article key={s.id} className="card sensor-card" onClick={() => navigate(`/sensores/${s.id}`)} onMouseEnter={() => setSelected(s.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate(`/sensores/${s.id}`)}>
                    <div className="sensor-card-head">
                      <div>
                        <h3>{s.name}</h3>
                        <span className="sub">
                          <span className="mono">{s.id}</span> · {s.block} · {s.location}
                        </span>
                      </div>
                      <SensorStatusBadge status={s.status} />
                    </div>
                    <div className="sensor-stats">
                      <div>
                        <span>Análises</span>
                        <strong>{formatNumber(s.analysesCount)}</strong>
                      </div>
                      <div>
                        <span>% Boa</span>
                        <strong>{formatPct(s.qualityRatio)}</strong>
                      </div>
                      <div>
                        <span>Última leitura</span>
                        <strong>{s.lastReadingAt ? formatRelative(s.lastReadingAt) : '—'}</strong>
                      </div>
                    </div>
                    <div className="sensor-foot">
                      <BatteryMeter value={s.battery} />
                      <SignalMeter dbm={s.signal} />
                      {!s.hasValidLocation && (
                        <span className="muted" title="Sem coordenadas">
                          <MapPinOff size={14} />
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <NewSensorModal open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function SensorRow({ s, onOpen, onHover }: { s: Sensor; onOpen: () => void; onHover: () => void }) {
  return (
    <tr onClick={onOpen} onMouseEnter={onHover} className="row-link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <td data-label="Sensor">
        <strong>{s.name}</strong>
        <div className="mono muted small">{s.id}</div>
      </td>
      <td data-label="Local">
        {s.block} · {s.location}
        {!s.hasValidLocation && <div className="muted small">sem coordenadas</div>}
      </td>
      <td data-label="Status">
        <SensorStatusBadge status={s.status} title={s.statusReason} />
      </td>
      <td data-label="Análises" className="num">
        {formatNumber(s.analysesCount)}
      </td>
      <td data-label="% Boa" className="num">
        {formatPct(s.qualityRatio)}
      </td>
      <td data-label="Última leitura">{s.lastReadingAt ? formatDateTime(s.lastReadingAt) : '—'}</td>
      <td data-label="Comunicação">{formatRelative(s.lastCommunication)}</td>
      <td data-label="Bateria / sinal">
        <span className="row" style={{ gap: 10 }}>
          <BatteryMeter value={s.battery} />
          <SignalMeter dbm={s.signal} />
        </span>
      </td>
    </tr>
  );
}
