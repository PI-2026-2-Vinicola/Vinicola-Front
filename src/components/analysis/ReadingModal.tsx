import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import type { Reading } from '../../data/types';
import { Modal } from '../ui/Modal';
import { ReadingDetail } from './ReadingDetail';

export function ReadingModal({ reading, onClose }: { reading: Reading | null; onClose: () => void }) {
  const { sensorById } = useData();
  return (
    <Modal open={!!reading} onClose={onClose} label="Detalhes da análise">
      {reading && (
        <>
          <ReadingDetail reading={reading} sensor={sensorById[reading.sensorId]} onNavigate={onClose} />
          <div className="modal-foot">
            <Link to={`/historico/${reading.id}`} className="link" onClick={onClose}>
              Abrir página da análise <ExternalLink />
            </Link>
          </div>
        </>
      )}
    </Modal>
  );
}
