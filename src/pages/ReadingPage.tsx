import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReadingDetail } from '../components/analysis/ReadingDetail';
import { PageHeader } from '../components/layout/PageHeader';
import { Modal } from '../components/ui/Modal';
import { ErrorState, errorMessage, LoadingBlock } from '../components/ui/States';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { VARIETY_BY_ID } from '../data/varieties';
import { useReading } from '../hooks/queries';
import { formatDateTime } from '../lib/format';
import { deleteReading } from '../services/api';
import { ApiError } from '../services/http';
import NotFound from './NotFound';

export default function ReadingPage() {
  const { id = '' } = useParams();
  const reading = useReading(id);
  const { can } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const remove = useMutation({
    mutationFn: () => deleteReading(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['readings'] });
      void qc.invalidateQueries({ queryKey: ['stats'] });
      void qc.invalidateQueries({ queryKey: ['sensors'] });
      toast.success(`Leitura ${id} excluída.`);
      navigate('/historico', { replace: true });
    },
  });

  if (reading.isError && reading.error instanceof ApiError && reading.error.status === 404) return <NotFound inline title="Leitura não encontrada" back="/historico" />;
  if (reading.isPending) return <div className="page"><LoadingBlock height={480} /></div>;
  if (reading.isError) return <div className="page"><ErrorState error={reading.error} onRetry={() => void reading.refetch()} /></div>;
  const r = reading.data;

  return (
    <div className="page">
      <PageHeader
        crumbs={[{ to: '/historico', label: 'Histórico' }]}
        title={`${VARIETY_BY_ID[r.varietyId]?.name ?? r.varietyId} · ${r.id}`}
        description={`${r.sensorId} · ${r.block} · ${r.location} · ${formatDateTime(r.capturedAt)}`}
        actions={
          can('excluirLeituras') && (
            <button className="btn btn-ghost btn-danger-text" onClick={() => setConfirm(true)}>
              <Trash2 /> Excluir
            </button>
          )
        }
      />
      <section className="card">
        <ReadingDetail reading={r} />
      </section>
      <Modal open={confirm} onClose={() => setConfirm(false)} label="Excluir leitura" size="sm">
        <div className="modal-body">
          <h2 className="modal-title">Excluir a leitura {r.id}?</h2>
          <p>A leitura, as detecções e os arquivos de imagem serão removidos definitivamente. A exclusão fica registrada na auditoria.</p>
          {remove.isError && <div className="form-error">{errorMessage(remove.error)}</div>}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={() => setConfirm(false)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={() => remove.mutate()} disabled={remove.isPending}>
              {remove.isPending && <span className="spinner" />} Excluir definitivamente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
