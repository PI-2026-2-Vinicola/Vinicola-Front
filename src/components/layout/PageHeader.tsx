import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: { to: string; label: string }[];
}

/** Cabeçalho das páginas internas (sem efeitos decorativos). */
export function PageHeader({ title, description, actions, crumbs }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {crumbs && (
          <nav className="breadcrumb" aria-label="Trilha">
            {crumbs.map((c) => (
              <span key={c.to}>
                <Link to={c.to}>{c.label}</Link>
                <ChevronRight aria-hidden="true" />
              </span>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
