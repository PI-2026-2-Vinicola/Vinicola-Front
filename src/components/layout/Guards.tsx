import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL } from '../../data/labels';
import { ACCESS, homeFor, type Area } from '../../services/api';
import { LoadingBlock } from '../ui/States';
import { PageHeader, PageShell } from './PageHeader';

/** Exige sessão válida (o token é conferido na API ao abrir a aplicação). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'checking')
    return (
      <PageShell>
        <LoadingBlock height={360} label="Verificando sessão…" />
      </PageShell>
    );
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

/** Protege uma área pelo perfil do usuário (as mesmas regras são aplicadas na API). */
export function RequireAccess({ area, children }: { area: Area; children: ReactNode }) {
  const { user, can } = useAuth();
  if (!user) return null;
  if (!can(area))
    return (
      <div className="page">
        <PageHeader eyebrow="Acesso restrito" title="Área não disponível" />
        <div className="card restricted">
          <div className="kpi-icon">
            <Lock />
          </div>
          <h2>Área não disponível para o perfil {ROLE_LABEL[user.role]}</h2>
          <p>Disponível para: {(ACCESS[area] as readonly string[]).map((r) => ROLE_LABEL[r as keyof typeof ROLE_LABEL]).join(', ')}. Solicite acesso a um administrador.</p>
          <Link to={homeFor(user.role)} className="btn btn-primary">
            Ir para a página inicial do seu perfil
          </Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
