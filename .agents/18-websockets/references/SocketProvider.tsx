import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthClient } from '../../08-auth/references/auth-client';
import { useAuth } from '../../08-auth/references/AuthProvider';
import { WebSocketClient } from './socket-client';

const Context = createContext<WebSocketClient | null>(null);
export function SocketProvider({ url, auth, children }: { url: string; auth: AuthClient; children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [client, setClient] = useState<WebSocketClient | null>(null);
  useEffect(() => {
    if (isLoading || !user) return;
    const socket = new WebSocketClient({ url, getToken: auth.getAccessToken });
    setClient(socket);
    socket.connect();
    return () => { socket.disconnect(); setClient(null); };
  }, [url, auth, user, isLoading]);
  return <Context.Provider value={client}>{children}</Context.Provider>;
}
export const useSocket = () => useContext(Context);
