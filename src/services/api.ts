import { generateDemoData, type DemoData } from '../data/generate';
import type { Reading, Role, Sensor, User } from '../data/types';

/**
 * Camada de acesso a dados.
 * - Sem `VITE_API_URL`: modo demonstração, com dados simulados gerados no navegador.
 * - Com `VITE_API_URL`: consome a API FastAPI da OSAIS (repositório Vinicola-back),
 *   que expõe exatamente o mesmo contrato (camelCase) usado aqui.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const isApiMode = API_URL.length > 0;

const TOKEN_KEY = 'osais.token';

function authHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...authHeaders(), ...init.headers },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    const err = new Error((detail as { detail?: string }).detail ?? `Erro ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

export type DataSource = 'demo' | 'api';

export async function loadData(): Promise<DemoData & { source: DataSource }> {
  if (isApiMode) {
    try {
      const [sensors, readings] = await Promise.all([http<Sensor[]>('/sensors'), http<Reading[]>('/readings?days=31&limit=10000')]);
      return { sensors, readings, source: 'api' };
    } catch (e) {
      // API com leitura restrita (PUBLIC_READ=false): sem login, os dados ficam vazios até autenticar.
      if ((e as { status?: number }).status === 401) return { sensors: [], readings: [], source: 'api' };
      throw e;
    }
  }
  return { ...generateDemoData(new Date()), source: 'demo' };
}

/** Pede à API uma leitura simulada do sensor (demonstração do pipeline sem hardware). */
export async function simulateRemote(sensorId: string): Promise<Reading> {
  return http<Reading>(`/simulate/${encodeURIComponent(sensorId)}`, { method: 'POST' });
}

/** Envia uma imagem para o endpoint de ingestão (mesmo fluxo usado pelo ESP32/edge). */
export async function uploadImage(sensorId: string, file: Blob): Promise<Reading> {
  const form = new FormData();
  form.append('sensor_id', sensorId);
  form.append('image', file, 'captura.jpg');
  return http<Reading>('/ingest', { method: 'POST', body: form });
}

export function resolveImageUrl(reading: Reading): string | undefined {
  if (!reading.imageUrl) return undefined;
  if (/^(https?:|blob:|data:)/.test(reading.imageUrl)) return reading.imageUrl;
  return `${API_URL}${reading.imageUrl}`;
}

/* ------------------------------ Autenticação ------------------------------ */

export const DEMO_PASSWORD = 'osais2026';

export const DEMO_USERS: (User & { description: string })[] = [
  { name: 'Ana Ribeiro', email: 'admin@osais.agr.br', role: 'admin', description: 'Acesso total à plataforma' },
  { name: 'Carlos Menezes', email: 'gestor@osais.agr.br', role: 'gestor', description: 'Dashboard, sensores, análises e histórico' },
  { name: 'Júlia Santos', email: 'operador@osais.agr.br', role: 'operador', description: 'Leituras, imagens e resultados das análises' },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(email: string, password: string): Promise<User> {
  if (isApiMode) {
    const res = await http<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    try {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
    } catch {
      /* armazenamento indisponível */
    }
    return res.user;
  }
  await wait(650);
  const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || password !== DEMO_PASSWORD) throw new Error('E-mail ou senha inválidos.');
  return { name: user.name, email: user.email, role: user.role };
}

export async function requestPasswordReset(email: string): Promise<void> {
  if (isApiMode) {
    await http('/auth/recover', { method: 'POST', body: JSON.stringify({ email }) });
    return;
  }
  await wait(900);
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Informe um e-mail válido.');
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Matriz de permissões por perfil. */
export const ACCESS: Record<'dashboard' | 'sensores' | 'analises' | 'historico' | 'integracoes', Role[]> = {
  dashboard: ['admin', 'gestor'],
  sensores: ['admin', 'gestor'],
  analises: ['admin', 'gestor', 'operador'],
  historico: ['admin', 'gestor', 'operador'],
  integracoes: ['admin'],
};

export type Area = keyof typeof ACCESS;
