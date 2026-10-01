/**
 * Cliente HTTP da API OASIS.
 * - Em desenvolvimento, `/api` é encaminhado pelo Vite para a API (vite.config.ts).
 * - Em produção, `VITE_API_URL` aponta para o endereço da API; vazio = mesma origem.
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const API_BASE = `${API_URL}/api/v1`;

const TOKEN_KEY = 'oasis.token';
const REQUEST_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  status: number;
  errors: string[];
  constructor(status: number, message: string, errors: string[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

/* --------------------------------------------------------------- token de sessão */
let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    /* armazenamento indisponível: sessão só em memória */
  }
  return memoryToken;
}

export function setToken(token: string | null) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Disparado quando a API recusa o token (sessão expirada, usuário desativado). */
export const UNAUTHORIZED_EVENT = 'oasis:unauthorized';

/* --------------------------------------------------------------- requisições */
type Query = Record<string, string | number | boolean | null | undefined | string[]>;

export function buildQuery(params?: Query): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length) qs.set(k, v.join(','));
    } else qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

const STATUS_MESSAGE: Record<number, string> = {
  401: 'Sua sessão expirou. Entre novamente.',
  403: 'Seu perfil não tem permissão para esta ação.',
  404: 'Registro não encontrado.',
  413: 'Arquivo grande demais.',
  429: 'Muitas tentativas. Aguarde alguns minutos.',
  500: 'Erro interno no servidor.',
  502: 'A API não está respondendo.',
  503: 'Serviço temporariamente indisponível.',
};

async function toError(res: Response): Promise<ApiError> {
  let detail: unknown;
  try {
    detail = await res.json();
  } catch {
    detail = null;
  }
  const body = (detail ?? {}) as { detail?: unknown; errors?: unknown };
  const message = typeof body.detail === 'string' ? body.detail : (STATUS_MESSAGE[res.status] ?? `Erro ${res.status}`);
  const errors = Array.isArray(body.errors) ? body.errors.map(String) : [];
  return new ApiError(res.status, message, errors);
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  query?: Query;
  body?: unknown;
  /** Não dispara o evento de sessão expirada (ex.: tela de login). */
  anonymous?: boolean;
}

export async function request(path: string, opts: RequestOptions = {}): Promise<Response> {
  const { query, body, anonymous, headers, ...init } = opts;
  const token = getToken();
  const isForm = body instanceof FormData;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (init.signal) init.signal.addEventListener('abort', () => controller.abort());
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
      ...init,
      signal: controller.signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      headers: {
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token && !anonymous ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (e) {
    if (init.signal?.aborted) throw e;
    const timedOut = controller.signal.aborted;
    throw new ApiError(0, timedOut ? 'A API demorou demais para responder. Tente novamente.' : 'Não foi possível conectar à API OASIS. Verifique se o servidor está em execução.');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const err = await toError(res);
    if (res.status === 401 && token && !anonymous) window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    throw err;
  }
  return res;
}

export async function http<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await request(path, opts);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Baixa um arquivo autenticado (CSV de exportação, modelos de importação). */
export async function download(path: string, fallbackName: string, query?: Query): Promise<void> {
  const res = await request(path, { query });
  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') ?? '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* --------------------------------------------------------------- imagens autenticadas */
const imageCache = new Map<string, Promise<string>>();
const IMAGE_CACHE_LIMIT = 150;

/** URL local (blob:) de uma imagem protegida da API, com cache para evitar downloads repetidos. */
export function imageObjectUrl(apiPath: string): Promise<string> {
  const cached = imageCache.get(apiPath);
  if (cached) return cached;
  const relative = apiPath.startsWith('/api/v1') ? apiPath.slice('/api/v1'.length) : apiPath;
  const promise = request(relative)
    .then((res) => res.blob())
    .then((blob) => URL.createObjectURL(blob));
  promise.catch(() => imageCache.delete(apiPath));
  imageCache.set(apiPath, promise);
  if (imageCache.size > IMAGE_CACHE_LIMIT) {
    const [oldest] = imageCache.keys();
    imageCache.get(oldest)?.then((u) => URL.revokeObjectURL(u)).catch(() => undefined);
    imageCache.delete(oldest);
  }
  return promise;
}

export function clearImageCache() {
  for (const p of imageCache.values()) p.then((u) => URL.revokeObjectURL(u)).catch(() => undefined);
  imageCache.clear();
}
