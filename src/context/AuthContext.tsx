import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../data/types';
import { ACCESS, clearToken, login as apiLogin, type Area } from '../services/api';

interface AuthValue {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  can: (area: Area) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);
const SESSION_KEY = 'osais.session';

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readSession);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    } catch {
      /* sessão só em memória */
    }
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearToken();
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const can = useCallback((area: Area) => !!user && ACCESS[area].includes(user.role), [user]);

  const value = useMemo(() => ({ user, login, logout, can }), [user, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
