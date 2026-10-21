import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createAuthClient } from '../08-auth/references/auth-client';

const session = { accessToken: 'old', user: { id: '1', name: 'Ada', email: 'ada@example.com', role: 'user' } };
function response(config: InternalAxiosRequestConfig, data: unknown) {
  return { config, data, status: 200, statusText: 'OK', headers: {} };
}
function unauthorized(config: InternalAxiosRequestConfig) {
  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined,
    { ...response(config, {}), status: 401 });
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('auth session boundaries', () => {
  it('shares concurrent refresh and retries with the new token', async () => {
    const gate = deferred<void>();
    let refreshes = 0;
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/auth/login') return response(config, session);
      if (config.url === '/auth/refresh') {
        refreshes++;
        await gate.promise;
        return response(config, { accessToken: 'new' });
      }
      if (config.headers.get('Authorization') === 'Bearer old') throw unauthorized(config);
      return response(config, 'ok');
    };
    const client = createAuthClient({ baseURL: '/api', adapter, clearPrivateData: vi.fn() });
    await client.login({ email: session.user.email, password: 'secret' });
    const requests = Promise.all([client.api.get('/a'), client.api.get('/b')]);
    await vi.waitFor(() => expect(refreshes).toBe(1));
    gate.resolve();
    expect((await requests).map((r) => r.data)).toEqual(['ok', 'ok']);
    expect(refreshes).toBe(1);
  });

  it('does not resurrect a session after logout during refresh', async () => {
    const gate = deferred<void>();
    const started = deferred<void>();
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/auth/login') return response(config, session);
      if (config.url === '/auth/logout') return response(config, {});
      if (config.url === '/auth/refresh') {
        started.resolve();
        await gate.promise;
        return response(config, { accessToken: 'stale' });
      }
      throw unauthorized(config);
    };
    const clear = vi.fn();
    const client = createAuthClient({ baseURL: '/api', adapter, clearPrivateData: clear });
    await client.login({ email: session.user.email, password: 'secret' });
    const request = client.api.get('/private').catch((error: unknown) => error);
    await started.promise;
    await client.logout();
    gate.resolve();
    expect(axios.isCancel(await request)).toBe(true);
    expect(client.getAccessToken()).toBeNull();
    expect(client.getUser()).toBeNull();
    expect(clear).toHaveBeenCalledTimes(2);
  });

  it('shares restoration and rejects malformed session data', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => response(config, { accessToken: 'no-user' }));
    const client = createAuthClient({ baseURL: '/api', adapter, clearPrivateData: vi.fn() });
    const first = client.restore();
    expect(client.restore()).toBe(first);
    await expect(first).rejects.toThrow();
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(client.getAccessToken()).toBeNull();
  });

  it('stops after one retry when the endpoint keeps returning 401', async () => {
    let refreshes = 0;
    const adapter: AxiosAdapter = async (config) => {
      if (config.url === '/auth/refresh') {
        refreshes++;
        return response(config, { accessToken: 'new' });
      }
      throw unauthorized(config);
    };
    const client = createAuthClient({ baseURL: '/api', adapter, clearPrivateData: vi.fn() });
    await expect(client.api.get('/private')).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshes).toBe(1);
  });
});
