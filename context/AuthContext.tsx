'use client';

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo
} from 'react';
import { authTransporter } from '../services/transporters/auth/authTransporter';
import { User, AuthTokens, UserRole } from '../types/auth.types';

interface AuthContextType {
  user: User | null;
  users: User[];
  tokens: AuthTokens | null;
  login: (email: string, password?: string, areaBlock?: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUsers = useCallback(async () => {
    const allUsers = await authTransporter.getUsers();
    setUsers(allUsers);
  }, []);

  const login = useCallback(async (email: string, password = 'password', areaBlock?: string) => {
    const res = await authTransporter.login({ email, password, areaBlock });
    setUser(res.user);
    setTokens(res.tokens);
  }, []);

  const switchUser = useCallback(async (userId: string) => {
    const allUsers = await authTransporter.getUsers();
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setUser(target);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vvp_hk_current_user', JSON.stringify(target));
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await authTransporter.logout();
    setUser(null);
    setTokens(null);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user]);

  const addUser = useCallback(async (newUser: Omit<User, 'id'>) => {
    const allUsers = await authTransporter.getUsers();
    const created: User = {
      ...newUser,
      id: `user-${Date.now()}`
    };
    const updated = [...allUsers, created];
    await authTransporter.saveUsers(updated);
    setUsers(updated);
  }, []);

  const updateUser = useCallback(async (updatedUser: User) => {
    const allUsers = await authTransporter.getUsers();
    const updated = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    await authTransporter.saveUsers(updated);
    setUsers(updated);
    if (user?.id === updatedUser.id) {
      setUser(updatedUser);
    }
  }, [user]);

  const deleteUser = useCallback(async (userId: string) => {
    const allUsers = await authTransporter.getUsers();
    const updated = allUsers.filter(u => u.id !== userId);
    await authTransporter.saveUsers(updated);
    setUsers(updated);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const allUsers = await authTransporter.getUsers();
      setUsers(allUsers);
      const currentUser = await authTransporter.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setTokens({
          accessToken: 'jwt_init_token',
          refreshToken: 'refresh_init_token',
          expiresIn: 3600
        });
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = useMemo(() => ({
    user,
    users,
    tokens,
    login,
    switchUser,
    logout,
    isAuthenticated: !!user,
    loading,
    hasRole,
    refreshUsers,
    addUser,
    updateUser,
    deleteUser
  }), [user, users, tokens, login, switchUser, logout, loading, hasRole, refreshUsers, addUser, updateUser, deleteUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
