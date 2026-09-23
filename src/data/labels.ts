import type { Classification, Maturation, PipelineStage, Quality, Role, SensorStatus } from './types';

export const QUALITY_LABEL: Record<Quality, string> = {
  boa: 'Boa',
  atencao: 'Atenção',
  critica: 'Necessita atenção',
};

export const QUALITY_ORDER: Quality[] = ['boa', 'atencao', 'critica'];

/** Cores de status — separadas da identidade institucional (vinho/rosa/branco). */
export const QUALITY_COLOR: Record<Quality, string> = {
  boa: '#1f9d55',
  atencao: '#e0a100',
  critica: '#d64545',
};

export const CLASSIFICATION_BY_QUALITY: Record<Quality, Classification> = {
  boa: 'APROVADA',
  atencao: 'EM OBSERVAÇÃO',
  critica: 'REVISÃO NECESSÁRIA',
};

export const SENSOR_STATUS_LABEL: Record<SensorStatus, string> = {
  online: 'Online',
  atencao: 'Atenção',
  offline: 'Offline',
};

export const MATURATION_LABEL: Record<Maturation, string> = {
  desenvolvimento: 'Em desenvolvimento',
  pintor: 'Pintor (véraison)',
  maturacao: 'Em maturação',
  adequada: 'Adequada',
  sobrematuracao: 'Sobrematuração',
};

export const MATURATION_ORDER: Maturation[] = ['desenvolvimento', 'pintor', 'maturacao', 'adequada', 'sobrematuracao'];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  recebida: 'Imagem recebida',
  processando: 'Processando',
  analisando: 'Analisando',
  concluida: 'Resultado disponível',
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  operador: 'Operador',
};
