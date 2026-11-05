import { Sparkles } from 'lucide-react';
import type { Reading } from '../../data/types';
import { VARIETIES } from '../../data/varieties';
import { AGREEMENT_TEXT, varietyAgreement } from '../../lib/analysis';
import { formatPct } from '../../lib/format';

const CATALOG_IDS = VARIETIES.map((v) => v.id);

/** Variedade prevista pela foto (modelo YOLO de variedades), comparada com a cadastrada no talhão. */
export function PredictedVariety({ reading }: { reading: Reading }) {
  if (!reading.predictedVariety || reading.varietyConfidence == null) return null;
  const agreement = varietyAgreement(reading.predictedVariety, reading.varietyConfidence, reading.varietyId, CATALOG_IDS);
  return (
    <div className={`predicted-variety agreement-${agreement}`}>
      <div className="field-label">
        <Sparkles aria-hidden="true" /> Variedade pela foto · previsão do modelo
      </div>
      <div className="predicted-variety-main">
        <strong>{reading.predictedVarietyName ?? reading.predictedVariety}</strong>
        <span className="mono">{formatPct(reading.varietyConfidence)}</span>
        <span className="badge predicted-variety-badge">{AGREEMENT_TEXT[agreement]}</span>
      </div>
      <p className="field-hint">
        O modelo de variedades analisa os cachos detectados e conhece cinco variedades (Cabernet Franc, Cabernet Sauvignon, Chardonnay, Sauvignon Blanc e
        Syrah). A variedade registrada na leitura continua sendo a do talhão.
      </p>
    </div>
  );
}
