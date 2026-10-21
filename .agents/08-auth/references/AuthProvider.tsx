import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { AuthClient } from './auth-client';

const Context = createContext<{ client: AuthClient; isLoading: boolean; error: unknown } | null>(null);

export function AuthProvider({ client, children }: { client: AuthClient; children: ReactNode }) {
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let active = true;
    client.restore().catch((cause: unknown) => { if (active) setError(cause); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [client]);
  return <Context.Provider value={{ client, isLoading, error }}>{children}</Context.Provider>;
}

export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error('AuthProvider required');
  const user = useSyncExternalStore(context.client.subscribe, context.client.getUser);
  return { ...context, user, isAuthenticated: user !== null };
}
