import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as api from '../services/api';
import type { BreakdownBy, ReadingQuery, ReadingSort } from '../services/api';

/** Chaves de cache — invalidar `['readings']` ou `['stats']` atualiza todas as telas dependentes. */
export const keys = {
  sensors: ['sensors'] as const,
  sensor: (id: string) => ['sensors', id] as const,
  readings: (f: ReadingQuery, page: number, size: number, sort: ReadingSort) => ['readings', f, page, size, sort] as const,
  reading: (code: string) => ['readings', 'detail', code] as const,
  stats: (kind: string, f: ReadingQuery) => ['stats', kind, f] as const,
};

export const useSensors = () => useQuery({ queryKey: keys.sensors, queryFn: api.listSensors, refetchInterval: 60_000 });

export const useSensor = (id: string) => useQuery({ queryKey: keys.sensor(id), queryFn: () => api.getSensor(id), enabled: !!id, refetchInterval: 60_000 });

export const useReadings = (f: ReadingQuery, page = 1, pageSize = 25, sort: ReadingSort = 'recentes', enabled = true) =>
  useQuery({ queryKey: keys.readings(f, page, pageSize, sort), queryFn: () => api.listReadings(f, page, pageSize, sort), placeholderData: keepPreviousData, enabled });

export const useReading = (code: string) => useQuery({ queryKey: keys.reading(code), queryFn: () => api.getReading(code), enabled: !!code });

export const useSummary = (f: ReadingQuery) => useQuery({ queryKey: keys.stats('summary', f), queryFn: () => api.getSummary(f), placeholderData: keepPreviousData });

export const useByDay = (f: ReadingQuery, enabled = true) => useQuery({ queryKey: keys.stats('day', f), queryFn: () => api.getByDay(f), placeholderData: keepPreviousData, enabled });

export const useByHour = (f: ReadingQuery, enabled = true) => useQuery({ queryKey: keys.stats('hour', f), queryFn: () => api.getByHour(f), placeholderData: keepPreviousData, enabled });

export const useBreakdown = (by: BreakdownBy, f: ReadingQuery, enabled = true) =>
  useQuery({ queryKey: keys.stats(`breakdown-${by}`, f), queryFn: () => api.getBreakdown(by, f), placeholderData: keepPreviousData, enabled });

export const useEnvironmentDaily = (f: ReadingQuery, enabled = true) =>
  useQuery({ queryKey: keys.stats('environment', f), queryFn: () => api.getEnvironmentDaily(f), placeholderData: keepPreviousData, enabled });

export const useSensorEnvironment = (id: string, period: Pick<ReadingQuery, 'days' | 'dateFrom' | 'dateTo'>) =>
  useQuery({ queryKey: ['sensors', id, 'environment', period], queryFn: () => api.sensorEnvironment(id, period), enabled: !!id, placeholderData: keepPreviousData });

export const useSensorTelemetry = (id: string, days: number) =>
  useQuery({ queryKey: ['sensors', id, 'telemetry', days], queryFn: () => api.sensorTelemetry(id, days), enabled: !!id, placeholderData: keepPreviousData });

export const usePublicOverview = () => useQuery({ queryKey: ['public-overview'], queryFn: api.getPublicOverview, staleTime: 60_000, retry: 1 });

export const useImports = () => useQuery({ queryKey: ['imports'], queryFn: api.listImports });

export const useUsers = () => useQuery({ queryKey: ['users'], queryFn: api.listUsers });

export const useSystemStatus = () => useQuery({ queryKey: ['system-status'], queryFn: api.getSystemStatus });

export const useAudit = (page: number, action?: string) =>
  useQuery({ queryKey: ['audit', page, action], queryFn: () => api.getAudit(page, action), placeholderData: keepPreviousData });
