import { CircleAlert, CircleCheck, CircleOff, OctagonAlert, TriangleAlert } from 'lucide-react';
import { QUALITY_LABEL, SENSOR_STATUS_LABEL, STAGE_LABEL } from '../../data/labels';
import type { Classification, PipelineStage, Quality, SensorStatus, VarietyId } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';

const QUALITY_ICON = { boa: CircleCheck, atencao: TriangleAlert, critica: OctagonAlert } as const;

/** Qualidade sempre com ícone + rótulo (a cor nunca carrega o significado sozinha). */
export function QualityBadge({ quality, label }: { quality: Quality; label?: string }) {
  const Icon = QUALITY_ICON[quality];
  return (
    <span className={`badge badge-${quality}`}>
      <Icon aria-hidden="true" />
      {label ?? QUALITY_LABEL[quality]}
    </span>
  );
}

const CLASS_QUALITY: Record<Classification, Quality> = {
  APROVADA: 'boa',
  'EM OBSERVAÇÃO': 'atencao',
  'REVISÃO NECESSÁRIA': 'critica',
};

export function ClassificationBadge({ value }: { value: Classification }) {
  return <QualityBadge quality={CLASS_QUALITY[value]} label={value} />;
}

export function SensorStatusBadge({ status }: { status: SensorStatus }) {
  if (status === 'offline')
    return (
      <span className="badge badge-offline">
        <CircleOff aria-hidden="true" />
        {SENSOR_STATUS_LABEL.offline}
      </span>
    );
  if (status === 'atencao')
    return (
      <span className="badge badge-atencao">
        <CircleAlert aria-hidden="true" />
        {SENSOR_STATUS_LABEL.atencao}
      </span>
    );
  return (
    <span className="badge badge-online">
      <span className="badge-dot live" aria-hidden="true" />
      {SENSOR_STATUS_LABEL.online}
    </span>
  );
}

export function StageBadge({ stage }: { stage: PipelineStage }) {
  const done = stage === 'concluida';
  return (
    <span className={`badge ${done ? 'badge-boa' : 'badge-neutral'}`}>
      {done ? <CircleCheck aria-hidden="true" /> : <span className="spinner" style={{ width: 12, height: 12 }} aria-hidden="true" />}
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function VarietyTag({ id }: { id: VarietyId }) {
  const v = VARIETY_BY_ID[id];
  return (
    <span className="variety-tag">
      <i style={{ background: v.chartColor }} aria-hidden="true" />
      {v.name}
    </span>
  );
}
