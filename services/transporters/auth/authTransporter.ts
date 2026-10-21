import { User, AuthResponse, LoginFormData } from '../../../types/auth.types';
import { INITIAL_STAFF } from '../../../config/hotelData';

const STORAGE_USERS_KEY = 'vvp_hk_staff_users';
const STORAGE_CURRENT_USER_KEY = 'vvp_hk_current_user';

export const authTransporter = {
  /**
   * Obtém a lista atual de utilizadores do hotel (fixas, rotativas, extras, etc.)
   */
  getUsers: async (): Promise<User[]> => {
    if (typeof window === 'undefined') return INITIAL_STAFF;
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_STAFF));
      return INITIAL_STAFF;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_STAFF;
    }
  },

  /**
   * Salva/atualiza lista de utilizadores
   */
  saveUsers: async (users: User[]): Promise<User[]> => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
    return users;
  },

  /**
   * Login do utilizador
   */
  login: async (credentials: LoginFormData): Promise<AuthResponse> => {
    const users = await authTransporter.getUsers();
    // Procura por email ou ID ou área
    const matched = users.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase() ||
      u.id.toLowerCase() === credentials.email.toLowerCase() ||
      (credentials.areaBlock && u.assignedArea?.toLowerCase().includes(credentials.areaBlock.toLowerCase()))
    ) || users[0];

    const tokens = {
      accessToken: `jwt_vvp_${matched.id}_${Date.now()}`,
      refreshToken: `refresh_vvp_${matched.id}`,
      expiresIn: 3600
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(matched));
    }

    return {
      user: matched,
      tokens
    };
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  },

  /**
   * Obter utilizador atual
   */
  getCurrentUser: async (): Promise<User | null> => {
    if (typeof window === 'undefined') return INITIAL_STAFF[0];
    const stored = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (!stored) return INITIAL_STAFF[0];
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_STAFF[0];
    }
  }
};
