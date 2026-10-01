import { CloudOff, Inbox, RotateCw, ShieldAlert, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { ApiError } from '../../services/http';

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Erro inesperado.';
}

export function Skeleton({ height = 16, width, radius }: { height?: number | string; width?: number | string; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

/** Bloco de carregamento com altura fixa (evita saltos de layout). */
export function LoadingBlock({ height = 240, label = 'Carregando…' }: { height?: number; label?: string }) {
  return (
    <div className="state state-loading" style={{ minHeight: height }} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, compact = false }: { error: unknown; onRetry?: () => void; compact?: boolean }) {
  const network = error instanceof ApiError && error.isNetwork;
  const forbidden = error instanceof ApiError && error.status === 403;
  const Icon = network ? CloudOff : forbidden ? ShieldAlert : TriangleAlert;
  return (
    <div className={`state state-error ${compact ? 'compact' : ''}`} role="alert">
      <Icon aria-hidden="true" />
      <strong>{network ? 'Sem conexão com a API' : forbidden ? 'Acesso negado' : 'Não foi possível carregar'}</strong>
      <span>{errorMessage(error)}</span>
      {onRetry && !forbidden && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RotateCw /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, children, action, compact = false }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`state state-empty ${compact ? 'compact' : ''}`}>
      {icon ?? <Inbox aria-hidden="true" />}
      <strong>{title}</strong>
      {children && <span>{children}</span>}
      {action}
    </div>
  );
}

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** Renderiza carregamento/erro de uma consulta e, com dados, o conteúdo. */
export function QueryState<T>({ query, height = 240, children }: { query: QueryLike<T>; height?: number; children: (data: T) => ReactNode }) {
  if (query.isPending) return <LoadingBlock height={height} />;
  if (query.isError || query.data === undefined) return <ErrorState error={query.error} onRetry={() => void query.refetch()} compact={height < 200} />;
  return <>{children(query.data)}</>;
}
