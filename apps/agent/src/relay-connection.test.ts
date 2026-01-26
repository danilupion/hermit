import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RelayConnectionConfig } from './relay-connection.js';

// Create mock WebSocket class
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  private handlers: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  send = vi.fn();
  close = vi.fn();

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  on(event: string, handler: (...args: unknown[]) => void): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach((h) => h(...args));
  }

  static reset(): void {
    MockWebSocket.instances = [];
  }

  static getLastInstance(): MockWebSocket | undefined {
    return MockWebSocket.instances[MockWebSocket.instances.length - 1];
  }
}

// Mock ws module
vi.mock('ws', () => ({
  default: MockWebSocket,
}));

// Import after mocking
const { createRelayConnection } = await import('./relay-connection.js');

describe('RelayConnection', () => {
  let mockConfig: RelayConnectionConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    MockWebSocket.reset();

    mockConfig = {
      relayUrl: 'wss://relay.example.com/ws/agent',
      machineName: 'test-machine',
      token: 'hmt_testtoken',
      onRegistered: vi.fn(),
      onListSessions: vi.fn().mockReturnValue([]),
      onStartSession: vi.fn(),
      onAttach: vi.fn(),
      onDetach: vi.fn(),
      onData: vi.fn(),
      onResize: vi.fn(),
      onError: vi.fn(),
      onDisconnect: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('connect', () => {
    it('creates WebSocket connection', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      expect(MockWebSocket.instances).toHaveLength(1);
      expect(MockWebSocket.getLastInstance()?.url).toBe('wss://relay.example.com/ws/agent');
    });

    it('sends register message on open', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'register',
          machineName: 'test-machine',
          token: 'hmt_testtoken',
        }),
      );
    });

    it('sets isConnected to true after open', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      expect(connection.isConnected()).toBe(false);

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');

      expect(connection.isConnected()).toBe(true);
    });
  });

  describe('message handling', () => {
    it('handles registered message with success', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit(
        'message',
        JSON.stringify({ type: 'registered', success: true, machineId: 'machine-123' }),
      );

      expect(mockConfig.onRegistered).toHaveBeenCalledWith('machine-123');
    });

    it('handles registered message with failure', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit(
        'message',
        JSON.stringify({ type: 'registered', success: false, error: 'Invalid token' }),
      );

      expect(mockConfig.onError).toHaveBeenCalled();
      expect((mockConfig.onError as ReturnType<typeof vi.fn>).mock.calls[0][0].message).toBe(
        'Invalid token',
      );
    });

    it('handles list_sessions message', () => {
      const mockSessions = [
        { id: '1', name: 'main', command: 'tmux', createdAt: '', attachedClients: 0 },
      ];
      mockConfig.onListSessions = vi.fn().mockReturnValue(mockSessions);

      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit('message', JSON.stringify({ type: 'list_sessions' }));

      expect(mockConfig.onListSessions).toHaveBeenCalled();
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'sessions', sessions: mockSessions }),
      );
    });

    it('handles start_session message', () => {
      const mockSession = {
        id: '1',
        name: 'test',
        command: 'bash',
        createdAt: '',
        attachedClients: 0,
      };
      mockConfig.onStartSession = vi.fn().mockReturnValue(mockSession);

      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit('message', JSON.stringify({ type: 'start_session', name: 'test', command: 'bash' }));

      expect(mockConfig.onStartSession).toHaveBeenCalledWith('test', 'bash');
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'session_started', session: mockSession }),
      );
    });

    it('handles attach message', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit(
        'message',
        JSON.stringify({ type: 'attach', sessionId: 'sess-1', clientId: 'client-1' }),
      );

      expect(mockConfig.onAttach).toHaveBeenCalledWith('sess-1', 'client-1');
    });

    it('handles data message', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit('message', JSON.stringify({ type: 'data', sessionId: 'sess-1', data: 'dGVzdA==' }));

      expect(mockConfig.onData).toHaveBeenCalledWith('sess-1', 'dGVzdA==');
    });

    it('handles resize message', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');
      ws.emit(
        'message',
        JSON.stringify({ type: 'resize', sessionId: 'sess-1', cols: 120, rows: 40 }),
      );

      expect(mockConfig.onResize).toHaveBeenCalledWith('sess-1', 120, 40);
    });

    it('handles ping message with pong', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');

      // Clear previous sends
      ws.send.mockClear();

      ws.emit('message', JSON.stringify({ type: 'ping' }));

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'pong' }));
    });
  });

  describe('disconnect', () => {
    it('closes WebSocket', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      connection.disconnect();

      expect(ws.close).toHaveBeenCalled();
    });

    it('sets isConnected to false', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');

      expect(connection.isConnected()).toBe(true);

      connection.disconnect();
      expect(connection.isConnected()).toBe(false);
    });
  });

  describe('reconnection', () => {
    it('reconnects with exponential backoff', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('close');

      expect(mockConfig.onDisconnect).toHaveBeenCalled();
      expect(MockWebSocket.instances).toHaveLength(1);

      // Fast-forward to first reconnect (1s)
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances).toHaveLength(2);
    });

    it('increases delay with each attempt', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      // First disconnect
      MockWebSocket.getLastInstance()!.emit('close');
      expect(MockWebSocket.instances).toHaveLength(1);

      // First reconnect at 1s
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances).toHaveLength(2);

      // Second disconnect
      MockWebSocket.getLastInstance()!.emit('close');

      // Should wait 2s for second reconnect
      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances).toHaveLength(2); // Still 2

      vi.advanceTimersByTime(1000);
      expect(MockWebSocket.instances).toHaveLength(3); // Now 3
    });
  });

  describe('send methods', () => {
    it('sendSessions sends sessions message', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');

      ws.send.mockClear();

      const sessions = [
        { id: '1', name: 'main', command: 'bash', createdAt: '', attachedClients: 0 },
      ];
      connection.sendSessions(sessions);

      expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'sessions', sessions }));
    });

    it('sendData sends data message', () => {
      const connection = createRelayConnection(mockConfig);
      connection.connect();

      const ws = MockWebSocket.getLastInstance()!;
      ws.emit('open');

      ws.send.mockClear();

      connection.sendData('sess-1', 'dGVzdA==');

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'data', sessionId: 'sess-1', data: 'dGVzdA==' }),
      );
    });
  });
});
