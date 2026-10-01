import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../data/types';
import { queryClient } from '../lib/queryClient';
import { ACCESS, login as apiLogin, me, type Area } from '../services/api';
import { clearImageCache, getToken, setToken, UNAUTHORIZED_EVENT } from '../services/http';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthValue {
  user: User | null;
  status: AuthStatus;
  /** Motivo do último encerramento de sessão (ex.: token expirado). */
  notice: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: (notice?: string) => void;
  refresh: () => Promise<void>;
  can: (area: Area) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'checking' : 'anonymous'));
  const [notice, setNotice] = useState<string | null>(null);

  const logout = useCallback((reason?: string) => {
    setToken(null);
    setUser(null);
    setStatus('anonymous');
    setNotice(reason ?? null);
    queryClient.clear();
    clearImageCache();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const u = await me();
      setUser(u);
      setStatus('authenticated');
    } catch {
      logout();
    }
  }, [logout]);

  // Valida o token salvo ao abrir a aplicação.
  useEffect(() => {
    if (getToken()) void refresh();
  }, [refresh]);

  // A API recusou o token em qualquer requisição: encerra a sessão.
  useEffect(() => {
    const onUnauthorized = () => logout('Sua sessão expirou ou foi encerrada. Entre novamente.');
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    queryClient.clear();
    setUser(u);
    setStatus('authenticated');
    setNotice(null);
    return u;
  }, []);

  const can = useCallback((area: Area) => !!user && (ACCESS[area] as readonly string[]).includes(user.role), [user]);

  const value = useMemo(() => ({ user, status, notice, login, logout, refresh, can }), [user, status, notice, login, logout, refresh, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
