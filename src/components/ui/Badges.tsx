import { CircleAlert, CircleCheck, CircleOff, CirclePause, Database, FileUp, FlaskConical, OctagonAlert, Radio, TriangleAlert, Upload } from 'lucide-react';
import { QUALITY_LABEL, SENSOR_STATUS_LABEL, SOURCE_LABEL } from '../../data/labels';
import type { Classification, Quality, ReadingSource, SensorStatus, VarietyId } from '../../data/types';
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

export function SensorStatusBadge({ status, title }: { status: SensorStatus; title?: string }) {
  const map = {
    online: { cls: 'badge-online', icon: <span className="badge-dot live" aria-hidden="true" /> },
    atencao: { cls: 'badge-atencao', icon: <CircleAlert aria-hidden="true" /> },
    offline: { cls: 'badge-offline', icon: <CircleOff aria-hidden="true" /> },
    inativo: { cls: 'badge-neutral', icon: <CirclePause aria-hidden="true" /> },
  }[status];
  return (
    <span className={`badge ${map.cls}`} title={title}>
      {map.icon}
      {SENSOR_STATUS_LABEL[status]}
    </span>
  );
}

const SOURCE_ICON = { sensor: Radio, upload: Upload, importacao: FileUp, demonstracao: FlaskConical } as const;

export function SourceBadge({ source }: { source: ReadingSource }) {
  const Icon = SOURCE_ICON[source] ?? Database;
  return (
    <span className={`badge ${source === 'demonstracao' ? 'badge-demo' : 'badge-neutral'}`} title={source === 'demonstracao' ? 'Dado sintético de demonstração' : undefined}>
      <Icon aria-hidden="true" />
      {SOURCE_LABEL[source] ?? source}
    </span>
  );
}

export function VarietyTag({ id }: { id: VarietyId | string }) {
  const v = VARIETY_BY_ID[id as VarietyId];
  return (
    <span className="variety-tag">
      <i style={{ background: v?.chartColor ?? 'var(--ink-300)' }} aria-hidden="true" />
      {v?.name ?? id}
    </span>
  );
}
