import type { Classification, ImportKind, Maturation, PipelineStage, Quality, ReadingSource, Role, SensorStatus } from './types';

export const QUALITY_LABEL: Record<Quality, string> = {
  boa: 'Boa',
  atencao: 'Atenção',
  critica: 'Necessita atenção',
};

export const QUALITY_ORDER: Quality[] = ['boa', 'atencao', 'critica'];

/** Cores de status — separadas da identidade institucional (vinho/rosa/branco). */
export const QUALITY_COLOR: Record<Quality, string> = {
  boa: '#1f9d55',
  atencao: '#d99a00',
  critica: '#d64545',
};

export const CLASSIFICATIONS: Classification[] = ['APROVADA', 'EM OBSERVAÇÃO', 'REVISÃO NECESSÁRIA'];

export const CLASSIFICATION_BY_QUALITY: Record<Quality, Classification> = {
  boa: 'APROVADA',
  atencao: 'EM OBSERVAÇÃO',
  critica: 'REVISÃO NECESSÁRIA',
};

export const SENSOR_STATUS_LABEL: Record<SensorStatus, string> = {
  online: 'Online',
  atencao: 'Atenção',
  offline: 'Offline',
  inativo: 'Inativo',
};

export const MATURATION_LABEL: Record<Maturation, string> = {
  desenvolvimento: 'Em desenvolvimento',
  pintor: 'Pintor (véraison)',
  maturacao: 'Em maturação',
  adequada: 'Adequada',
  sobrematuracao: 'Sobrematuração',
  nao_informada: 'Não informada',
};

/** Estágios em ordem fenológica (sem "não informada"). */
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

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Acesso total: usuários, sensores, importação e configurações',
  gestor: 'Painel, sensores, análises, histórico e importação de dados',
  operador: 'Envio de imagens, análises, classificação e histórico',
};

export const SOURCE_LABEL: Record<ReadingSource, string> = {
  sensor: 'Sensor',
  upload: 'Envio manual',
  importacao: 'Importação',
  demonstracao: 'Demonstração',
};

export const IMPORT_KIND_LABEL: Record<ImportKind, string> = {
  readings: 'Leituras históricas',
  sensors: 'Cadastro de sensores',
  environment: 'Medições ambientais',
};

export const IMPORT_STATUS_LABEL: Record<string, string> = {
  concluida: 'Concluída',
  parcial: 'Parcial',
  sem_alteracoes: 'Sem alterações',
  falhou: 'Falhou',
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  login: 'Login',
  login_falhou: 'Login recusado',
  login_bloqueado: 'Login bloqueado',
  senha_alterada: 'Senha alterada',
  senha_redefinida: 'Senha redefinida',
  usuario_criado: 'Usuário criado',
  usuario_alterado: 'Usuário alterado',
  sensor_criado: 'Sensor cadastrado',
  sensor_alterado: 'Sensor alterado',
  token_sensor_regenerado: 'Token do sensor gerado',
  importacao: 'Importação',
  importacao_falhou: 'Importação recusada',
  leitura_excluida: 'Leitura excluída',
};

export const ANOMALY_LABEL: Record<string, string> = {
  maturacao_desigual: 'Maturação desigual',
  baga_irregular: 'Bagas irregulares',
  mancha_leve: 'Manchas leves',
  podridao: 'Sinais de podridão',
  baga_murcha: 'Bagas desidratadas',
  lesao: 'Lesões visíveis',
};

export const SEVERE_ANOMALIES = new Set(['podridao', 'baga_murcha', 'lesao']);
