import { CalendarDays, Clock, Cpu, Eye, EyeOff, Info, MapPin, ScanSearch, Timer } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ANOMALY_LABEL, MATURATION_LABEL, MATURATION_ORDER, SEVERE_ANOMALIES } from '../../data/labels';
import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { analysisKind, CONFIDENCE_LABEL, detectionSource } from '../../lib/analysis';
import { formatDate, formatTime } from '../../lib/format';
import { ReadingImage } from '../reading/ReadingImage';
import { ClassificationBadge, QualityBadge, SourceBadge } from '../ui/Badges';
import { ConfidenceBar } from '../ui/ConfidenceBar';
import { YoloResult } from './YoloResult';

export const DISCLAIMER = 'Esta classificação é baseada na análise computacional da imagem e não substitui a avaliação agronômica profissional.';

/** `infoOnly`: só os dados da leitura (quando a imagem já é exibida ao lado, como no resultado do envio). */
export function ReadingDetail({ reading, onNavigate, infoOnly = false }: { reading: Reading; onNavigate?: () => void; infoOnly?: boolean }) {
  const [boxes, setBoxes] = useState(true);
  const { can } = useAuth();
  const variety = VARIETY_BY_ID[reading.varietyId];
  const matIndex = MATURATION_ORDER.indexOf(reading.maturation);
  const hasImage = !!reading.imageUrl;
  const kind = analysisKind(reading.modelVersion);
  // A variedade vem do cadastro do talhão (e não da foto) na análise de cor e no modelo de cachos.
  const plotVariety = kind === 'cluster' || kind === 'color';

  return (
    <div className={`reading-detail ${infoOnly ? 'reading-detail--info' : ''}`}>
      {!infoOnly && (
      <div className="reading-media">
        <div className="reading-image">
          <ReadingImage reading={reading} showBoxes={boxes} />
          {hasImage && reading.detections.length > 0 && (
            <button className="btn btn-sm btn-secondary reading-toggle" onClick={() => setBoxes((b) => !b)}>
              {boxes ? <EyeOff /> : <Eye />}
              {boxes ? 'Ocultar detecções' : 'Mostrar detecções'}
            </button>
          )}
        </div>
        <div className="detections">
          <div className="field-label">
            <ScanSearch size={15} aria-hidden="true" /> Detecções ({reading.detections.length})
          </div>
          {reading.detections.length === 0 ? (
            <p className="muted small">{reading.source === 'importacao' ? 'Registro importado: as caixas de detecção não fazem parte do arquivo.' : 'Nenhuma região identificada na imagem.'}</p>
          ) : (
            <ul>
              {reading.detections.map((d, i) => (
                <li key={i}>
                  <span className={`det-swatch ${d.kind === 'cacho' ? 'cluster' : SEVERE_ANOMALIES.has(d.label) ? 'severe' : 'mild'}`} />
                  <span>{d.kind === 'cacho' ? `Cacho (${VARIETY_BY_ID[d.label.replace(/_/g, '-') as keyof typeof VARIETY_BY_ID]?.name ?? d.label})` : (ANOMALY_LABEL[d.label] ?? d.label)}</span>
                  <small className="det-source">{detectionSource(kind, d.kind)}</small>
                  <span className="mono" style={{ marginLeft: 'auto' }}>
                    {(d.confidence * 100).toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      )}

      <div className="reading-info">
        <div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-neutral mono">{reading.id}</span>
            <ClassificationBadge value={reading.classification} />
            <SourceBadge source={reading.source} />
          </div>
          <h2 className="reading-title">
            {plotVariety ? `Talhão de ${variety?.name ?? reading.varietyId}` : (variety?.name ?? reading.varietyId)}
          </h2>
          {variety && (
            <p className="muted">
              Uva {variety.type.toLowerCase()} · {variety.color}
            </p>
          )}
          {plotVariety && (
            <p className="field-hint reading-title-hint">
              Variedade cadastrada no sensor do talhão — não identificada pela foto.
            </p>
          )}
        </div>

        <div className="info-block">
          <div className="field-label">{CONFIDENCE_LABEL[kind]}</div>
          <ConfidenceBar value={reading.confidence} large />
          {kind === 'color' && (
            <p className="field-hint">
              Calculado pela proporção de pixels com cor de baga na região do cacho; não é a probabilidade de um modelo treinado. A variedade é a cadastrada no talhão do sensor.
            </p>
          )}
          {kind === 'cluster' && (
            <p className="field-hint">
              <strong>Previsão do modelo:</strong> confiança estimada pelo YOLO de que a caixa principal contém um cacho de uva. A variedade é a cadastrada no talhão (o modelo
              não identifica variedades) e as anomalias vêm da análise de cor feita dentro de cada cacho detectado.
            </p>
          )}
        </div>

        <div className="info-grid">
          <div>
            <span>Qualidade</span>
            <QualityBadge quality={reading.quality} />
          </div>
          <div>
            <span>Condição visual</span>
            <strong>{reading.visualCondition}</strong>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span>Estágio de maturação</span>
            <strong>{MATURATION_LABEL[reading.maturation] ?? reading.maturation}</strong>
            {matIndex >= 0 && (
              <div className="maturation-steps" aria-hidden="true">
                {MATURATION_ORDER.map((m, i) => (
                  <i key={m} className={i <= matIndex ? 'on' : ''} title={MATURATION_LABEL[m]} />
                ))}
              </div>
            )}
          </div>
        </div>

        {reading.observations && (
          <div className="info-block">
            <div className="field-label">Observações</div>
            <p className="reading-obs">{reading.observations}</p>
          </div>
        )}

        <YoloResult reading={reading} />

        <div className="info-grid compact">
          <div>
            <span>
              <Cpu /> Sensor
            </span>
            {can('sensores') ? (
              <Link to={`/sensores/${reading.sensorId}`} className="link" onClick={onNavigate}>
                {reading.sensorId} · {reading.sensorName}
              </Link>
            ) : (
              <strong>
                {reading.sensorId} · {reading.sensorName}
              </strong>
            )}
          </div>
          <div>
            <span>
              <MapPin /> Local
            </span>
            <strong>
              {reading.block} · {reading.location}
            </strong>
          </div>
          <div>
            <span>
              <CalendarDays /> Data
            </span>
            <strong>{formatDate(reading.capturedAt)}</strong>
          </div>
          <div>
            <span>
              <Clock /> Hora
            </span>
            <strong>{formatTime(reading.capturedAt)}</strong>
          </div>
          {reading.source !== 'importacao' && (
            <div>
              <span>
                <Timer /> Processamento
              </span>
              <strong>{reading.processingMs} ms</strong>
            </div>
          )}
          <div>
            <span>
              <ScanSearch /> Análise
            </span>
            <strong>{reading.modelVersion}</strong>
          </div>
        </div>

        <div className="notice">
          <Info />
          <span>{DISCLAIMER}</span>
        </div>
      </div>
    </div>
  );
}
