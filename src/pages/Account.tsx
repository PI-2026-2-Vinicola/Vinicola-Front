import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { errorMessage } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { ROLE_DESCRIPTION, ROLE_LABEL } from '../data/labels';
import { formatDateTime } from '../lib/format';
import { changePassword } from '../services/api';

export default function Account() {
  const { user } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => changePassword(current, next),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Senha alterada.');
    },
    onError: (e) => setError(errorMessage(e)),
  });
  if (!user) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return setError('A nova senha deve ter pelo menos 8 caracteres, com letras e números.');
    if (next !== confirm) return setError('A confirmação não confere com a nova senha.');
    if (next === current) return setError('A nova senha deve ser diferente da atual.');
    setError(null);
    mutation.mutate();
  };
  return (
    <div className="page">
      <PageHeader title="Minha conta" />
      <div className="grid-2">
        <section className="card card-pad">
          <h3 className="card-title">Perfil</h3>
          <dl className="kv">
            <dt>Nome</dt>
            <dd>{user.name}</dd>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
            <dt>Perfil</dt>
            <dd>
              {ROLE_LABEL[user.role]} — {ROLE_DESCRIPTION[user.role]}
            </dd>
            <dt>Último acesso</dt>
            <dd>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}</dd>
          </dl>
          <p className="muted small">Nome e perfil são alterados por um administrador.</p>
        </section>
        <section className="card card-pad">
          <h3 className="card-title">Alterar senha</h3>
          <form className="form" onSubmit={submit}>
            <div className="field">
              <label htmlFor="pw-current">Senha atual</label>
              <input id="pw-current" className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
            </div>
            <div className="field">
              <label htmlFor="pw-new">Nova senha</label>
              <input id="pw-new" className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
              <span className="field-hint">Mínimo de 8 caracteres, com letras e números.</span>
            </div>
            <div className="field">
              <label htmlFor="pw-confirm">Confirmar nova senha</label>
              <input id="pw-confirm" className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending && <span className="spinner" />} Alterar senha
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
