import { MATURATION_LABEL } from '../../data/labels';
import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatPct } from '../../lib/format';

/** Resultado no formato apresentado ao produtor (saída do detector ou registro importado). */
export function YoloResult({ reading }: { reading: Reading }) {
  const rows: [string, string, string?][] = [
    ['Uva identificada', VARIETY_BY_ID[reading.varietyId]?.name ?? reading.varietyId],
    ['Confiança', formatPct(reading.confidence)],
    ['Condição visual', reading.visualCondition],
    ['Maturação', MATURATION_LABEL[reading.maturation] ?? reading.maturation],
    ['Classificação', reading.classification, reading.quality],
  ];
  const anomalies = reading.detections.filter((d) => d.kind === 'anomalia').length;
  return (
    <div className="yolo-output" aria-label="Resultado da análise">
      <div className="yolo-output-head mono">{reading.modelVersion}</div>
      <dl>
        {rows.map(([k, v, q]) => (
          <div key={k}>
            <dt>{k}:</dt>
            <dd className={q ? `tone-${q}` : ''}>{v}</dd>
          </div>
        ))}
      </dl>
      <div className="yolo-output-foot mono">
        {reading.clustersDetected} cacho(s) · {anomalies} anomalia(s)
        {reading.source !== 'importacao' ? ` · ${reading.processingMs} ms` : ''}
      </div>
    </div>
  );
}
