import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { VineyardRows } from '../components/landing/VineyardRows';
import { Brand } from '../components/ui/Logo';
import { errorMessage } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../data/types';
import { ACCESS, homeFor, type Area } from '../services/api';
import { ApiError } from '../services/http';

const AREA_BY_PATH: Record<string, Area> = {
  dashboard: 'dashboard',
  sensores: 'sensores',
  analises: 'analises',
  classificacao: 'classificacao',
  historico: 'historico',
  importacao: 'importacao',
  administracao: 'administracao',
};

/** Volta para a página que pediu login, se o perfil tiver acesso a ela. */
function destination(role: Role, from?: string) {
  if (!from || from.startsWith('/login')) return homeFor(role);
  const area = AREA_BY_PATH[from.split('/')[1]?.split('?')[0] ?? ''];
  if (area && !(ACCESS[area] as readonly string[]).includes(role)) return homeFor(role);
  return from;
}

export default function Login() {
  const { login, status, user, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [mode, setMode] = useState<'login' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated' && user) return <Navigate to={destination(user.role, from)} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Informe um e-mail válido.');
    if (!password) return setError('Informe a senha.');
    setError(null);
    setBusy(true);
    try {
      const u = await login(email, password);
      navigate(destination(u.role, from), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'E-mail ou senha inválidos.' : errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="login">
      <VineyardRows className="hero-rows" />
      <div className="container login-grid">
        <div className="login-aside">
          <span className="eyebrow">Plataforma OASIS</span>
          <h1 className="display">Do campo aos dados.</h1>
          <p>Sensores, imagens analisadas e indicadores de qualidade das uvas em um só lugar.</p>
          <ul className="login-perks">
            <li>
              <ShieldCheck /> Perfis de acesso: Administrador, Gestor e Operador
            </li>
            <li>
              <KeyRound /> Sessão com expiração e bloqueio após tentativas inválidas
            </li>
          </ul>
        </div>

        <div className="login-card">
          <Brand />
          {mode === 'recover' ? (
            <div className="login-form">
              <div>
                <h2>Esqueceu a senha?</h2>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Por segurança, a redefinição é feita por um administrador da OASIS em <strong>Administração → Usuários</strong>, que define uma senha provisória para você trocar em <strong>Minha conta</strong>.
                </p>
                <p className="muted small" style={{ marginTop: 10 }}>
                  Se você é o único administrador, redefina pelo servidor da API: <code>python -m app.cli reset-password --email seu@email</code>
                </p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setMode('login')}>
                <ArrowLeft /> Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="login-form" noValidate>
              <div>
                <h2>Entrar</h2>
                <p className="muted small" style={{ marginTop: 4 }}>
                  Use o e-mail cadastrado pelo administrador.
                </p>
              </div>
              {notice && !error && (
                <div className="form-info" role="status">
                  {notice}
                </div>
              )}
              <div className="field">
                <label htmlFor="email">E-mail</label>
                <div className="input-icon">
                  <Mail />
                  <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label htmlFor="password">Senha</label>
                <div className="input-icon">
                  <Lock />
                  <input
                    id="password"
                    className="input"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
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
              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}
              <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
                {busy ? <span className="spinner" /> : 'Entrar'}
                {!busy && <ArrowRight />}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => (setMode('recover'), setError(null))}>
                Esqueci minha senha
              </button>
            </form>
          )}
          <Link to="/" className="link" style={{ justifyContent: 'center', marginTop: 4 }}>
            <ArrowLeft /> Voltar ao início
          </Link>
        </div>
      </div>
    </section>
  );
}
