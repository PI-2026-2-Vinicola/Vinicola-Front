import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatDateTime, formatRelative } from '../../lib/format';
import { resolveImageUrl } from '../../services/api';
import { GrapeScene } from '../grape/GrapeScene';
import { QualityBadge } from '../ui/Badges';

export function ReadingThumb({ reading }: { reading: Reading }) {
  return (
    <div className="list-thumb">
      <GrapeScene className="scene" seed={reading.imageSeed} varietyId={reading.varietyId} detections={reading.detections} imageUrl={resolveImageUrl(reading)} showBoxes={false} />
    </div>
  );
}

export function ReadingListItem({ reading, onOpen, relative = true }: { reading: Reading; onOpen: (r: Reading) => void; relative?: boolean }) {
  return (
    <button className="list-item" onClick={() => onOpen(reading)}>
      <ReadingThumb reading={reading} />
      <div className="list-body">
        <strong>{VARIETY_BY_ID[reading.varietyId].name}</strong>
        <span>
          {reading.sensorId} · {reading.visualCondition}
        </span>
        <small>{relative ? formatRelative(reading.capturedAt) : formatDateTime(reading.capturedAt)}</small>
      </div>
      <div className="list-meta">
        <QualityBadge quality={reading.quality} />
      </div>
    </button>
  );
}
