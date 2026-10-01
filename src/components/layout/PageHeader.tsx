import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageHeaderProps {
  title: ReactNode;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: { to: string; label: string }[];
}

/** Cabeçalho das páginas da plataforma no estilo da página inicial (faixa vinho sob o menu transparente). */
export function PageHeader({ title, eyebrow, description, actions, crumbs }: PageHeaderProps) {
  return (
    <section className="page-hero page-hero--app">
      <div className="container">
        <div className="page-hero-text">
          {crumbs && (
            <nav className="breadcrumb" aria-label="Trilha">
              {crumbs.map((c) => (
                <span key={c.to} className="row" style={{ gap: 6 }}>
                  <Link to={c.to}>{c.label}</Link>
                  <ChevronRight aria-hidden="true" />
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="display">{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="page-hero-actions">{actions}</div>}
      </div>
    </section>
  );
}

/** Página em carregamento ou com erro, mantendo a faixa do cabeçalho sob o menu. */
export function PageShell({ title = '', crumbs, children }: { title?: ReactNode; crumbs?: PageHeaderProps['crumbs']; children: ReactNode }) {
  return (
    <div className="page">
      <PageHeader title={title || ' '} crumbs={crumbs} />
      {children}
    </div>
  );
}
