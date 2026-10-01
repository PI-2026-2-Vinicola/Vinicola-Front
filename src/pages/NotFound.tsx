import { ArrowLeft, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound({ inline = false, title = 'Página não encontrada', back = '/historico' }: { inline?: boolean; title?: string; back?: string }) {
  if (inline)
    return (
      <div className="page">
        <div className="card restricted">
          <div className="kpi-icon">
            <SearchX />
          </div>
          <h2>{title}</h2>
          <p>O registro pode ter sido excluído ou o endereço está incorreto.</p>
          <Link to={back} className="btn btn-secondary">
            <ArrowLeft /> Voltar
          </Link>
        </div>
      </div>
    );
  return (
    <section className="notfound">
      <div>
        <span className="eyebrow" style={{ color: 'var(--rose-300)' }}>
          Erro 404
        </span>
        <h1 className="display">Fora do vinhedo.</h1>
        <p>A página que você procura não existe ou foi movida.</p>
        <Link to="/" className="btn btn-light">
          <ArrowLeft /> Voltar ao início
        </Link>
      </div>
    </section>
  );
}
