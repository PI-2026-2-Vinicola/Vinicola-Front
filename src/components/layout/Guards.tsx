import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABEL } from '../../data/labels';
import { homeFor, type Area } from '../../services/api';
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
          <h2>Acesso negado para o perfil {ROLE_LABEL[user.role]}</h2>
          <p>
            Seu perfil não tem permissão para esta área. A API aplica a mesma regra: mesmo acessando o endereço direto, os dados não são
            entregues. Solicite acesso a um administrador.
          </p>
          <Link to={homeFor(user.role)} className="btn btn-primary">
            Ir para a página inicial do seu perfil
          </Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
