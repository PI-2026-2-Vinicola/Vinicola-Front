import { ArrowRight, CircleCheck, Info, OctagonAlert, Search, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QUALITY_ORDER } from '../../data/labels';
import type { Variety } from '../../data/types';
import { VARIETIES } from '../../data/varieties';
import { DISCLAIMER } from '../analysis/ReadingDetail';
import { QualityBadge } from '../ui/Badges';
import { Reveal } from '../ui/Reveal';
import { VARIETY_PHOTOS } from '../../data/photos';
import { Photo } from '../ui/Photo';

export const CRITERIA_INFO = [
  { q: 'boa' as const, icon: CircleCheck, text: 'Características visuais dentro dos parâmetros esperados para a variedade.' },
  { q: 'atencao' as const, icon: TriangleAlert, text: 'Características que precisam ser acompanhadas nas próximas leituras.' },
  { q: 'critica' as const, icon: OctagonAlert, text: 'Características visuais fora do padrão esperado — recomenda-se inspeção em campo.' },
];

export function CriteriaList({ variety }: { variety: Variety }) {
  return (
    <div className="criteria">
      {QUALITY_ORDER.map((q) => (
        <div key={q} className={`criteria-row ${q}`}>
          <QualityBadge quality={q} />
          <span>{variety.criteria[q]}</span>
        </div>
      ))}
    </div>
  );
}

/** Fotografia real da variedade (Wikimedia Commons), com crédito do autor e da licença. */
export function GrapeImage({ variety, eager = false, sizes }: { variety: Variety; eager?: boolean; sizes?: string }) {
  return <Photo photo={VARIETY_PHOTOS[variety.id]} eager={eager} sizes={sizes} />;
}

/** Link para buscar a variedade nas perguntas e respostas da Embrapa (o resultado vem da API; pode não haver menções). */
export const embrapaSearchLink = (term: string) => `/uvas?${new URLSearchParams({ aba: 'perguntas', q: term, livros: 'todos' }).toString()}`;

/** Variedades do catálogo usado nas análises da OASIS (conteúdo educativo elaborado pela equipe do projeto). */
export function VarietyLibrary() {
  const [type, setType] = useState<'todas' | 'Tinta' | 'Branca'>('todas');
  const list = VARIETIES.filter((v) => type === 'todas' || v.type === type);
  return (
    <div className="stack">
      <div className="card toolbar">
        <div className="segmented" role="group" aria-label="Tipo de uva">
          {(['todas', 'Tinta', 'Branca'] as const).map((t) => (
            <button key={t} aria-pressed={type === t} onClick={() => setType(t)}>
              {t === 'todas' ? 'Todas' : t === 'Tinta' ? 'Tintas' : 'Brancas'}
            </button>
          ))}
        </div>
        <span className="muted" style={{ fontSize: 13.5 }}>
          {list.length} variedades · descrições elaboradas pela equipe do projeto · fotos do Wikimedia Commons (créditos na página Sobre)
        </span>
      </div>

      <div className="grape-cards">
        {list.map((v, i) => (
          <Reveal key={v.id} delay={(i % 3) * 80}>
            <article className="card card-hover grape-card" style={{ height: '100%' }}>
              <div className="grape-card-media">
                <GrapeImage variety={v} sizes="(max-width: 640px) 100vw, 400px" />
                <div className="grape-card-tags">
                  <span className="badge">Uva {v.type.toLowerCase()}</span>
                </div>
              </div>
              <div className="grape-card-body">
                <div>
                  <h3>{v.name}</h3>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {v.origin}
                  </span>
                </div>
                <p>{v.description}</p>
                <div className="spec-grid">
                  <div>
                    <span>Tipo</span>
                    <strong>{v.type}</strong>
                  </div>
                  <div>
                    <span>Cor</span>
                    <strong>{v.color}</strong>
                  </div>
                  <div>
                    <span>Maturação</span>
                    <strong>{v.maturationCycle}</strong>
                  </div>
                </div>
                <div>
                  <div className="field-label" style={{ marginBottom: 8 }}>
                    Características
                  </div>
                  <ul className="bullets">
                    {v.characteristics.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="field-label" style={{ marginBottom: 8 }}>
                    Características visuais
                  </div>
                  <ul className="bullets">
                    {v.visualTraits.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <details className="criteria-details">
                  <summary>Critérios de classificação</summary>
                  <CriteriaList variety={v} />
                </details>
                <div className="grape-card-links">
                  <Link to={`/uvas/${v.id}`} className="link">
                    Ver variedade e histórico <ArrowRight />
                  </Link>
                  <Link to={embrapaSearchLink(v.name)} className="link">
                    <Search /> Buscar na Embrapa
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="section-title">
        <div>
          <h2>Como as uvas são classificadas</h2>
          <p>Cada leitura recebe uma das três classificações a partir da análise da imagem.</p>
        </div>
      </div>
      <div className="grid-3">
        {CRITERIA_INFO.map((c, i) => (
          <Reveal key={c.q} delay={i * 80}>
            <div className="card card-pad" style={{ height: '100%' }}>
              <QualityBadge quality={c.q} />
              <p style={{ marginTop: 12, color: 'var(--ink-600)' }}>{c.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="notice">
        <Info />
        <span>{DISCLAIMER}</span>
      </div>
    </div>
  );
}
