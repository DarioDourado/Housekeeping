import { afterEach, expect, it, vi } from 'vitest';
import { WebSocketClient } from '../18-websockets/references/socket-client';

class FakeSocket {
  readyState: WebSocket['readyState'] = 1;
  onopen: WebSocket['onopen'] = null;
  onclose: WebSocket['onclose'] = null;
  onerror: WebSocket['onerror'] = null;
  onmessage: WebSocket['onmessage'] = null;
  send = vi.fn();
  close = vi.fn();
  open() { this.onopen?.call(this as unknown as WebSocket, new Event('open')); }
  message(data: unknown) { this.onmessage?.call(this as unknown as WebSocket, new MessageEvent('message', { data: JSON.stringify(data) })); }
  drop() { this.onclose?.call(this as unknown as WebSocket, new CloseEvent('close')); }
}
afterEach(() => vi.useRealTimers());

it('blocks business messages until authentication and unsubscribes', () => {
  const socket = new FakeSocket();
  const client = new WebSocketClient({ url: 'wss://example.test', getToken: () => 'token', createSocket: () => socket });
  const handler = vi.fn();
  const unsubscribe = client.on('users:changed', handler);
  client.connect();
  socket.open();
  expect(JSON.parse(socket.send.mock.calls[0]?.[0] as string)).toEqual({ type: 'auth', token: 'token' });
  expect(client.send({ type: 'subscribe' })).toBe(false);
  socket.message({ type: 'users:changed' });
  expect(handler).not.toHaveBeenCalled();
  socket.message({ type: 'auth:ok' });
  expect(client.send({ type: 'subscribe' })).toBe(true);
  socket.message({ type: 'users:changed' });
  expect(handler).toHaveBeenCalledTimes(1);
  unsubscribe();
  socket.message({ type: 'users:changed' });
  expect(handler).toHaveBeenCalledTimes(1);
  client.disconnect();
});

it('cancels reconnect on logout and ignores callbacks from the old connection', () => {
  vi.useFakeTimers();
  const socket = new FakeSocket();
  const createSocket = vi.fn(() => socket);
  const client = new WebSocketClient({ url: 'wss://example.test', getToken: () => 'token', createSocket });
  client.connect();
  socket.drop();
  client.disconnect();
  vi.runAllTimers();
  expect(createSocket).toHaveBeenCalledTimes(1);
});

it('bounds retry attempts', () => {
  vi.useFakeTimers();
  const sockets: FakeSocket[] = [];
  const client = new WebSocketClient({
    url: 'wss://example.test', getToken: () => 'token', maxRetries: 2,
    createSocket: () => { const socket = new FakeSocket(); sockets.push(socket); return socket; },
  });
  client.connect();
  for (let i = 0; i < 3; i++) { sockets[i]?.drop(); vi.runAllTimers(); }
  expect(sockets).toHaveLength(3);
  client.disconnect();
});
