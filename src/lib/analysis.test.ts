import { describe, expect, it } from 'vitest';
import { analysisKind, CONFIDENCE_LABEL, detectionSource, VARIETY_ROW_LABEL } from './analysis';

describe('origem do resultado da análise', () => {
  it('distingue o modelo de cachos, o YOLO completo e a análise de cor', () => {
    expect(analysisKind('YOLO cachos · OASIS Cachos 1.0.0 + OASIS análise de cor v1')).toBe('cluster');
    expect(analysisKind('YOLO · oasis-grapes.pt')).toBe('yolo');
    expect(analysisKind('OASIS análise de cor v1')).toBe('color');
    expect(analysisKind('Importado')).toBe('import');
    expect(analysisKind('Demonstração (sintético)')).toBe('demo');
  });

  it('não apresenta a variedade do talhão como identificada pelo modelo de cachos', () => {
    expect(VARIETY_ROW_LABEL.cluster).toBe('Variedade (cadastro do talhão)');
    expect(VARIETY_ROW_LABEL.yolo).toBe('Uva identificada');
    expect(CONFIDENCE_LABEL.color).toMatch(/Índice/);
  });

  it('indica se cada detecção veio do modelo ou da regra de cor', () => {
    expect(detectionSource('cluster', 'cacho')).toBe('Modelo YOLO');
    expect(detectionSource('cluster', 'anomalia')).toBe('Análise de cor');
    expect(detectionSource('color', 'cacho')).toBe('Análise de cor');
  });
});
