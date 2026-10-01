import type { Reading } from '../../data/types';
import { VARIETY_BY_ID } from '../../data/varieties';
import { formatDateTime, formatRelative } from '../../lib/format';
import { ReadingImage } from '../reading/ReadingImage';
import { QualityBadge } from '../ui/Badges';

export function ReadingThumb({ reading }: { reading: Reading }) {
  return (
    <div className="list-thumb">
      <ReadingImage reading={reading} thumb />
    </div>
  );
}

export function ReadingListItem({ reading, onOpen, relative = true }: { reading: Reading; onOpen: (r: Reading) => void; relative?: boolean }) {
  return (
    <button className="list-item" onClick={() => onOpen(reading)}>
      <ReadingThumb reading={reading} />
      <div className="list-body">
        <strong>{VARIETY_BY_ID[reading.varietyId]?.name ?? reading.varietyId}</strong>
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
