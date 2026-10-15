import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pause, Pencil, Trash2 } from 'lucide-react';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Sensor } from '../../data/types';
import { keys } from '../../hooks/queries';
import { formatNumber } from '../../lib/format';
import { deleteSensor, updateSensor } from '../../services/api';
import { Modal } from '../ui/Modal';
import { errorMessage } from '../ui/States';
import { useToast } from '../ui/Toast';
import { SensorForm, type SensorFormValues } from './SensorForm';

/** Botões de editar e excluir; não propagam o clique para a linha ou o cartão (que abrem os detalhes). */
export function SensorActionButtons({ sensor, onEdit, onDelete, compact = false }: { sensor: Sensor; onEdit: () => void; onDelete: () => void; compact?: boolean }) {
  const stop = (fn: () => void) => (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <span className="sensor-actions" onKeyDown={(e) => e.stopPropagation()}>
      <button type="button" className={compact ? 'icon-btn' : 'btn btn-secondary btn-sm'} onClick={stop(onEdit)} aria-label={`Editar sensor ${sensor.id}`} title="Editar">
        <Pencil /> {!compact && 'Editar'}
      </button>
      <button type="button" className={compact ? 'icon-btn icon-btn-danger' : 'btn btn-ghost btn-sm btn-danger-text'} onClick={stop(onDelete)} aria-label={`Excluir sensor ${sensor.id}`} title="Excluir">
        <Trash2 /> {!compact && 'Excluir'}
      </button>
    </span>
  );
}

/** Edição dos dados cadastrais. O código do sensor não muda (é a identidade do dispositivo e do token). */
export function SensorEditModal({ sensor, onClose }: { sensor: Sensor | null; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const edit = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SensorFormValues }) => {
      const { id: _code, lat, lng, ...rest } = values;
      return updateSensor(id, lat === null ? { ...rest, clearLocation: true } : { ...rest, lat, lng });
    },
    onSuccess: (s) => {
      void qc.invalidateQueries({ queryKey: keys.sensors });
      toast.success(`Sensor ${s.id} atualizado.`);
      close();
    },
  });
  const close = () => {
    edit.reset();
    onClose();
  };
  return (
    <Modal open={!!sensor} onClose={close} label="Editar sensor" size="sm">
      {sensor && (
        <div className="modal-body">
          <h2 className="modal-title">Editar {sensor.id}</h2>
          <p className="muted small">O código do sensor não pode ser alterado: ele identifica o dispositivo e o token de envio.</p>
          <SensorForm
            key={sensor.id}
            initial={sensor}
            onSubmit={(values) => edit.mutate({ id: sensor.id, values })}
            onCancel={close}
            submitting={edit.isPending}
            submitLabel="Salvar alterações"
            serverError={edit.isError ? errorMessage(edit.error) : null}
          />
        </div>
      )}
    </Modal>
  );
}

/**
 * Exclusão com confirmação. A API só exclui sensores sem análises (o histórico é preservado);
 * nesse caso a janela explica o motivo e oferece desativar o sensor.
 */
export function SensorDeleteModal({ sensor, onClose, onDeleted }: { sensor: Sensor | null; onClose: () => void; onDeleted?: (id: string) => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const remove = useMutation({
    mutationFn: (id: string) => deleteSensor(id).then(() => id),
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: keys.sensor(id) });
      void qc.invalidateQueries({ queryKey: keys.sensors });
      void qc.invalidateQueries({ queryKey: ['stats'] });
      toast.success(`Sensor ${id} excluído.`);
      onDeleted?.(id);
      close();
    },
  });
  const deactivate = useMutation({
    mutationFn: (id: string) => updateSensor(id, { active: false }),
    onSuccess: (s) => {
      void qc.invalidateQueries({ queryKey: keys.sensors });
      toast.success(`Sensor ${s.id} desativado. O histórico foi mantido.`);
      close();
    },
  });
  const close = () => {
    remove.reset();
    deactivate.reset();
    onClose();
  };
  const hasHistory = (sensor?.analysesCount ?? 0) > 0;
  const error = remove.error ?? deactivate.error;

  return (
    <Modal open={!!sensor} onClose={close} label="Excluir sensor" size="sm">
      {sensor && (
        <div className="modal-body">
          <h2 className="modal-title">
            Excluir o sensor {sensor.id} — {sensor.name}?
          </h2>
          <p className="muted small">
            {sensor.block} · {sensor.location}
          </p>
          {hasHistory ? (
            <p>
              Este sensor tem <strong>{formatNumber(sensor.analysesCount)} análise(s)</strong> no histórico e por isso não pode ser excluído. Para que ele deixe de aparecer como
              ativo sem perder o histórico, desative-o.
            </p>
          ) : (
            <p>
              O cadastro, as medições ambientais e a telemetria do dispositivo serão removidos definitivamente, e o token do dispositivo deixará de funcionar. A exclusão fica
              registrada na auditoria.
            </p>
          )}
          {error && (
            <div className="form-error" role="alert">
              {errorMessage(error)}
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={close}>
              Cancelar
            </button>
            {hasHistory ? (
              sensor.active && (
                <button className="btn btn-primary" onClick={() => deactivate.mutate(sensor.id)} disabled={deactivate.isPending}>
                  {deactivate.isPending ? <span className="spinner" aria-hidden="true" /> : <Pause />} Desativar sensor
                </button>
              )
            ) : (
              <button className="btn btn-danger" onClick={() => remove.mutate(sensor.id)} disabled={remove.isPending}>
                {remove.isPending ? <span className="spinner" aria-hidden="true" /> : <Trash2 />} Excluir definitivamente
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
