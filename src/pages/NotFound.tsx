import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
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
