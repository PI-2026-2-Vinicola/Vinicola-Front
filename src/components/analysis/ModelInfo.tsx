import { BrainCircuit, Palette } from 'lucide-react';
import type { AnalysisModel } from '../../data/types';
import { DETECTOR_LABEL } from '../../lib/analysis';

const KIND_TITLE = { variedade: 'Variedades (cacho)', anomalia_leve: 'Anomalias leves', anomalia_grave: 'Anomalias graves' } as const;

/** O que o detector em uso consegue identificar — somente as classes informadas pela API. */
export function ModelInfo({ model }: { model: AnalysisModel }) {
  const Icon = model.yoloLoaded ? BrainCircuit : Palette;
  const groups = (Object.keys(KIND_TITLE) as (keyof typeof KIND_TITLE)[]).map((k) => ({ kind: k, items: model.classes.filter((c) => c.kind === k) })).filter((g) => g.items.length);
  return (
    <details className="model-info">
      <summary>
        <Icon aria-hidden="true" />
        <span>
          Detector em uso: <strong>{DETECTOR_LABEL[model.detector] ?? model.detector}</strong>
          <small className="mono">{model.version}</small>
        </span>
      </summary>
      <div className="model-info-body">
        <p>{model.description}</p>
        {groups.map((g) => (
          <div key={g.kind}>
            <div className="field-label">{KIND_TITLE[g.kind]}</div>
            <div className="class-chips">
              {g.items.map((c) => (
                <span key={c.name} className={`class-chip ${g.kind}`} title={c.name}>
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        ))}
        <ul className="bullets">
          {model.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
