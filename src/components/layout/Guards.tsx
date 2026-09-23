import { Lock, LogIn } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ROLE_LABEL } from '../../data/labels';
import { ACCESS, type Area } from '../../services/api';
import { PageHero } from './PageHero';

/** Protege rotas por autenticação e perfil. */
export function RequireAccess({ area, children }: { area: Area; children: ReactNode }) {
  const { user, can } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!can(area))
    return (
      <>
        <PageHero eyebrow="Acesso restrito" title="Área não disponível para o seu perfil" />
        <div className="container page-body">
          <div className="card restricted">
            <div className="kpi-icon">
              <Lock />
            </div>
            <h2>Seu perfil é {ROLE_LABEL[user.role]}</h2>
            <p>Esta área está disponível para: {ACCESS[area].map((r) => ROLE_LABEL[r]).join(', ')}. Solicite acesso a um administrador.</p>
            <Link to="/historico" className="btn btn-primary">
              Ir para o histórico
            </Link>
          </div>
        </div>
      </>
    );
  return <>{children}</>;
}

export function DataGate({ children }: { children: ReactNode }) {
  const { loading, error } = useData();
  if (loading)
    return (
      <div className="container page-body" style={{ marginTop: 24 }}>
        <div className="kpi-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 150 }} />
          ))}
        </div>
      </div>
    );
  if (error)
    return (
      <div className="container page-body" style={{ marginTop: 24 }}>
        <div className="card restricted">
          <h2>Não foi possível carregar os dados</h2>
          <p>{error}</p>
          <Link to="/login" className="btn btn-primary">
            <LogIn /> Voltar
          </Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
