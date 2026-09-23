import { MATURATION_LABEL } from '../../data/labels';
import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatPct } from '../../lib/format';

/** Saída do modelo YOLO no formato apresentado ao produtor. */
export function YoloResult({ reading, animate = false }: { reading: Reading; animate?: boolean }) {
  const rows: [string, string, string?][] = [
    ['Uva identificada', VARIETY_BY_ID[reading.varietyId].name],
    ['Confiança', formatPct(reading.confidence)],
    ['Condição visual', reading.visualCondition],
    ['Maturação', MATURATION_LABEL[reading.maturation]],
    ['Classificação', reading.classification, reading.quality],
  ];
  return (
    <div className={`yolo-output ${animate ? 'animate' : ''}`} aria-label="Resultado do modelo YOLO">
      <div className="yolo-output-head">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="mono">osais-inference · {reading.modelVersion}</span>
      </div>
      <dl>
        {rows.map(([k, v, q], i) => (
          <div key={k} style={{ animationDelay: `${i * 140}ms` }}>
            <dt>{k}:</dt>
            <dd className={q ? `tone-${q}` : ''}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="yolo-output-foot mono">
        {reading.clustersDetected} cacho(s) · {reading.detections.filter((d) => d.kind === 'anomalia').length} anomalia(s) · {reading.processingMs} ms
      </div>
    </div>
  );
}
