import { CircleCheck, Cpu, ImageDown, ScanSearch, Sparkles, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { MATURATION_LABEL, STAGE_LABEL } from '../../data/labels';
import type { PipelineStage } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatPct } from '../../lib/format';
import { GrapeScene } from '../grape/GrapeScene';
import { QualityBadge } from '../ui/Badges';

const STAGES: { key: PipelineStage; icon: typeof Cpu; ms: number }[] = [
  { key: 'recebida', icon: ImageDown, ms: 1300 },
  { key: 'processando', icon: Cpu, ms: 1300 },
  { key: 'analisando', icon: ScanSearch, ms: 1900 },
  { key: 'concluida', icon: CircleCheck, ms: 3600 },
];

/** Demonstração animada do pipeline no hero: captura → processamento → YOLO → resultado. */
export function HeroShowcase() {
  const { readings, sensorById } = useData();
  const samples = useMemo(() => {
    const pick = (q: string, v: string) => readings.find((r) => r.quality === q && r.varietyId === v);
    return [pick('boa', 'cabernet-sauvignon'), pick('atencao', 'syrah'), pick('boa', 'moscato-canelli'), pick('critica', 'chenin-blanc'), pick('boa', 'tempranillo')].filter(
      (r): r is NonNullable<typeof r> => !!r,
    );
  }, [readings]);
  const [index, setIndex] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!samples.length) return;
    const t = setTimeout(() => {
      if (stage < STAGES.length - 1) setStage(stage + 1);
      else {
        setStage(0);
        setIndex((i) => (i + 1) % samples.length);
      }
    }, STAGES[stage].ms);
    return () => clearTimeout(t);
  }, [stage, samples.length]);

  const reading = samples[index];
  if (!reading) return <div className="showcase skeleton" style={{ aspectRatio: '4/3' }} />;
  const sensor = sensorById[reading.sensorId];
  const current = STAGES[stage].key;
  const done = current === 'concluida';

  return (
    <div className="showcase">
      <div className="showcase-frame">
        <div className="showcase-stages" aria-live="polite">
          {STAGES.map((s, i) => (
            <span key={s.key} className={`showcase-stage ${i === stage ? 'current' : i < stage ? 'done' : ''}`}>
              <s.icon aria-hidden="true" />
              {STAGE_LABEL[s.key]}
            </span>
          ))}
        </div>
        <GrapeScene
          key={reading.id + (stage >= 2 ? 'b' : 'a')}
          className="scene"
          seed={reading.imageSeed}
          varietyId={reading.varietyId}
          detections={reading.detections}
          capturedAt={reading.capturedAt}
          sensorId={reading.sensorId}
          block={reading.block}
          hud
          showBoxes={stage >= 2}
          animateBoxes
          scanning={stage === 1 || stage === 2}
        />
      </div>

      <div className="float-card float-sensor">
        <div className="kpi-icon">
          <Wifi />
        </div>
        <div>
          <strong>
            {sensor?.id} · {sensor?.block}
          </strong>
          <span>ESP32-CAM · {sensor?.signal} dBm</span>
        </div>
      </div>

      <div className="float-card float-result">
        <div className="fr-title">
          <Sparkles size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
          Resultado da IA
        </div>
        {done ? (
          <div className="result-enter" key={reading.id}>
            <div className="fr-variety">{VARIETY_BY_ID[reading.varietyId].name}</div>
            <div className="fr-row">
              Confiança <strong>{formatPct(reading.confidence)}</strong>
            </div>
            <div className="fr-row">
              Maturação <strong>{MATURATION_LABEL[reading.maturation]}</strong>
            </div>
            <div style={{ marginTop: 10 }}>
              <QualityBadge quality={reading.quality} />
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
