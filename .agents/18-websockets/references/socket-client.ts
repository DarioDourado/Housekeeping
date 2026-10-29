type SocketLike = Pick<WebSocket, 'readyState' | 'send' | 'close' | 'onopen' | 'onclose' | 'onerror' | 'onmessage'>;
type Handler = (value: unknown) => void;
type Options = {
  url: string;
  getToken: () => string | null;
  createSocket?: (url: string) => SocketLike;
  maxRetries?: number;
};

export class WebSocketClient {
  private socket: SocketLike | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = true;
  private attempts = 0;
  private authenticated = false;
  private handlers = new Map<string, Set<Handler>>();
  constructor(private options: Options) {}

  connect() {
    if (!this.stopped) return;
    this.stopped = false;
    this.attempts = 0;
    this.open();
  }

  private open() {
    if (this.stopped) return;
    if (!this.options.getToken()) {
      // Fail-closed: sem token não há handshake de autenticação. Emitir erro e
      // parar — retry é para falhas de rede, a ausência de token exige novo login.
      this.socket = null;
      this.authenticated = false;
      this.stopped = true;
      this.emit('disconnected', null);
      this.emit('error', new Error('Socket connect aborted: no auth token'));
      return;
    }
    const socket = this.options.createSocket?.(this.options.url) ?? new WebSocket(this.options.url);
    this.socket = socket;
    socket.onopen = () => {
      if (this.stopped || this.socket !== socket) return;
      const token = this.options.getToken();
      if (!token) { this.disconnect(); return; }
      socket.send(JSON.stringify({ type: 'auth', token }));
    };
    socket.onmessage = (event) => {
      if (this.stopped || this.socket !== socket) return;
      let value: unknown;
      try { value = JSON.parse(String(event.data)); } catch { this.emit('error', new Error('Invalid socket JSON')); return; }
      if (!value || typeof value !== 'object' || !('type' in value) || typeof value.type !== 'string') return;
      if (value.type === 'auth:ok') {
        this.authenticated = true;
        this.attempts = 0;
        this.emit('connected', null);
      } else if (value.type === 'auth:error') {
        this.disconnect();
        this.emit('error', new Error('Socket authentication failed'));
      } else if (this.authenticated) this.emit(value.type, value);
    };
    socket.onerror = (error) => { if (this.socket === socket && !this.stopped) this.emit('error', error); };
    socket.onclose = () => {
      if (this.socket !== socket || this.stopped) return;
      this.socket = null;
      this.authenticated = false;
      this.emit('disconnected', null);
      if (this.attempts >= (this.options.maxRetries ?? 5)) return;
      const delay = Math.min(1000 * 2 ** this.attempts++ * (1 + Math.random() * 0.3), 30_000);
      this.timer = setTimeout(() => { this.timer = undefined; this.open(); }, delay);
    };
  }

  disconnect() {
    this.stopped = true;
    clearTimeout(this.timer);
    this.timer = undefined;
    const socket = this.socket;
    this.socket = null;
    this.authenticated = false;
    if (socket) { socket.onopen = null; socket.onmessage = null; socket.onclose = null; socket.onerror = null; socket.close(); }
    this.emit('disconnected', null);
  }

  send(value: object) {
    if (!this.authenticated || this.socket?.readyState !== 1) return false;
    this.socket.send(JSON.stringify(value));
    return true;
  }

  on(event: string, handler: Handler) {
    const listeners = this.handlers.get(event) ?? new Set<Handler>();
    listeners.add(handler);
    this.handlers.set(event, listeners);
    return () => { listeners.delete(handler); };
  }

  private emit(event: string, value: unknown) { this.handlers.get(event)?.forEach((handler) => handler(value)); }
}
