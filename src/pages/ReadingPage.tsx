import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ReadingDetail } from '../components/analysis/ReadingDetail';
import { PageHero } from '../components/layout/PageHero';
import { ClassificationBadge } from '../components/ui/Badges';
import { useData } from '../context/DataContext';
import { VARIETY_BY_ID } from '../data/varieties';
import { formatDateTime } from '../lib/format';
import NotFound from './NotFound';

export default function ReadingPage() {
  const { id } = useParams();
  const { readings, sensorById } = useData();
  const index = readings.findIndex((r) => r.id === id);
  const reading = readings[index];
  if (!reading) return <NotFound />;
  const sameSensor = readings.filter((r) => r.sensorId === reading.sensorId);
  const pos = sameSensor.findIndex((r) => r.id === reading.id);
  const newer = sameSensor[pos - 1];
  const older = sameSensor[pos + 1];

  return (
    <>
      <PageHero
        crumbs={[
          { to: '/historico', label: 'Histórico' },
          { to: `/sensores/${reading.sensorId}`, label: reading.sensorId },
        ]}
        eyebrow={`Análise ${reading.id}`}
        title={VARIETY_BY_ID[reading.varietyId].name}
        description={`${reading.location} · ${formatDateTime(reading.capturedAt)}`}
        actions={<ClassificationBadge value={reading.classification} />}
      />
      <div className="container page-body">
        <section className="card">
          <ReadingDetail reading={reading} sensor={sensorById[reading.sensorId]} />
        </section>
        <div className="row-between" style={{ marginTop: 20 }}>
          {older ? (
            <Link to={`/historico/${older.id}`} className="btn btn-secondary">
              <ChevronLeft /> Leitura anterior
            </Link>
          ) : (
            <span />
          )}
          {newer && (
            <Link to={`/historico/${newer.id}`} className="btn btn-secondary">
              Próxima leitura <ChevronRight />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
