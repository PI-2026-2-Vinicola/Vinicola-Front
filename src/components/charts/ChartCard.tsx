import { BarChart3, Table2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  table?: { columns: string[]; rows: (string | number)[][] };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Card de gráfico com alternância para visualização em tabela (acessibilidade). */
export function ChartCard({ title, subtitle, legend, actions, children, table, size = 'md', className = '' }: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <section className={`card card-pad chart-card ${className}`}>
      <div className="card-head">
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {actions}
          {table && (
            <div className="segmented" role="group" aria-label="Modo de visualização">
              <button aria-pressed={view === 'chart'} onClick={() => setView('chart')} aria-label="Ver gráfico" title="Gráfico">
                <BarChart3 size={15} />
              </button>
              <button aria-pressed={view === 'table'} onClick={() => setView('table')} aria-label="Ver tabela" title="Tabela">
                <Table2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
      {legend && view === 'chart' && <div className="legend" style={{ marginBottom: 14 }}>{legend}</div>}
      {view === 'chart' || !table ? (
        <div className={`chart-box ${size === 'md' ? '' : size}`}>{children}</div>
      ) : (
        <div className={`chart-box ${size === 'md' ? '' : size}`} style={{ overflow: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={typeof c === 'number' ? 'num' : ''}>
                      {typeof c === 'number' ? c.toLocaleString('pt-BR') : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
