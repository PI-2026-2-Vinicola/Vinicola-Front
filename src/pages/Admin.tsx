import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Database, HardDrive, KeyRound, Pencil, Plus, Radio, ScanSearch, ScrollText, Server, Settings2, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { AUDIT_ACTION_LABEL, ROLE_DESCRIPTION, ROLE_LABEL } from '../data/labels';
import type { Role, User } from '../data/types';
import { useAudit, useSystemStatus, useUsers } from '../hooks/queries';
import { formatDateTime, formatNumber, formatRelative } from '../lib/format';
import { createUser, updateUser } from '../services/api';
import { API_BASE } from '../services/http';

const ROLES: Role[] = ['admin', 'gestor', 'operador'];
const PASSWORD_RULE = 'Mínimo de 8 caracteres, com letras e números.';
const validPassword = (p: string) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p);

function UserForm({ user, onDone }: { user?: User; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { user: me } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'operador');
  const [active, setActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const self = user?.id === me?.id;
  const mutation = useMutation({
    mutationFn: () => {
      if (!user) return createUser({ name: name.trim(), email: email.trim(), role, password });
      const patch: Parameters<typeof updateUser>[1] = {};
      if (name.trim() !== user.name) patch.name = name.trim();
      if (role !== user.role) patch.role = role;
      if (active !== user.isActive) patch.isActive = active;
      if (password) patch.password = password;
      return updateUser(user.id, patch);
    },
    onSuccess: (u) => {
      void qc.invalidateQueries({ queryKey: ['users'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success(user ? `Usuário ${u.email} atualizado.` : `Usuário ${u.email} criado.`);
      onDone();
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Informe o nome.');
    if (!user && !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Informe um e-mail válido.');
    if ((!user || password) && !validPassword(password)) return setError(`Senha: ${PASSWORD_RULE}`);
    setError(null);
    mutation.mutate();
  };
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="u-name">Nome</label>
          <input id="u-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div className="field span-2">
          <label htmlFor="u-email">E-mail</label>
          <input id="u-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} maxLength={160} autoComplete="off" />
        </div>
        <div className="field span-2">
          <label htmlFor="u-role">Perfil</label>
          <select id="u-role" className="select" value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={self}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]} — {ROLE_DESCRIPTION[r]}
              </option>
            ))}
          </select>
          {self && <span className="field-hint">Você não pode alterar o próprio perfil.</span>}
        </div>
        <div className="field span-2">
          <label htmlFor="u-pass">{user ? 'Nova senha (opcional)' : 'Senha inicial'}</label>
          <input id="u-pass" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <span className="field-hint">{PASSWORD_RULE} Informe a senha ao usuário por um canal seguro.</span>
        </div>
        {user && !self && (
          <label className="checkbox span-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Usuário ativo (desmarque para bloquear o acesso)
          </label>
        )}
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <span className="spinner" />} {user ? 'Salvar' : 'Criar usuário'}
        </button>
      </div>
    </form>
  );
}

function UsersTab() {
  const users = useUsers();
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  return (
    <section className="card">
      <div className="card-head card-pad" style={{ marginBottom: 0 }}>
        <div>
          <h3 className="card-title">Usuários</h3>
          <p className="card-sub">Perfis: {ROLES.map((r) => ROLE_LABEL[r]).join(', ')}. Usuários desativados perdem o acesso imediatamente.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus /> Novo usuário
        </button>
      </div>
      {users.isPending ? (
        <LoadingBlock height={200} />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : (
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th>Último acesso</th>
                <th>Criado em</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {users.data.map((u) => (
                <tr key={u.id} className={u.isActive ? '' : 'is-muted'}>
                  <td data-label="Nome">
                    <strong>{u.name}</strong>
                  </td>
                  <td data-label="E-mail">{u.email}</td>
                  <td data-label="Perfil">{ROLE_LABEL[u.role]}</td>
                  <td data-label="Situação">
                    <span className={`badge ${u.isActive ? 'badge-boa' : 'badge-neutral'}`}>{u.isActive ? 'Ativo' : 'Desativado'}</span>
                  </td>
                  <td data-label="Último acesso">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'nunca'}</td>
                  <td data-label="Criado em">{formatDateTime(u.createdAt)}</td>
                  <td data-label="">
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(u)}>
                      <Pencil /> Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} label={editing === 'new' ? 'Novo usuário' : 'Editar usuário'} size="sm">
        <div className="modal-body">
          <h2 className="modal-title">{editing === 'new' ? 'Novo usuário' : `Editar ${editing?.name ?? ''}`}</h2>
          {editing && <UserForm key={editing === 'new' ? 'new' : editing.id} user={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />}
        </div>
      </Modal>
    </section>
  );
}

const COUNT_LABEL: Record<string, string> = {
  usuarios: 'Usuários',
  sensores: 'Sensores',
  leituras: 'Leituras',
  leituras_demonstracao: 'Leituras de demonstração',
  medicoes_ambientais: 'Medições ambientais',
  importacoes: 'Importações',
};

function SystemTab() {
  const status = useSystemStatus();
  if (status.isPending) return <LoadingBlock />;
  if (status.isError) return <ErrorState error={status.error} onRetry={() => void status.refetch()} />;
  const s = status.data;
  return (
    <div className="stack">
      <div className="grid-3">
        <section className="card card-pad info-card">
          <Server aria-hidden="true" />
          <h3>API</h3>
          <dl className="kv">
            <dt>Versão</dt>
            <dd>{s.version}</dd>
            <dt>Ambiente</dt>
            <dd>{s.environment === 'production' ? 'Produção' : 'Desenvolvimento'}</dd>
            <dt>Fuso da propriedade</dt>
            <dd>{s.timezone}</dd>
            <dt>Leitura sem login</dt>
            <dd>{s.publicRead ? 'Ativada (não recomendado)' : 'Desativada'}</dd>
          </dl>
        </section>
        <section className="card card-pad info-card">
          <ScanSearch aria-hidden="true" />
          <h3>Análise de imagens</h3>
          <dl className="kv">
            <dt>Detector</dt>
            <dd>{s.detector === 'yolo' ? 'Modelo YOLO treinado' : 'Análise de cor (HSV)'}</dd>
          </dl>
          <p className="muted small">{s.detectorDescription}</p>
          {!s.modelLoaded && <p className="small">Para usar o YOLO, coloque os pesos treinados em <code>models/oasis-grapes.pt</code> e reinicie a API.</p>}
        </section>
        <section className="card card-pad info-card">
          <Database aria-hidden="true" />
          <h3>Dados</h3>
          <dl className="kv">
            <dt>Banco</dt>
            <dd>{s.database}</dd>
            <dt>Imagens armazenadas</dt>
            <dd>
              <HardDrive size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> {s.storageMb.toLocaleString('pt-BR')} MB
            </dd>
            {Object.entries(s.counts).map(([k, v]) => (
              <Fragment2 key={k} label={COUNT_LABEL[k] ?? k} value={formatNumber(v)} />
            ))}
          </dl>
        </section>
      </div>
      {s.counts.leituras_demonstracao > 0 && (
        <div className="notice notice-warn">
          <span>
            Há {formatNumber(s.counts.leituras_demonstracao)} leituras de demonstração (sintéticas) no banco. Remova-as com <code>python -m app.cli clear-demo</code> antes de usar dados reais.
          </span>
        </div>
      )}
    </div>
  );
}

function Fragment2({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

function AuditTab() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const audit = useAudit(page, action || undefined);
  const pages = audit.data ? Math.max(1, Math.ceil(audit.data.total / audit.data.pageSize)) : 1;
  return (
    <section className="card">
      <div className="table-toolbar">
        <select
          className="select"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          aria-label="Filtrar por ação"
        >
          <option value="">Todas as ações</option>
          {Object.entries(AUDIT_ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      {audit.isPending ? (
        <LoadingBlock />
      ) : audit.isError ? (
        <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
      ) : audit.data.items.length === 0 ? (
        <EmptyState compact title="Nenhum registro" />
      ) : (
        <div className="table-wrap">
          <table className="table table-cards">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Alvo</th>
                <th>Detalhes</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {audit.data.items.map((a) => (
                <tr key={a.id}>
                  <td data-label="Data" className="nowrap">{formatDateTime(a.createdAt)}</td>
                  <td data-label="Ação">{AUDIT_ACTION_LABEL[a.action] ?? a.action}</td>
                  <td data-label="Usuário">{a.actor ?? '—'}</td>
                  <td data-label="Alvo" className="mono small">{a.target ?? '—'}</td>
                  <td data-label="Detalhes" className="small audit-details">{a.details ?? '—'}</td>
                  <td data-label="IP" className="mono small">{a.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <span>{audit.data ? `${formatNumber(audit.data.total)} registros` : ''}</span>
        <div className="row">
          <button className="icon-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Página anterior">
            <ChevronLeft />
          </button>
          <span>
            Página {page} de {pages}
          </span>
          <button className="icon-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= pages} aria-label="Próxima página">
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}

const ENDPOINTS: [string, string, string][] = [
  ['POST', '/ingest', 'Imagem do dispositivo (multipart: sensor_id, image, captured_at, battery, signal, firmware, temperature_c, humidity_pct)'],
  ['POST', '/sensors/{id}/heartbeat', 'Sinal de vida: bateria, sinal, firmware, temperatura e umidade (JSON)'],
  ['POST', '/sensors/{id}/environment', 'Medição ambiental avulsa (JSON)'],
];

function DevicesTab() {
  const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`;
  return (
    <div className="stack">
      <section className="card card-pad">
        <h3 className="card-title">Como um dispositivo envia dados</h3>
        <p className="muted small">Cada sensor usa o próprio token (cabeçalho <code>X-Device-Token</code>), gerado no cadastro ou em “Gerar novo token”. O firmware do ESP32-CAM e o gateway de edge estão no repositório Vinicola-back (pastas <code>iot/</code> e <code>edge/</code>).</p>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Método</th>
                <th>Rota</th>
                <th>Uso</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map(([m, p, d]) => (
                <tr key={p}>
                  <td className="mono">{m}</td>
                  <td className="mono small">{base + p}</td>
                  <td className="small">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h4 className="subhead">Teste pelo terminal</h4>
        <pre className="code">{`curl -X POST ${base}/ingest \\
  -H "X-Device-Token: <token do sensor>" \\
  -F sensor_id=<código do sensor> \\
  -F image=@cacho.jpg`}</pre>
      </section>
      <section className="card card-pad">
        <h3 className="card-title">
          <Radio size={16} style={{ display: 'inline', verticalAlign: '-2px' }} /> MQTT (via gateway de edge)
        </h3>
        <p className="muted small">
          Tópicos <code>oasis/sensores/&#123;id&#125;/captura</code> (JPEG) e <code>oasis/sensores/&#123;id&#125;/meta</code> (JSON). O gateway avalia brilho e nitidez, mantém fila offline e encaminha para <code>/ingest</code>.
        </p>
      </section>
    </div>
  );
}

const TABS = [
  { id: 'usuarios', label: 'Usuários', icon: Users, el: <UsersTab /> },
  { id: 'sistema', label: 'Sistema', icon: Settings2, el: <SystemTab /> },
  { id: 'auditoria', label: 'Auditoria', icon: ScrollText, el: <AuditTab /> },
  { id: 'dispositivos', label: 'Integração de dispositivos', icon: KeyRound, el: <DevicesTab /> },
];

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = TABS.find((t) => t.id === params.get('aba')) ?? TABS[0];
  return (
    <div className="page">
      <PageHeader title="Administração" description="Usuários e perfis de acesso, estado do sistema, trilha de auditoria e integração dos dispositivos." />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab.id === t.id} onClick={() => setParams(t.id === 'usuarios' ? {} : { aba: t.id }, { replace: true })}>
            <t.icon /> {t.label}
          </button>
        ))}
      </div>
      {tab.el}
    </div>
  );
}
