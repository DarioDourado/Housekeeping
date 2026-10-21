import { localServer } from '@/services/local-api/server';
import type { AuthResponse, LoginFormData, User } from '@/types/auth.types';

// - Sessão de demonstração: guarda só o id do utilizador. Com o BE: access token em memória + refresh em cookie
//   httpOnly (08-auth); nunca tokens em localStorage.
const SESSION_KEY = 'vvp_hk_session_v2';

const readSessionUserId = (): string | null => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};

export class InvalidCredentialsError extends Error {
  constructor() {
    super('login.errors.invalidCredentials');
  }
}

export const authTransporter = {
  // - ponytail: demonstração aceita qualquer password para um utilizador existente; o BE valida (argon2) e devolve 401
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    const wanted = credentials.email.toLowerCase();
    const matched = localServer.query().staff.find(user => user.email.toLowerCase() === wanted || user.id.toLowerCase() === wanted);
    if (!matched) throw new InvalidCredentialsError();

    localStorage.setItem(SESSION_KEY, matched.id);
    return {
      user: matched,
      tokens: { accessToken: `demo-${matched.id}`, refreshToken: `demo-refresh-${matched.id}`, expiresIn: 3600 }
    };
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const sessionId = readSessionUserId();
    return localServer.query().staff.find(user => user.id === sessionId) ?? null;
  },

  setSession: async (userId: string): Promise<User | null> => {
    const user = localServer.query().staff.find(candidate => candidate.id === userId) ?? null;
    if (user) localStorage.setItem(SESSION_KEY, user.id);
    return user;
  }
};
