import { Database, PlugZap } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatDateTime } from '../../lib/format';

/** Integração que depende de configuração no servidor: explica o que falta, sem simular dados. */
export function IntegrationPending({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="card integration-pending" role="status">
      <span className="kpi-icon">
        <PlugZap aria-hidden="true" />
      </span>
      <div>
        <h3>{title}</h3>
        <div className="integration-pending-body">{children}</div>
        {action && <div className="integration-pending-actions">{action}</div>}
      </div>
    </section>
  );
}

/** Origem dos dados exibidos e quando foram obtidos do serviço externo. */
export function SourceNote({ source, fetchedAt, extra }: { source: ReactNode; fetchedAt?: string | null; extra?: ReactNode }) {
  return (
    <p className="source-note">
      <Database aria-hidden="true" />
      <span>
        Fonte: {source}
        {fetchedAt && <> · consulta de {formatDateTime(fetchedAt)}</>}
        {extra && <> · {extra}</>}
      </span>
    </p>
  );
}
