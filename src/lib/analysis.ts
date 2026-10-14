/** Origem do resultado, deduzida da versão de análise gravada pela API (`modelVersion`). */
export type AnalysisKind = 'yolo' | 'color' | 'import' | 'demo' | 'other';

export function analysisKind(modelVersion: string): AnalysisKind {
  const v = modelVersion.toLowerCase();
  if (v.startsWith('yolo')) return 'yolo';
  if (v.includes('análise de cor')) return 'color';
  if (v.startsWith('importado')) return 'import';
  if (v.includes('demonstra')) return 'demo';
  return 'other';
}

/** Rótulo honesto para a variedade: só o YOLO treinado identifica a uva pela imagem. */
export const VARIETY_ROW_LABEL: Record<AnalysisKind, string> = {
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
