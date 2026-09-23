import { CalendarDays, Clock, Cpu, Eye, EyeOff, Info, MapPin, ScanSearch, Timer } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MATURATION_LABEL, MATURATION_ORDER } from '../../data/labels';
import type { Reading, Sensor } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatDate, formatTime } from '../../lib/format';
import { resolveImageUrl } from '../../services/api';
import { GrapeScene } from '../grape/GrapeScene';
import { ClassificationBadge, QualityBadge } from '../ui/Badges';
import { ConfidenceBar } from '../ui/ConfidenceBar';
import { YoloResult } from './YoloResult';

export const DISCLAIMER =
  'Esta classificação é baseada na análise computacional da imagem e não substitui a avaliação agronômica profissional.';

export function ReadingDetail({ reading, sensor, onNavigate }: { reading: Reading; sensor?: Sensor; onNavigate?: () => void }) {
  const [boxes, setBoxes] = useState(true);
  const variety = VARIETY_BY_ID[reading.varietyId];
  const matIndex = MATURATION_ORDER.indexOf(reading.maturation);
  const anomalies = reading.detections.filter((d) => d.kind === 'anomalia');

  return (
    <div className="reading-detail">
      <div className="reading-media">
        <div className="reading-image">
          <GrapeScene
            className="scene"
            seed={reading.imageSeed}
            varietyId={reading.varietyId}
            detections={reading.detections}
            capturedAt={reading.capturedAt}
            sensorId={reading.sensorId}
            block={reading.block}
            imageUrl={resolveImageUrl(reading)}
            hud
            showBoxes={boxes}
            animateBoxes
          />
          <button className="btn btn-sm btn-glass reading-toggle" onClick={() => setBoxes((b) => !b)}>
            {boxes ? <EyeOff /> : <Eye />}
            {boxes ? 'Ocultar detecções' : 'Mostrar detecções'}
          </button>
        </div>
        <div className="detections">
          <div className="field-label" style={{ marginBottom: 8 }}>
            <ScanSearch size={15} style={{ display: 'inline', verticalAlign: '-3px', marginRight: 6 }} />
            Detecções do modelo ({reading.detections.length})
          </div>
          <ul>
            {reading.detections.map((d, i) => (
              <li key={i}>
                <span className={`det-swatch ${d.kind === 'cacho' ? 'cluster' : anomalies.length && ['podridao', 'baga_murcha', 'lesao'].includes(d.label) ? 'severe' : 'mild'}`} />
                <span className="mono">{d.label}</span>
                <span className="muted">{d.kind === 'cacho' ? 'cacho' : 'anomalia'}</span>
                <span className="mono" style={{ marginLeft: 'auto' }}>
                  {d.confidence.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="reading-info">
        <div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-neutral mono">{reading.id}</span>
            <ClassificationBadge value={reading.classification} />
          </div>
          <h2 className="display" style={{ fontSize: 30, marginTop: 12 }}>
            {variety.name}
          </h2>
          <p className="muted" style={{ marginTop: 4 }}>
            Uva {variety.type.toLowerCase()} · {variety.color}
          </p>
        </div>

        <div className="info-block">
          <div className="field-label">Confiança da IA</div>
          <ConfidenceBar value={reading.confidence} large />
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
            <strong>{MATURATION_LABEL[reading.maturation]}</strong>
            <div className="maturation-steps" aria-hidden="true">
              {MATURATION_ORDER.map((m, i) => (
                <i key={m} className={i <= matIndex ? 'on' : ''} title={MATURATION_LABEL[m]} />
              ))}
            </div>
          </div>
        </div>

        <div className="info-block">
          <div className="field-label">Observações</div>
          <p style={{ fontSize: 14.5, color: 'var(--ink-700)' }}>{reading.observations}</p>
        </div>

        <YoloResult reading={reading} animate />

        <div className="info-grid compact">
          <div>
            <span>
              <Cpu /> Sensor
            </span>
            {sensor ? (
              <Link to={`/sensores/${sensor.id}`} className="link" onClick={onNavigate}>
                {sensor.id} · {sensor.name}
              </Link>
            ) : (
              <strong>{reading.sensorId}</strong>
            )}
          </div>
          <div>
            <span>
              <MapPin /> Local
            </span>
            <strong>{reading.location}</strong>
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
          <div>
            <span>
              <Timer /> Processamento
            </span>
            <strong>{reading.processingMs} ms</strong>
          </div>
          <div>
            <span>
              <ScanSearch /> Modelo
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
