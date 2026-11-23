import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import type { ClientInput, InternationalClient } from '../data/types';
import { useClient, useClients, useOrganizations } from '../hooks/queries';
import { formatDateTime } from '../lib/format';
import { createClient, deleteClient, updateClient } from '../services/api';

const SENSITIVE: { key: keyof InternationalClient & keyof ClientInput; label: string; long?: boolean }[] = [
  { key: 'contactName', label: 'Contato' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'taxId', label: 'Identificação fiscal (VAT/EIN)' },
  { key: 'commercialTerms', label: 'Condições comerciais do contrato', long: true },
];

function Protected({ value }: { value: string | null }) {
  if (!value) return <span className="muted">—</span>;
  return (
    <span className="protected-value" title="Valor mascarado: o original fica cifrado no banco">
      <Lock aria-hidden="true" size={12} /> {value}
    </span>
  );
}

function ClientForm({ client, onDone }: { client?: InternationalClient; onDone: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const orgs = useOrganizations();
  const [data, setData] = useState<ClientInput>({
    companyName: client?.companyName ?? '',
    country: client?.country ?? '',
    contactName: client?.contactName ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    taxId: client?.taxId ?? '',
    commercialTerms: client?.commercialTerms ?? '',
    organizationId: client?.organizationId ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';
  const mutation = useMutation({
    mutationFn: () => {
      const body = { ...data, organizationId: isAdmin ? data.organizationId || null : undefined };
      return client ? updateClient(client.id, body) : createClient(body);
    },
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      void qc.invalidateQueries({ queryKey: ['client', c.id] });
      toast.success(client ? `${c.companyName} atualizado.` : `${c.companyName} cadastrado. Os dados sensíveis foram cifrados no banco.`);
      onDone();
    },
    onError: (e) => setError(errorMessage(e)),
  });
  const set = (k: keyof ClientInput) => (e: { target: { value: string } }) => setData((d) => ({ ...d, [k]: e.target.value }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if ((data.companyName ?? '').trim().length < 2) return setError('Informe o nome da empresa.');
    if ((data.country ?? '').trim().length < 2) return setError('Informe o país.');
    setError(null);
    mutation.mutate();
  };
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field span-2">
          <label htmlFor="c-company">Empresa</label>
          <input id="c-company" className="input" value={data.companyName} onChange={set('companyName')} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="c-country">País</label>
          <input id="c-country" className="input" value={data.country} onChange={set('country')} maxLength={60} />
        </div>
        {isAdmin && !client && (
          <div className="field">
            <label htmlFor="c-org">Exportadora</label>
            <select id="c-org" className="select" value={data.organizationId ?? ''} onChange={(e) => setData((d) => ({ ...d, organizationId: Number(e.target.value) || null }))}>
              <option value="">Organização padrão</option>
              {orgs.data?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {SENSITIVE.map((f) => (
          <div key={f.key} className={`field ${f.long ? 'span-2' : ''}`}>
            <label htmlFor={`c-${f.key}`}>
              {f.label} <Lock size={12} aria-label="cifrado no banco" />
            </label>
            {f.long ? (
              <textarea id={`c-${f.key}`} className="input" rows={3} value={(data[f.key] as string) ?? ''} onChange={set(f.key)} maxLength={2000} />
            ) : (
              <input id={`c-${f.key}`} className="input" value={(data[f.key] as string) ?? ''} onChange={set(f.key)} maxLength={f.key === 'email' ? 160 : 120} />
            )}
          </div>
        ))}
      </div>
      <p className="field-hint">
        <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> Os campos com cadeado são cifrados pela API (AES-256-GCM) antes de chegar ao
        banco.
      </p>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <span className="spinner" />} {client ? 'Salvar' : 'Cadastrar cliente'}
        </button>
      </div>
    </form>
  );
}

/** Detalhe: a API decifra os campos sensíveis só para quem tem permissão e registra a consulta. */
function ClientDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const { can } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const client = useClient(id);
  const [editing, setEditing] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteClient(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente excluído.');
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (client.isPending) return <LoadingBlock height={240} label="Decifrando os dados…" />;
  if (client.isError) return <ErrorState error={client.error} />;
  const c = client.data;
  if (editing) return <ClientForm client={c} onDone={() => setEditing(false)} />;
  return (
    <div className="stack">
      <div className="notice notice-info">
        <ShieldCheck aria-hidden="true" />
        <span>
          Dados decifrados pela API para o seu perfil. No banco, estes campos ficam gravados apenas na forma cifrada (<code>enc:v1:…</code>). Esta consulta foi
          registrada na auditoria.
        </span>
      </div>
      <dl className="kv">
        <dt>Empresa</dt>
        <dd>{c.companyName}</dd>
        <dt>País</dt>
        <dd>{c.country}</dd>
        <dt>Exportadora</dt>
        <dd>{c.organizationName}</dd>
        {SENSITIVE.map((f) => (
          <FragmentKV key={f.key} label={f.label} value={(c[f.key] as string | null) ?? '—'} />
        ))}
        <dt>Atualizado em</dt>
        <dd>{formatDateTime(c.updatedAt)}</dd>
      </dl>
      {can('gerenciarClientes') && (
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => window.confirm(`Excluir ${c.companyName}?`) && remove.mutate()} disabled={remove.isPending}>
            <Trash2 /> Excluir
          </button>
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil /> Editar
          </button>
        </div>
      )}
    </div>
  );
}

function FragmentKV({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd style={{ whiteSpace: 'pre-wrap' }}>{value}</dd>
    </>
  );
}

export default function Clients() {
  const { user, can } = useAuth();
  const clients = useClients();
  const [open, setOpen] = useState<number | 'new' | null>(null);
  const own = user?.role === 'cliente';
  return (
    <div className="page">
      <PageHeader
        eyebrow={user?.organizationName ?? 'Todas as exportadoras'}
        title={own ? 'Meu cadastro' : 'Clientes internacionais'}
        description="Contato, e-mail, telefone, identificação fiscal e condições comerciais são dados sensíveis: ficam cifrados no banco (AES-256-GCM) e só a API os decifra, para os perfis autorizados."
        actions={
          can('gerenciarClientes') && (
            <button className="btn btn-primary" onClick={() => setOpen('new')}>
              <Plus /> Novo cliente
            </button>
          )
        }
      />
      <section className="card">
        {clients.isPending ? (
          <LoadingBlock height={220} />
        ) : clients.isError ? (
          <ErrorState error={clients.error} onRetry={() => void clients.refetch()} />
        ) : clients.data.length === 0 ? (
          <EmptyState title="Nenhum cliente internacional">{own ? 'Seu usuário ainda não está ligado a um cadastro de cliente.' : 'Cadastre os importadores atendidos pela exportadora.'}</EmptyState>
        ) : (
          <div className="table-wrap">
            <table className="table table-cards">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>País</th>
                  {user?.role === 'admin' && <th>Exportadora</th>}
                  <th>Contato</th>
                  <th>E-mail</th>
                  <th>Telefone</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {clients.data.map((c) => (
                  <tr key={c.id} className={c.active ? '' : 'is-muted'}>
                    <td data-label="Empresa">
                      <strong>{c.companyName}</strong>
                    </td>
                    <td data-label="País">{c.country}</td>
                    {user?.role === 'admin' && <td data-label="Exportadora">{c.organizationName}</td>}
                    <td data-label="Contato">
                      <Protected value={c.contactName} />
                    </td>
                    <td data-label="E-mail">
                      <Protected value={c.email} />
                    </td>
                    <td data-label="Telefone">
                      <Protected value={c.phone} />
                    </td>
                    <td data-label="">
                      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(c.id)}>
                        <Eye /> Ver dados
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Modal open={open !== null} onClose={() => setOpen(null)} label={open === 'new' ? 'Novo cliente internacional' : 'Cliente internacional'}>
        <div className="modal-body">
          <h2 className="modal-title">{open === 'new' ? 'Novo cliente internacional' : 'Cliente internacional'}</h2>
          {open === 'new' && <ClientForm onDone={() => setOpen(null)} />}
          {typeof open === 'number' && <ClientDetail key={open} id={open} onClose={() => setOpen(null)} />}
        </div>
      </Modal>
    </div>
  );
}
