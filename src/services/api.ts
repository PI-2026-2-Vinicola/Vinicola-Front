import type {
  AuditEntry,
  Bucket,
  EnvironmentDay,
  EnvironmentPoint,
  Group,
  ImportJob,
  ImportKind,
  ImportPreview,
  Page,
  PublicOverview,
  Quality,
  Reading,
  Role,
  Sensor,
  SensorInput,
  Summary,
  SystemStatus,
  TelemetryPoint,
  User,
} from '../data/types';
import { download, http, setToken } from './http';

/* ------------------------------------------------------------------ filtros comuns */
/** Filtros aceitos por /readings, /readings/export e /stats/* (todos opcionais). */
export interface ReadingQuery {
  days?: number;
  dateFrom?: string;
  dateTo?: string;
  sensorId?: string;
  varietyId?: string;
  quality?: Quality[];
  classification?: string;
  maturation?: string;
  block?: string;
  source?: string;
  q?: string;
}

export type ReadingSort = 'recentes' | 'antigas' | 'confianca_desc' | 'confianca_asc';

const query = (f: ReadingQuery = {}) => ({ ...f, quality: f.quality });

/* ------------------------------------------------------------------ autenticação e conta */
export async function login(email: string, password: string): Promise<User> {
  const res = await http<{ accessToken: string; expiresIn: number; user: User }>('/auth/login', {
    method: 'POST',
    body: { email: email.trim(), password },
    anonymous: true,
  });
  setToken(res.accessToken);
  return res.user;
}

export const me = () => http<User>('/auth/me');
export const changePassword = (currentPassword: string, newPassword: string) =>
  http<void>('/auth/password', { method: 'POST', body: { currentPassword, newPassword } });

/* ------------------------------------------------------------------ usuários */
export const listUsers = () => http<User[]>('/users');
export const createUser = (data: { name: string; email: string; role: Role; password: string }) => http<User>('/users', { method: 'POST', body: data });
export const updateUser = (id: number, data: Partial<{ name: string; role: Role; isActive: boolean; password: string }>) =>
  http<User>(`/users/${id}`, { method: 'PATCH', body: data });

/* ------------------------------------------------------------------ sensores */
export const listSensors = () => http<Sensor[]>('/sensors');
export const getSensor = (id: string) => http<Sensor>(`/sensors/${encodeURIComponent(id)}`);
export const createSensor = (data: SensorInput & { id: string }) => http<{ sensor: Sensor; deviceToken: string }>('/sensors', { method: 'POST', body: data });
export const updateSensor = (id: string, data: Partial<SensorInput> & { active?: boolean; clearLocation?: boolean }) =>
  http<Sensor>(`/sensors/${encodeURIComponent(id)}`, { method: 'PATCH', body: data });
export const regenerateSensorToken = (id: string) => http<{ sensor: Sensor; deviceToken: string }>(`/sensors/${encodeURIComponent(id)}/token`, { method: 'POST' });
export const sensorEnvironment = (id: string, period: Pick<ReadingQuery, 'days' | 'dateFrom' | 'dateTo'>) =>
  http<EnvironmentPoint[]>(`/sensors/${encodeURIComponent(id)}/environment`, { query: { ...period, days: period.days ? Math.min(period.days, 366) : undefined } });
export const sensorTelemetry = (id: string, days: number) => http<TelemetryPoint[]>(`/sensors/${encodeURIComponent(id)}/telemetry`, { query: { days } });
export const addEnvironment = (id: string, data: { measuredAt?: string; temperatureC?: number | null; humidityPct?: number | null; luminosityLux?: number | null; soilMoisturePct?: number | null }) =>
  http<void>(`/sensors/${encodeURIComponent(id)}/environment`, { method: 'POST', body: data });

/* ------------------------------------------------------------------ leituras e envio de imagens */
export const listReadings = (f: ReadingQuery, page = 1, pageSize = 25, sort: ReadingSort = 'recentes') =>
  http<Page<Reading>>('/readings', { query: { ...query(f), page, pageSize, sort } });
export const getReading = (code: string) => http<Reading>(`/readings/${encodeURIComponent(code)}`);
export const deleteReading = (code: string) => http<void>(`/readings/${encodeURIComponent(code)}`, { method: 'DELETE' });
export const exportReadings = (f: ReadingQuery) => download('/readings/export', 'oasis-leituras.csv', query(f));

export function uploadImage(sensorId: string, file: File, capturedAt?: string): Promise<Reading> {
  const form = new FormData();
  form.append('sensor_id', sensorId);
  form.append('image', file, file.name);
  if (capturedAt) form.append('captured_at', capturedAt);
  return http<Reading>('/ingest', { method: 'POST', body: form });
}

/* ------------------------------------------------------------------ indicadores */
export const getSummary = (f: ReadingQuery) => http<Summary>('/stats/summary', { query: query(f) });
export const getByDay = (f: ReadingQuery) => http<Bucket[]>('/stats/by-day', { query: query(f) });
export const getByHour = (f: ReadingQuery) => http<Bucket[]>('/stats/by-hour', { query: query(f) });
export type BreakdownBy = 'sensor' | 'variety' | 'maturation' | 'classification' | 'source' | 'block';
export const getBreakdown = (by: BreakdownBy, f: ReadingQuery) => http<Group[]>('/stats/breakdown', { query: { ...query(f), by } });
export const getEnvironmentDaily = (f: ReadingQuery) => http<EnvironmentDay[]>('/stats/environment', { query: query(f) });
export const getPublicOverview = () => http<PublicOverview>('/public/overview', { anonymous: true });

/* ------------------------------------------------------------------ importação */
function importForm(kind: ImportKind, file: File, extra: Record<string, string> = {}) {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file, file.name);
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return form;
}
export const previewImport = (kind: ImportKind, file: File) => http<ImportPreview>('/imports/preview', { method: 'POST', body: importForm(kind, file) });
export const runImport = (kind: ImportKind, file: File, onDuplicate: 'skip' | 'update') =>
  http<ImportJob>('/imports', { method: 'POST', body: importForm(kind, file, { onDuplicate }) });
export const listImports = () => http<ImportJob[]>('/imports');
export const downloadTemplate = (kind: ImportKind) => download(`/imports/templates/${kind}`, `oasis-modelo-${kind}.csv`);

/* ------------------------------------------------------------------ administração */
export const getSystemStatus = () => http<SystemStatus>('/system/status');
export const getAudit = (page = 1, action?: string) => http<Page<AuditEntry>>('/audit', { query: { page, pageSize: 30, action } });

/* ------------------------------------------------------------------ permissões (espelho das regras da API) */
export const ACCESS = {
  dashboard: ['admin', 'gestor'],
  sensores: ['admin', 'gestor'],
  analises: ['admin', 'gestor', 'operador'],
  classificacao: ['admin', 'gestor', 'operador'],
  historico: ['admin', 'gestor', 'operador'],
  importacao: ['admin', 'gestor'],
  administracao: ['admin'],
  gerenciarSensores: ['admin'],
  excluirLeituras: ['admin'],
  medicoesManuais: ['admin', 'gestor'],
} satisfies Record<string, Role[]>;

export type Area = keyof typeof ACCESS;

/** Primeira página após o login, conforme o perfil. */
export const homeFor = (role: Role) => (role === 'operador' ? '/analises' : '/dashboard');
