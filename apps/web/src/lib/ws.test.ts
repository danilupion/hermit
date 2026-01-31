import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createWebSocketClient } from './ws';

describe('createWebSocketClient', () => {
  let mockWsInstances: MockWebSocket[];
  let originalWebSocket: typeof WebSocket;

  // Mock WebSocket class
  class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    url: string;
    readyState: number = MockWebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onclose: (() => void) | null = null;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    send = vi.fn();
    close = vi.fn();

    constructor(url: string) {
      this.url = url;
      mockWsInstances.push(this);
      this.close.mockImplementation(() => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.();
      });
    }

    // Helpers for tests
    simulateOpen() {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }

    simulateMessage(data: unknown) {
      this.onmessage?.({ data: JSON.stringify(data) });
    }

    simulateClose() {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.();
    }

    simulateError(error: Event) {
      this.onerror?.(error);
    }
  }

  beforeEach(() => {
    vi.useFakeTimers();
    mockWsInstances = [];
    originalWebSocket = globalThis.WebSocket;
    // @ts-expect-error - Mocking WebSocket
    globalThis.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  const getLastWs = (): MockWebSocket => {
    const ws = mockWsInstances[mockWsInstances.length - 1];
    if (!ws) throw new Error('No WebSocket instance created');
    return ws;
  };

  it('should create a WebSocket connection', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    client.connect();

    expect(mockWsInstances.length).toBe(1);
    expect(getLastWs().url).toBe('ws://localhost:3550/ws/client');
  });

  it('should send auth message on open', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();

    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth', token: 'test-token' }));
  });

  it('should call onConnect callback when connected', () => {
    const onConnect = vi.fn();
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
      onConnect,
    });

    client.connect();
    getLastWs().simulateOpen();

    expect(onConnect).toHaveBeenCalled();
  });

  it('should call onDisconnect callback when disconnected', () => {
    const onDisconnect = vi.fn();
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
      onDisconnect,
    });

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();
    ws.simulateClose();

    expect(onDisconnect).toHaveBeenCalled();
  });

  it('should track connection state', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    expect(client.isConnected()).toBe(false);

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();
    expect(client.isConnected()).toBe(true);

    ws.simulateClose();
    expect(client.isConnected()).toBe(false);
  });

  it('should handle incoming messages', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });
    const handler = vi.fn();

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();
    client.onMessage(handler);

    const message = { type: 'machines', machines: [] };
    ws.simulateMessage(message);

    expect(handler).toHaveBeenCalledWith(message);
  });

  it('should allow unsubscribing from messages', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });
    const handler = vi.fn();

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();
    const unsubscribe = client.onMessage(handler);

    const message1 = { type: 'machines', machines: [] };
    ws.simulateMessage(message1);
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();

    const message2 = { type: 'sessions', machineId: '1', sessions: [] };
    ws.simulateMessage(message2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should send messages', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();

    const message = { type: 'list_machines' as const };
    client.send(message);

    // First call is auth, second call is our message
    expect(ws.send).toHaveBeenCalledTimes(2);
    expect(ws.send).toHaveBeenLastCalledWith(JSON.stringify(message));
  });

  it('should not send messages when not connected', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    client.connect();
    const ws = getLastWs();
    // Don't simulate open

    const message = { type: 'list_machines' as const };
    client.send(message);

    // send should not be called at all when not connected
    expect(ws.send).not.toHaveBeenCalled();
  });

  it('should auto-reconnect after disconnect', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();
    ws.simulateClose();

    expect(mockWsInstances.length).toBe(1);

    vi.advanceTimersByTime(2000);

    expect(mockWsInstances.length).toBe(2);
  });

  it('should not auto-reconnect after intentional disconnect', () => {
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
    });

    client.connect();
    const ws = getLastWs();
    ws.simulateOpen();
    client.disconnect();

    expect(mockWsInstances.length).toBe(1);

    vi.advanceTimersByTime(2000);

    expect(mockWsInstances.length).toBe(1);
  });

  it('should call onError callback on error', () => {
    const onError = vi.fn();
    const client = createWebSocketClient({
      url: 'ws://localhost:3550/ws/client',
      token: 'test-token',
      onError,
    });

    client.connect();
    const ws = getLastWs();
    const errorEvent = new Event('error');
    ws.simulateError(errorEvent);

    expect(onError).toHaveBeenCalledWith(errorEvent);
  });
});
