import type { Detection, Maturation, Quality, VarietyId } from '../../data/types';

/**
 * Exemplos ILUSTRATIVOS usados apenas na página inicial para explicar o fluxo de análise.
 * Não são leituras registradas e não entram em nenhum indicador; a interface os identifica como ilustração.
 */
export interface IllustrativeExample {
  key: string;
  varietyId: VarietyId;
  quality: Quality;
  confidence: number;
  maturation: Maturation;
  visualCondition: string;
  classification: 'APROVADA' | 'EM OBSERVAÇÃO' | 'REVISÃO NECESSÁRIA';
  detections: Detection[];
  seed: number;
}

const cluster = (label: string, confidence: number): Detection => ({ kind: 'cacho', label, confidence, box: [0.31, 0.15, 0.37, 0.64] });

export const EXAMPLES: IllustrativeExample[] = [
  { key: 'ex1', varietyId: 'cabernet-sauvignon', quality: 'boa', confidence: 0.94, maturation: 'adequada', visualCondition: 'Boa', classification: 'APROVADA', detections: [cluster('cabernet_sauvignon', 0.94)], seed: 11 },
  {
    key: 'ex2',
    varietyId: 'syrah',
    quality: 'atencao',
    confidence: 0.88,
    maturation: 'pintor',
    visualCondition: 'Maturação desigual',
    classification: 'EM OBSERVAÇÃO',
    detections: [cluster('syrah', 0.88), { kind: 'anomalia', label: 'maturacao_desigual', confidence: 0.74, box: [0.42, 0.42, 0.08, 0.1] }],
    seed: 23,
  },
  { key: 'ex3', varietyId: 'moscato-canelli', quality: 'boa', confidence: 0.91, maturation: 'adequada', visualCondition: 'Boa', classification: 'APROVADA', detections: [cluster('moscato_canelli', 0.91)], seed: 37 },
  {
    key: 'ex4',
    varietyId: 'chenin-blanc',
    quality: 'critica',
    confidence: 0.83,
    maturation: 'maturacao',
    visualCondition: 'Sinais de podridão',
    classification: 'REVISÃO NECESSÁRIA',
    detections: [cluster('chenin_blanc', 0.83), { kind: 'anomalia', label: 'podridao', confidence: 0.79, box: [0.4, 0.5, 0.08, 0.1] }],
    seed: 41,
  },
];
