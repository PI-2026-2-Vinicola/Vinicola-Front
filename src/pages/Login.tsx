import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, MailCheck, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { VineyardRows } from '../components/landing/VineyardRows';
import { Brand } from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABEL } from '../data/labels';
import type { Role } from '../data/types';
import { ACCESS, DEMO_PASSWORD, DEMO_USERS, isApiMode, requestPasswordReset } from '../services/api';

const ROLE_ICON: Record<Role, typeof Users> = { admin: ShieldCheck, gestor: UserCog, operador: Users };

function landingFor(role: Role, from?: string) {
  const area = from?.split('/')[1];
  const map: Record<string, keyof typeof ACCESS> = { dashboard: 'dashboard', sensores: 'sensores', analises: 'analises', historico: 'historico', integracoes: 'integracoes' };
  if (from && (!map[area ?? ''] || ACCESS[map[area!]].includes(role)) && from !== '/login') return from;
  return ACCESS.dashboard.includes(role) ? '/dashboard' : '/analises';
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [mode, setMode] = useState<'login' | 'recover' | 'sent'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const u = await login(email, password);
        navigate(landingFor(u.role, from), { replace: true });
      } else {
        await requestPasswordReset(email);
        setMode('sent');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const quick = (em: string) => {
    setEmail(em);
    setPassword(DEMO_PASSWORD);
    setMode('login');
    setError(null);
  };

  return (
    <section className="login">
      <VineyardRows className="hero-rows" />
      <div className="container login-grid">
        <div className="login-aside">
          <span className="eyebrow">Plataforma OSAIS</span>
          <h1 className="display">Bem-vindo de volta ao vinhedo.</h1>
          <p>Acompanhe sensores, imagens analisadas pela IA e a evolução da qualidade das uvas em tempo real.</p>
          <ul className="login-perks">
            <li>
              <ShieldCheck /> Perfis de acesso: Administrador, Gestor e Operador
            </li>
            <li>
              <KeyRound /> Sessão protegida por token (JWT na API)
            </li>
          </ul>
        </div>

        <div className="login-card">
          <Brand light={false} />
          {mode === 'sent' ? (
            <div className="login-sent">
              <div className="kpi-icon" style={{ background: 'var(--good-bg)', color: 'var(--good-ink)' }}>
                <MailCheck />
              </div>
              <h2>Verifique seu e-mail</h2>
              <p className="muted">
                Se <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir a senha{isApiMode ? '' : ' (simulado no modo demonstração)'}.
              </p>
              <button className="btn btn-secondary" onClick={() => setMode('login')}>
                <ArrowLeft /> Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="login-form" noValidate>
              <div>
                <h2>{mode === 'login' ? 'Entrar' : 'Recuperar senha'}</h2>
                <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>
                  {mode === 'login' ? 'Use seu e-mail corporativo para acessar a plataforma.' : 'Informe seu e-mail e enviaremos as instruções.'}
                </p>
              </div>
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <div className="input-icon">
                  <Mail />
                  <input id="email" className="input" type="email" autoComplete="email" placeholder="voce@osais.agr.br" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              {mode === 'login' && (
                <div className="field">
                  <label htmlFor="password">Senha</label>
                  <div className="input-icon">
                    <Lock />
                    <input
                      id="password"
                      className="input"
                      type={show ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" className="icon-btn pwd-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                      {show ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : mode === 'login' ? 'Entrar' : 'Enviar instruções'}
                {!busy && <ArrowRight className="arrow" />}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => (setMode(mode === 'login' ? 'recover' : 'login'), setError(null))}>
                {mode === 'login' ? 'Recuperar senha' : 'Voltar ao login'}
              </button>
            </form>
          )}

          {!isApiMode && (
            <div className="demo-access">
              <div className="field-label">Acesso de demonstração</div>
              <div className="demo-users">
                {DEMO_USERS.map((u) => {
                  const Icon = ROLE_ICON[u.role];
                  return (
                    <button key={u.email} type="button" className={`demo-user ${email === u.email ? 'is-active' : ''}`} onClick={() => quick(u.email)}>
                      <Icon />
                      <span>
                        <strong>{ROLE_LABEL[u.role]}</strong>
                        <small>{u.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="muted" style={{ fontSize: 12.5 }}>
                Senha para todos os perfis: <code>{DEMO_PASSWORD}</code>
              </p>
            </div>
          )}
          <Link to="/" className="link" style={{ justifyContent: 'center', marginTop: 4 }}>
            <ArrowLeft /> Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  );
}
