import axios, { AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { z } from 'zod';

const userSchema = z.object({ id: z.string(), name: z.string(), email: z.email(), role: z.string() });
const sessionSchema = z.object({ accessToken: z.string().min(1), user: userSchema });
const tokenSchema = z.object({ accessToken: z.string().min(1) });
export type AuthUser = z.infer<typeof userSchema>;
type Request = InternalAxiosRequestConfig & { _retry?: boolean; _generation?: number };
type Options = {
  baseURL: string;
  adapter?: AxiosAdapter;
  clearPrivateData: () => void;
};

export function createAuthClient({ baseURL, adapter, clearPrivateData }: Options) {
  const config = { baseURL, withCredentials: true, timeout: 15_000, ...(adapter ? { adapter } : {}) };
  const api = axios.create(config);
  const authApi = axios.create(config);
  let generation = 0;
  let accessToken: string | null = null;
  let user: AuthUser | null = null;
  let controller = new AbortController();
  let refreshFlight: Promise<string> | null = null;
  let restoreFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  function clearSession() {
    generation++;
    controller.abort();
    controller = new AbortController();
    refreshFlight = null;
    restoreFlight = null;
    accessToken = null;
    user = null;
    clearPrivateData();
    notify();
  }

  function requireCurrent(expected: number) {
    if (expected !== generation) throw new axios.CanceledError('Session changed');
  }

  function refresh() {
    if (refreshFlight) return refreshFlight;
    const expected = generation;
    const flight = authApi.post('/auth/refresh', {}, { signal: controller.signal })
      .then(({ data }) => {
        requireCurrent(expected);
        const parsed = tokenSchema.parse(data);
        accessToken = parsed.accessToken;
        return accessToken;
      }).finally(() => {
        if (refreshFlight === flight) refreshFlight = null;
      });
    refreshFlight = flight;
    return flight;
  }

  api.interceptors.request.use((request: Request) => {
    if (request._generation !== undefined) requireCurrent(request._generation);
    request._generation = generation;
    request.signal ??= controller.signal;
    if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`);
    return request;
  });
  api.interceptors.response.use((response) => {
    requireCurrent((response.config as Request)._generation ?? generation);
    return response;
  }, async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.config) throw error;
    const request = error.config as Request;
    const expected = request._generation ?? generation;
    requireCurrent(expected);
    if (error.response?.status !== 401 || request._retry) throw error;
    request._retry = true;
    try {
      // A delayed 401 for an old token should reuse the token already refreshed.
      const sent = AxiosHeaders.from(request.headers).get('Authorization');
      const token = accessToken && sent !== `Bearer ${accessToken}` ? accessToken : await refresh();
      requireCurrent(expected);
      request.headers.set('Authorization', `Bearer ${token}`);
      return api(request);
    } catch (refreshError) {
      if (expected === generation) clearSession();
      throw refreshError;
    }
  });

  return {
    api,
    getAccessToken: () => accessToken,
    getUser: () => user,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    clearSession,
    async login(input: { email: string; password: string }) {
      clearSession();
      const expected = generation;
      const { data } = await authApi.post('/auth/login', input, { signal: controller.signal });
      requireCurrent(expected);
      const session = sessionSchema.parse(data);
      accessToken = session.accessToken;
      user = session.user;
      notify();
    },
    restore() {
      if (restoreFlight) return restoreFlight;
      const expected = generation;
      const flight = authApi.post('/auth/session', {}, { signal: controller.signal }).then(({ data }) => {
        requireCurrent(expected);
        const session = sessionSchema.parse(data);
        accessToken = session.accessToken;
        user = session.user;
        notify();
      }).catch((error: unknown) => {
        if (expected === generation) clearSession();
        if (!axios.isCancel(error) && !(axios.isAxiosError(error) && error.response?.status === 401)) throw error;
      }).finally(() => { if (restoreFlight === flight) restoreFlight = null; });
      restoreFlight = flight;
      return flight;
    },
    async logout() {
      const token = accessToken;
      clearSession();
      // Local logout is immediate; remote revocation failure must be reported by the UI.
      await authApi.post('/auth/logout', {}, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;
