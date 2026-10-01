import { describe, expect, it } from 'vitest';
import { buildQuery } from '../services/http';
import { periodQuery, pointsChange, relativeChange } from './period';

describe('periodQuery', () => {
  it('converte períodos predefinidos em dias', () => {
    expect(periodQuery('7')).toEqual({ days: 7 });
    expect(periodQuery('1')).toEqual({ days: 1 });
  });
  it('usa datas no período personalizado', () => {
    expect(periodQuery('custom', '2026-09-01', '2026-09-10')).toEqual({ dateFrom: '2026-09-01', dateTo: '2026-09-10', days: undefined });
  });
  it('sem data inicial, o personalizado abrange todo o histórico até a data final', () => {
    expect(periodQuery('custom', '', '2026-09-10')).toEqual({ dateFrom: undefined, dateTo: '2026-09-10', days: 3650 });
  });
});

describe('variações', () => {
  it('não inventa variação sem base de comparação', () => {
    expect(relativeChange(10, 0)).toBeNull();
    expect(relativeChange(10, null)).toBeNull();
    expect(pointsChange(0.8, null)).toBeNull();
  });
  it('calcula variação relativa e em pontos', () => {
    expect(relativeChange(15, 10)).toBeCloseTo(0.5);
    expect(pointsChange(0.8, 0.75)).toBeCloseTo(0.05);
  });
});

describe('buildQuery', () => {
  it('omite vazios e junta listas', () => {
    expect(buildQuery({ days: 7, q: '', sensorId: undefined, quality: ['boa', 'critica'] })).toBe('?days=7&quality=boa%2Ccritica');
    expect(buildQuery({ quality: [] })).toBe('');
  });
});
