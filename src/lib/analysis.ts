/**
 * Origem do resultado, deduzida da versão de análise gravada pela API (`modelVersion`).
 * - cluster: modelo YOLO de cachos (treinado com o Embrapa WGISD) + análise de cor dentro dos cachos;
 * - yolo: modelo YOLO completo (variedades e anomalias);
 * - color: somente análise de cor.
 */
export type AnalysisKind = 'cluster' | 'yolo' | 'color' | 'import' | 'demo' | 'other';

export function analysisKind(modelVersion: string): AnalysisKind {
  const v = modelVersion.toLowerCase();
  if (v.startsWith('yolo cachos')) return 'cluster';
  if (v.startsWith('yolo')) return 'yolo';
  if (v.includes('análise de cor')) return 'color';
  if (v.startsWith('importado')) return 'import';
  if (v.includes('demonstra')) return 'demo';
  return 'other';
}

/** Rótulo honesto para a variedade: só o YOLO treinado identifica a uva pela imagem. */
export const VARIETY_ROW_LABEL: Record<AnalysisKind, string> = {
  cluster: 'Variedade (cadastro do talhão)',
  yolo: 'Uva identificada',
  color: 'Variedade (cadastro do talhão)',
  import: 'Variedade (informada no arquivo)',
  demo: 'Variedade (dado sintético)',
  other: 'Variedade',
};

export const DETECTOR_LABEL: Record<string, string> = {
  color: 'Análise de cor (HSV)',
  yolo: 'Modelo YOLO treinado',
};

/** Rótulo da confiança exibida: probabilidade do modelo ou índice da regra de cor. */
export const CONFIDENCE_LABEL: Record<AnalysisKind, string> = {
  cluster: 'Confiança do modelo (cacho principal)',
  yolo: 'Confiança do modelo',
  color: 'Índice da análise de cor',
  import: 'Confiança (informada no arquivo)',
  demo: 'Confiança (dado sintético)',
  other: 'Confiança',
};

/** Origem de cada detecção, para o usuário saber o que é previsão do modelo e o que é regra. */
export function detectionSource(kind: AnalysisKind, detectionKind: 'cacho' | 'anomalia'): string {
  if (kind === 'cluster') return detectionKind === 'cacho' ? 'Modelo YOLO' : 'Análise de cor';
  if (kind === 'yolo') return 'Modelo YOLO';
  if (kind === 'color') return 'Análise de cor';
  if (kind === 'import') return 'Arquivo importado';
  if (kind === 'demo') return 'Sintético';
  return '—';
}

/** Comparação entre a variedade prevista pela foto e a cadastrada no talhão. */
export type VarietyAgreement = 'confere' | 'diverge' | 'fora_catalogo' | 'baixa_confianca';

export function varietyAgreement(predicted: string, confidence: number, plotVarietyId: string, catalogIds: readonly string[]): VarietyAgreement {
  if (confidence < 0.5) return 'baixa_confianca';
  const id = predicted.replace(/_/g, '-');
  if (!catalogIds.includes(id)) return 'fora_catalogo';
  return id === plotVarietyId ? 'confere' : 'diverge';
}

export const AGREEMENT_TEXT: Record<VarietyAgreement, string> = {
  confere: 'Confere com o talhão',
  diverge: 'Diferente do talhão — vale conferir em campo',
  fora_catalogo: 'Variedade fora do catálogo da OASIS',
  baixa_confianca: 'Baixa confiança — previsão incerta',
};
