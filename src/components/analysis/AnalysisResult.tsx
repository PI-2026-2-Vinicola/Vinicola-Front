import { ScanSearch } from 'lucide-react';
import type { Reading } from '../../data/types';
import { summarizeDetections } from '../../lib/detections';
import { formatPct } from '../../lib/format';
import { ReadingImage } from '../reading/ReadingImage';

const KIND_LABEL = { cacho: 'Cacho', leve: 'Anomalia leve', grave: 'Anomalia grave' };

/** Imagem processada sem e com as caixas detectadas, lado a lado. */
export function AnalysisComparison({ reading }: { reading: Reading }) {
  return (
    <div className="compare-grid">
      <figure>
        <figcaption>Imagem enviada</figcaption>
        <ReadingImage reading={reading} showBoxes={false} />
      </figure>
      <figure>
        <figcaption>
          Com detecções <span className="muted">({reading.detections.length})</span>
        </figcaption>
        <ReadingImage reading={reading} showBoxes />
      </figure>
    </div>
  );
}

/** Quantidade e confiança por classe detectada, ou a orientação quando nada foi identificado. */
export function DetectionSummary({ reading, anomalyMinConfidence = 0.5 }: { reading: Reading; anomalyMinConfidence?: number }) {
  const summary = summarizeDetections(reading.detections);
  if (summary.length === 0)
    return (
      <div className="notice notice-warn detection-empty">
        <ScanSearch />
        <span>
          <strong>Nenhuma detecção nesta imagem.</strong> {reading.observations || 'Verifique o enquadramento, a iluminação e o foco e tente outra foto.'}
        </span>
      </div>
    );
  return (
    <div className="table-wrap detection-summary">
      <table className="table">
        <caption className="sr-only">Detecções por classe</caption>
        <thead>
          <tr>
            <th>Classe identificada</th>
            <th>Tipo</th>
            <th className="num">Quantidade</th>
            <th className="num">Confiança máx.</th>
            <th className="num">Confiança média</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((s) => (
            <tr key={s.label}>
              <td>
                <span className={`det-swatch ${s.kind === 'cacho' ? 'cluster' : s.severe ? 'severe' : 'mild'}`} /> {s.name}
              </td>
              <td>{s.kind === 'cacho' ? KIND_LABEL.cacho : s.severe ? KIND_LABEL.grave : KIND_LABEL.leve}</td>
              <td className="num">{s.count}</td>
              <td className="num">{formatPct(s.maxConfidence)}</td>
              <td className="num">{formatPct(s.avgConfidence)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small detection-foot">Anomalias com confiança abaixo de {formatPct(anomalyMinConfidence)} não alteram a classificação.</p>
    </div>
  );
}
