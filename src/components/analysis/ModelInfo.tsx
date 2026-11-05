import { BrainCircuit, ClipboardList, Palette, Ruler } from 'lucide-react';
import type { AnalysisComponent, AnalysisModel, ModelCard } from '../../data/types';
import { DETECTOR_LABEL } from '../../lib/analysis';
import { formatPct } from '../../lib/format';

const KIND_TITLE = {
  cacho: 'Localizado pelo modelo',
  variedade: 'Variedades (cacho)',
  anomalia_leve: 'Anomalias leves',
  anomalia_grave: 'Anomalias graves',
} as const;
const SOURCE_TITLE = { modelo: 'modelo treinado', analise_cor: 'regra de cor' } as const;
const COMPONENT_ICON = { modelo: BrainCircuit, cadastro: ClipboardList, regra: Palette };

function Components({ items }: { items: AnalysisComponent[] }) {
  return (
    <ul className="model-components">
      {items.map((c) => {
        const Icon = COMPONENT_ICON[c.kind];
        return (
          <li key={c.item}>
            <Icon aria-hidden="true" />
            <span>
              <strong>{c.item}</strong>
              <small>{c.source}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function CardSummary({ card }: { card: ModelCard }) {
  const total = card.dataset.images.total ?? 0;
  const clusters = card.dataset.instances.total ?? 0;
  return (
    <div className="model-card">
      <div className="field-label">
        <Ruler aria-hidden="true" /> Treinamento e desempenho medido
      </div>
      <p>
        {card.architecture} treinado {card.pretrained ? 'por transfer learning' : 'do zero'} com <strong>{total} fotos reais</strong> ({clusters.toLocaleString('pt-BR')} cachos
        anotados) do{' '}
        <a href={card.dataset.sourceUrl} target="_blank" rel="noreferrer" className="link">
          {card.dataset.name}
        </a>{' '}
        — {card.dataset.institution}. {card.dataset.capture}. Variedades: {card.dataset.varieties.join(', ')}.
      </p>
      {card.metrics.length > 0 && (
        <div className="table-wrap">
          <table className="table model-metrics">
            <caption className="sr-only">Métricas do modelo</caption>
            <thead>
              <tr>
                <th>Conjunto</th>
                <th className="num">Imagens</th>
                <th className="num">Precisão</th>
                <th className="num">Recall</th>
                <th className="num">F1</th>
                <th className="num">mAP50</th>
                <th className="num">mAP50-95</th>
              </tr>
            </thead>
            <tbody>
              {card.metrics.map((m) => (
                <tr key={m.split}>
                  <td>{m.split}</td>
                  <td className="num">{m.images}</td>
                  <td className="num">{formatPct(m.precision)}</td>
                  <td className="num">{formatPct(m.recall)}</td>
                  <td className="num">{formatPct(m.f1)}</td>
                  <td className="num">{formatPct(m.map50)}</td>
                  <td className="num">{formatPct(m.map5095)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted small">
        Precisão, recall e F1 no limiar de confiança {card.metrics[0]?.confidence.toFixed(2)} (IoU 0,5), medidos com o mesmo código de inferência da API em imagens que
        não foram usadas no treino. {card.inferenceMsCpu ? `Inferência em CPU: cerca de ${Math.round(card.inferenceMsCpu)} ms por foto.` : ''} {card.license}
      </p>
    </div>
  );
}

/** O que o detector em uso consegue identificar — somente o que a API informa — e de onde vem cada parte do resultado. */
export function ModelInfo({ model }: { model: AnalysisModel }) {
  const Icon = model.yoloLoaded ? BrainCircuit : Palette;
  const groups = (Object.keys(KIND_TITLE) as (keyof typeof KIND_TITLE)[])
    .map((k) => ({ kind: k, items: model.classes.filter((c) => c.kind === k) }))
    .filter((g) => g.items.length);
  const title = model.card ? `${model.card.name} ${model.card.version}` : (DETECTOR_LABEL[model.detector] ?? model.detector);
  return (
    <details className="model-info">
      <summary>
        <Icon aria-hidden="true" />
        <span>
          Detector em uso: <strong>{title}</strong>
          <small className="mono">{model.version}</small>
        </span>
      </summary>
      <div className="model-info-body">
        <p>{model.description}</p>
        {model.components.length > 0 && <Components items={model.components} />}
        {model.card && <CardSummary card={model.card} />}
        {groups.map((g) => (
          <div key={g.kind}>
            <div className="field-label">{KIND_TITLE[g.kind]}</div>
            <div className="class-chips">
              {g.items.map((c) => (
                <span key={c.name} className={`class-chip ${g.kind}`} title={`${c.name} · ${SOURCE_TITLE[c.source]}`}>
                  {c.label}
                  {g.kind !== 'cacho' && c.source === 'analise_cor' && <em> · regra de cor</em>}
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
