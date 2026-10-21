import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authTransporter } from '@/services/transporters/auth/authTransporter';
import type { LoginFormData, User } from '@/types/auth.types';

// - Só a sessão. A lista de pessoal é um dado do servidor (hooks/staff), não estado de auth.
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginFormData) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback(async (credentials: LoginFormData) => {
    const response = await authTransporter.login(credentials);
    setUser(response.user);
  }, []);

  // - telemóveis partilhados: a responsável troca o utilizador ativo do dispositivo (§5.4)
  const switchUser = useCallback(async (userId: string) => {
    const next = await authTransporter.setSession(userId);
    if (next) setUser(next);
  }, []);

  const logout = useCallback(async () => {
    await authTransporter.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    void authTransporter
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, login, switchUser, logout }),
    [user, loading, login, switchUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
