import { ArrowDown, BrainCircuit, Cloud, Cpu, Database, ExternalLink, HardDrive, Monitor, Radio, Router, Server, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IntegrationsStatus } from '../../data/types';

/* ------------------------------------------------------------------ situação das funcionalidades */
type Level = 'ok' | 'partial' | 'pending' | 'planned' | 'code';

const LEVEL: Record<Level, { label: string; cls: string }> = {
  ok: { label: 'Implementado', cls: 'badge-boa' },
  partial: { label: 'Parcial', cls: 'badge-atencao' },
  pending: { label: 'Aguardando configuração', cls: 'badge-atencao' },
  planned: { label: 'Planejado', cls: 'badge-neutral' },
  code: { label: 'Código disponível', cls: 'badge-neutral' },
};

export function StatusBadge({ level, label }: { level: Level; label?: string }) {
  return <span className={`badge ${LEVEL[level].cls}`}>{label ?? LEVEL[level].label}</span>;
}

export function FeatureStatus({ status }: { status: IntegrationsStatus | undefined }) {
  const live = (configured: boolean | undefined, ok: string, pending: string): [Level, string] =>
    configured === undefined ? ['pending', 'Consultando…'] : configured ? ['ok', ok] : ['pending', pending];
  const rows: { name: string; level: Level; label?: string; note: string }[] = [
    { name: 'Plataforma: autenticação, perfis, sensores, leituras, histórico, importação e auditoria', level: 'ok', note: 'Coberta por testes automatizados (pytest e Vitest).' },
    { name: 'Análise de imagem por cor (HSV)', level: 'ok', note: 'Detector ativo enquanto não houver modelo YOLO treinado.' },
    {
      name: 'Detecção com YOLO',
      level: status?.yoloLoaded ? 'ok' : 'partial',
      label: status?.yoloLoaded ? 'Ativo' : 'Aguardando pesos treinados',
      note: 'Integração pronta e validada com a biblioteca Ultralytics; falta o modelo treinado com imagens anotadas do vinhedo.',
    },
    (() => {
      const [level, label] = live(status?.thingspeak.configured, 'Configurado', 'Aguardando canal');
      return { name: 'Monitoramento via ThingSpeak', level, label, note: status?.thingspeak.detail ?? 'Leitura do canal pela API REST.' };
    })(),
    (() => {
      const [level, label] = live(status?.embrapa.configured, 'Configurado', 'Aguardando credenciais');
      return { name: 'Conteúdo da Embrapa (RespondeAgro e Agritec v2)', level, label, note: status?.embrapa.detail ?? 'Consulta pela plataforma AgroAPI.' };
    })(),
    { name: 'Firmware ESP32-CAM e gateway de edge', level: 'code', note: 'No repositório Vinicola-back; não validados em hardware neste trabalho.' },
    { name: 'Firebase (Firestore e Storage)', level: 'planned', note: 'Proposta de estrutura no Vinicola-bd; a API não usa Firebase.' },
  ];
  return (
    <div className="table-wrap">
      <table className="table status-table">
        <thead>
          <tr>
            <th>Funcionalidade</th>
            <th>Situação</th>
            <th>Observação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td className="nowrap">
                <StatusBadge level={r.level} label={r.label} />
              </td>
              <td className="muted">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ diagrama de arquitetura */
function Node({ icon, title, children, status }: { icon: ReactNode; title: string; children: ReactNode; status?: ReactNode }) {
  return (
    <div className="arch-box">
      <div className="arch-box-head">
        {icon}
        <strong>{title}</strong>
      </div>
      <p>{children}</p>
      {status}
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="arch-connector" aria-hidden="true">
      <ArrowDown />
      <span>{label}</span>
    </div>
  );
}

export function ArchitectureMap({ status }: { status: IntegrationsStatus | undefined }) {
  const chip = (ok: boolean | undefined, yes: string, no: string) =>
    ok === undefined ? null : <span className={`arch-chip ${ok ? 'is-on' : 'is-off'}`}>{ok ? yes : no}</span>;
  return (
    <figure className="arch-map" aria-label="Diagrama da arquitetura da OASIS">
      <div className="arch-row">
        <Node icon={<Monitor aria-hidden="true" />} title="Navegador — aplicação web">
          React + TypeScript (Vite). Páginas públicas e área logada; cache das consultas com TanStack Query.
        </Node>
      </div>
      <Connector label="HTTPS · JSON · token JWT · /api/v1" />
      <div className="arch-row">
        <Node icon={<Server aria-hidden="true" />} title="API OASIS — FastAPI">
          Autenticação e perfis · sensores e leituras · ingestão e análise de imagens · indicadores · importação · integrações externas
        </Node>
      </div>
      <Connector label="SQLAlchemy · arquivos · inferência · HTTP com cache" />
      <div className="arch-row arch-row--4">
        <Node icon={<Database aria-hidden="true" />} title="Banco relacional">
          SQLite (padrão), PostgreSQL ou MySQL/MariaDB — esquema no Vinicola-bd.
        </Node>
        <Node icon={<HardDrive aria-hidden="true" />} title="Imagens">
          Disco local: imagem processada (até 1600 px) e miniatura, sem metadados.
        </Node>
        <Node icon={<BrainCircuit aria-hidden="true" />} title="Detector" status={chip(status?.yoloLoaded, 'YOLO ativo', 'Análise de cor ativa')}>
          Análise de cor (HSV) ou modelo YOLO, quando houver pesos treinados.
        </Node>
        <Node
          icon={<Cloud aria-hidden="true" />}
          title="Serviços externos"
          status={
            <span className="arch-chips">
              {chip(status?.thingspeak.configured, 'ThingSpeak configurado', 'ThingSpeak pendente')}
              {chip(status?.embrapa.configured, 'Embrapa configurada', 'Embrapa pendente')}
            </span>
          }
        >
          ThingSpeak (API REST) e Embrapa AgroAPI (OAuth2: RespondeAgro e Agritec).
        </Node>
      </div>
      <div className="arch-devices">
        <span className="arch-devices-label">Captura no campo (opcional)</span>
        <div className="arch-flow">
          <span>
            <Cpu aria-hidden="true" /> ESP32-CAM
          </span>
          <i aria-hidden="true">→</i>
          <span>
            <Router aria-hidden="true" /> Gateway de edge
          </span>
          <i aria-hidden="true">→</i>
          <span>
            <Server aria-hidden="true" /> POST /api/v1/ingest
          </span>
          <span className="arch-flow-note">token individual por dispositivo · HTTP multipart ou MQTT</span>
        </div>
        <div className="arch-flow">
          <span>
            <Radio aria-hidden="true" /> Sensores do canal
          </span>
          <i aria-hidden="true">→</i>
          <span>
            <Cloud aria-hidden="true" /> ThingSpeak
          </span>
          <i aria-hidden="true">→</i>
          <span>
            <Server aria-hidden="true" /> GET /api/v1/iot/thingspeak
          </span>
          <span className="arch-flow-note">a API consulta o canal; os valores não são gravados no banco</span>
        </div>
      </div>
      <figcaption>
        <ShieldCheck aria-hidden="true" /> O navegador conversa apenas com a API OASIS. A Read API Key do ThingSpeak e as credenciais da AgroAPI ficam nas variáveis de ambiente
        do servidor e nunca chegam ao navegador.
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ blocos de documentação */
export function DocSection({ id, letter, title, status, children }: { id: string; letter: string; title: string; status?: ReactNode; children: ReactNode }) {
  return (
    <section className="doc-section" id={id} aria-labelledby={`${id}-titulo`}>
      <header>
        <span className="doc-letter" aria-hidden="true">
          {letter}
        </span>
        <h2 id={`${id}-titulo`}>{title}</h2>
        {status}
      </header>
      <div className="doc-body">{children}</div>
    </section>
  );
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} <ExternalLink className="ext-icon" aria-hidden="true" />
    </a>
  );
}
