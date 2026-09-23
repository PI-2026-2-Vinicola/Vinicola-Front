import { BrainCircuit, Database, KeyRound, Radio, Server, ShieldCheck } from 'lucide-react';
import { PageHero } from '../components/layout/PageHero';
import { SensorStatusBadge } from '../components/ui/Badges';
import { useData } from '../context/DataContext';
import { MODEL_VERSION } from '../data/generate';
import { ROLE_LABEL } from '../data/labels';
import { formatRelative } from '../lib/format';
import { ACCESS, API_URL, DEMO_USERS, isApiMode } from '../services/api';

const ENDPOINTS = [
  ['POST', '/api/v1/auth/login', 'Autenticação (JWT)'],
  ['POST', '/api/v1/ingest', 'Recebe imagem do sensor/edge e executa o YOLO'],
  ['GET', '/api/v1/sensors', 'Lista de sensores e status'],
  ['POST', '/api/v1/sensors/{id}/heartbeat', 'Sinal de vida do dispositivo'],
  ['GET', '/api/v1/readings', 'Histórico de leituras com filtros'],
  ['GET', '/api/v1/readings/{id}', 'Detalhe de uma análise'],
  ['GET', '/api/v1/readings/{id}/image', 'Imagem capturada'],
  ['GET', '/api/v1/stats/summary', 'Indicadores do dashboard'],
];

const AREAS = ['dashboard', 'sensores', 'analises', 'historico', 'integracoes'] as const;

export default function Integrations() {
  const { sensors, source } = useData();
  return (
    <>
      <PageHero eyebrow="Administração" title="Integrações" description="Fonte de dados, modelo de IA, dispositivos e perfis de acesso da plataforma." />
      <div className="container page-body">
        <div className="grid-3">
          <section className="card card-pad">
            <div className="kpi-icon">
              <Server />
            </div>
            <h3 className="card-title">Fonte de dados</h3>
            <p className="card-sub">{source === 'demo' ? 'Modo demonstração — dados simulados no navegador' : 'API OSAIS conectada'}</p>
            <p className="mono" style={{ marginTop: 12 }}>
              {isApiMode ? API_URL : 'VITE_API_URL não definido'}
            </p>
          </section>
          <section className="card card-pad">
            <div className="kpi-icon">
              <BrainCircuit />
            </div>
            <h3 className="card-title">Modelo de visão computacional</h3>
            <p className="card-sub">{source === 'demo' ? 'Detector simulado (mesmo contrato do YOLO)' : 'Definido por OSAIS_DETECTOR na API'}</p>
            <p className="mono" style={{ marginTop: 12 }}>
              {MODEL_VERSION}
            </p>
          </section>
          <section className="card card-pad">
            <div className="kpi-icon">
              <Radio />
            </div>
            <h3 className="card-title">Comunicação dos dispositivos</h3>
            <p className="card-sub">HTTP multipart ou MQTT</p>
            <p className="mono" style={{ marginTop: 12 }}>
              osais/sensores/&#123;id&#125;/captura
            </p>
          </section>
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <section className="card card-pad">
            <h3 className="card-title">Endpoints da API</h3>
            <p className="card-sub" style={{ marginBottom: 12 }}>
              Contrato implementado no repositório Vinicola-back (FastAPI)
            </p>
            <div className="status-list">
              {ENDPOINTS.map(([m, path, desc]) => (
                <div key={path + m}>
                  <span>
                    <strong className="mono">
                      <span className={`badge ${m === 'GET' ? 'badge-online' : 'badge-neutral'}`} style={{ marginRight: 8 }}>
                        {m}
                      </span>
                      {path}
                    </strong>
                    <span className="muted">{desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="card card-pad">
            <h3 className="card-title">Envio a partir do ESP32 / edge</h3>
            <p className="card-sub" style={{ marginBottom: 12 }}>
              Exemplo de requisição de ingestão
            </p>
            <pre className="code-block">
              <span className="c"># Enviar uma captura para análise{'\n'}</span>
              <span className="k">curl</span> -X POST {isApiMode ? API_URL : 'http://localhost:8000'}/api/v1/ingest \{'\n'}
              {'  '}-H <span className="s">"X-Device-Token: $TOKEN_S001"</span> \{'\n'}
              {'  '}-F <span className="s">"sensor_id=S-001"</span> \{'\n'}
              {'  '}-F <span className="s">"image=@captura.jpg"</span>
              {'\n\n'}
              <span className="c"># Resposta (resumida){'\n'}</span>
              {'{'}{'\n'}
              {'  '}<span className="k">"varietyId"</span>: <span className="s">"cabernet-sauvignon"</span>,{'\n'}
              {'  '}<span className="k">"confidence"</span>: 0.94,{'\n'}
              {'  '}<span className="k">"quality"</span>: <span className="s">"boa"</span>,{'\n'}
              {'  '}<span className="k">"maturation"</span>: <span className="s">"adequada"</span>,{'\n'}
              {'  '}<span className="k">"classification"</span>: <span className="s">"APROVADA"</span>,{'\n'}
              {'  '}<span className="k">"detections"</span>: [ … ]{'\n'}
              {'}'}
            </pre>
          </section>
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <section className="card card-pad">
            <div className="row" style={{ marginBottom: 12 }}>
              <Database size={18} color="var(--wine-500)" />
              <h3 className="card-title">Dispositivos cadastrados</h3>
            </div>
            <div className="status-list">
              {sensors.map((s) => (
                <div key={s.id}>
                  <span>
                    <strong>
                      {s.id} · {s.name}
                    </strong>
                    <span className="muted">
                      {s.device} · {s.firmware} · comunicação {formatRelative(s.lastCommunication)}
                    </span>
                  </span>
                  <SensorStatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </section>
          <section className="card card-pad">
            <div className="row" style={{ marginBottom: 12 }}>
              <ShieldCheck size={18} color="var(--wine-500)" />
              <h3 className="card-title">Perfis e permissões</h3>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Área</th>
                    {DEMO_USERS.map((u) => (
                      <th key={u.role}>{ROLE_LABEL[u.role]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AREAS.map((a) => (
                    <tr key={a}>
                      <td style={{ textTransform: 'capitalize' }}>{a === 'analises' ? 'Análises' : a === 'historico' ? 'Histórico' : a === 'integracoes' ? 'Integrações' : a}</td>
                      {DEMO_USERS.map((u) => (
                        <td key={u.role}>{ACCESS[a].includes(u.role) ? '✓' : '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="notice" style={{ marginTop: 16 }}>
              <KeyRound />
              <span>Na API, cada dispositivo usa um token próprio (X-Device-Token) e os usuários recebem um JWT com o perfil embutido.</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
