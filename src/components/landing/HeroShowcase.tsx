import { CircleCheck, Cpu, ImageDown, ScanSearch, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MATURATION_LABEL, STAGE_LABEL } from '../../data/labels';
import type { PipelineStage } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatPct } from '../../lib/format';
import { GrapeScene } from '../grape/GrapeScene';
import { QualityBadge } from '../ui/Badges';
import { EXAMPLES } from './examples';

const STAGES: { key: PipelineStage; icon: typeof Cpu; ms: number }[] = [
  { key: 'recebida', icon: ImageDown, ms: 1300 },
  { key: 'processando', icon: Cpu, ms: 1300 },
  { key: 'analisando', icon: ScanSearch, ms: 1900 },
  { key: 'concluida', icon: CircleCheck, ms: 3600 },
];

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Ilustração animada do fluxo captura → processamento → detecção → resultado (exemplos fixos, não dados reais). */
export function HeroShowcase() {
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState(reduceMotion() ? 3 : 0);

  useEffect(() => {
    if (reduceMotion()) return;
    const t = setTimeout(() => {
      if (stage < STAGES.length - 1) setStage(stage + 1);
      else {
        setStage(0);
        setIndex((i) => (i + 1) % EXAMPLES.length);
      }
    }, STAGES[stage].ms);
    return () => clearTimeout(t);
  }, [stage]);

  const ex = EXAMPLES[index];
  const current = STAGES[stage].key;
  const done = current === 'concluida';

  return (
    <div className="showcase" aria-label="Ilustração do fluxo de análise">
      <div className="showcase-frame">
        <div className="showcase-stages" aria-live="polite">
          {STAGES.map((s, i) => (
            <span key={s.key} className={`showcase-stage ${i === stage ? 'current' : i < stage ? 'done' : ''}`}>
              <s.icon aria-hidden="true" />
              {STAGE_LABEL[s.key]}
            </span>
          ))}
        </div>
        <GrapeScene key={ex.key + (stage >= 2 ? 'b' : 'a')} className="scene" seed={ex.seed} varietyId={ex.varietyId} detections={ex.detections} showBoxes={stage >= 2} animateBoxes scanning={stage === 1 || stage === 2} title="Ilustração de um cacho analisado" />
        <span className="illustration-tag">Ilustração</span>
      </div>

      <div className="float-card float-result">
        <div className="fr-title">
          <Sparkles size={12} aria-hidden="true" /> Exemplo de resultado
        </div>
        {done ? (
          <div className="result-enter" key={ex.key}>
            <div className="fr-variety">{VARIETY_BY_ID[ex.varietyId].name}</div>
            <div className="fr-row">
              Confiança <strong>{formatPct(ex.confidence)}</strong>
            </div>
            <div className="fr-row">
              Maturação <strong>{MATURATION_LABEL[ex.maturation]}</strong>
            </div>
            <div style={{ marginTop: 10 }}>
              <QualityBadge quality={ex.quality} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '10px 0 4px' }}>
            <div className="skeleton" style={{ height: 22, width: '70%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 12, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 12 }} />
            <div className="row" style={{ gap: 8, fontSize: 12.5, color: 'var(--ink-500)' }}>
              <span className="spinner" style={{ width: 14, height: 14, color: 'var(--wine-500)' }} />
              {STAGE_LABEL[current]}…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
