import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  crumbs?: { to: string; label: string }[];
}

export function PageHero({ eyebrow, title, description, actions, crumbs }: PageHeroProps) {
  const { source } = useData();
  return (
    <section className="page-hero">
      <div className="container">
        <div style={{ animation: 'fadeUp .7s var(--ease) both' }}>
          {crumbs && (
            <nav className="breadcrumb" aria-label="Trilha">
              {crumbs.map((c) => (
                <span key={c.to} className="row" style={{ gap: 6 }}>
                  <Link to={c.to}>{c.label}</Link>
                  <ChevronRight />
                </span>
              ))}
            </nav>
          )}
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display">{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="page-hero-actions" style={{ animation: 'fadeUp .7s .1s var(--ease) both' }}>
          {actions}
          <span className="demo-ribbon" title={source === 'demo' ? 'Dados simulados gerados no navegador' : 'Dados da API OSAIS'}>
            <span className="badge-dot live" />
            {source === 'demo' ? 'Modo demonstração' : 'Conectado à API'}
          </span>
        </div>
      </div>
    </section>
  );
}
