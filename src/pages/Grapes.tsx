import { ArrowRight, CircleCheck, Info, OctagonAlert, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DISCLAIMER } from '../components/analysis/ReadingDetail';
import { GrapeScene } from '../components/grape/GrapeScene';
import { PageHero } from '../components/layout/PageHero';
import { QualityBadge } from '../components/ui/Badges';
import { Reveal } from '../components/ui/Reveal';
import { QUALITY_ORDER } from '../data/labels';
import type { Variety } from '../data/types';
import { VARIETIES } from '../data/varieties';

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

export function GrapeImage({ variety, seed = 11 }: { variety: Variety; seed?: number }) {
  return <GrapeScene className="scene" seed={seed} varietyId={variety.id} detections={[{ kind: 'cacho', label: '', confidence: 1, box: [0.3, 0.12, 0.4, 0.74] }]} showBoxes={false} title={`Ilustração de um cacho de ${variety.name}`} />;
}

export default function Grapes() {
  const [type, setType] = useState<'todas' | 'Tinta' | 'Branca'>('todas');
  const list = VARIETIES.filter((v) => type === 'todas' || v.type === type);
  return (
    <>
      <PageHero eyebrow="Biblioteca educacional" title="Conheça nossas uvas" description="As variedades cultivadas na propriedade, suas características e os critérios visuais usados pela OSAIS para classificar cada leitura." />
      <div className="container page-body">
        <div className="card toolbar" style={{ marginBottom: 20 }}>
          <div className="segmented" role="group" aria-label="Tipo de uva">
            {(['todas', 'Tinta', 'Branca'] as const).map((t) => (
              <button key={t} aria-pressed={type === t} onClick={() => setType(t)}>
                {t === 'todas' ? 'Todas' : t === 'Tinta' ? 'Tintas' : 'Brancas'}
              </button>
            ))}
          </div>
          <span className="muted" style={{ fontSize: 13.5 }}>
            {list.length} variedades
          </span>
        </div>

        <div className="grape-cards">
          {list.map((v, i) => (
            <Reveal key={v.id} delay={(i % 3) * 80}>
              <article className="card card-hover grape-card" style={{ height: '100%' }}>
                <div className="grape-card-media">
                  <GrapeImage variety={v} seed={31 + i * 7} />
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
                  <Link to={`/uvas/${v.id}`} className="link" style={{ marginTop: 'auto' }}>
                    Ver variedade e histórico <ArrowRight />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="section-title">
          <div>
            <h2>Como as uvas são classificadas</h2>
            <p>Cada leitura recebe uma das três classificações a partir da análise da imagem pelo modelo.</p>
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
        <div className="notice" style={{ marginTop: 20 }}>
          <Info />
          <span>{DISCLAIMER}</span>
        </div>
      </div>
    </>
  );
}
