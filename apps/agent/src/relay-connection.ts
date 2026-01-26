import type { RelayToAgentMessage } from '@hermit/protocol/agent-messages.js';
import type { SessionInfo } from '@hermit/protocol/types.js';

import { safeParseRelayToAgentMessage } from '@hermit/protocol/schemas.js';
import WebSocket from 'ws';

export type RelayConnectionConfig = {
  relayUrl: string;
  machineName: string;
  token: string;
  onRegistered: (machineId: string) => void;
  onListSessions: () => SessionInfo[];
  onStartSession: (name: string, command?: string) => SessionInfo | null;
  onAttach: (sessionId: string, clientId: string) => void;
  onDetach: (sessionId: string, clientId: string) => void;
  onData: (sessionId: string, data: string) => void;
  onResize: (sessionId: string, cols: number, rows: number) => void;
  onError: (error: Error) => void;
  onDisconnect: () => void;
};

export type RelayConnection = {
  connect: () => void;
  disconnect: () => void;
  isConnected: () => boolean;
  sendSessions: (sessions: SessionInfo[]) => void;
  sendSessionStarted: (session: SessionInfo) => void;
  sendSessionEnded: (sessionId: string) => void;
  sendData: (sessionId: string, data: string) => void;
};

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export const createRelayConnection = (config: RelayConnectionConfig): RelayConnection => {
  let ws: WebSocket | null = null;
  let connected = false;
  let reconnectAttempt = 0;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  let pingInterval: NodeJS.Timeout | null = null;

  const send = (message: object): void => {
    if (ws && connected) {
      ws.send(JSON.stringify(message));
    }
  };

  const handleMessage = (data: WebSocket.RawData): void => {
    // Convert WebSocket.RawData (Buffer | ArrayBuffer | Buffer[]) to string
    let str: string;
    if (Buffer.isBuffer(data)) {
      str = data.toString('utf-8');
    } else if (Array.isArray(data)) {
      str = Buffer.concat(data).toString('utf-8');
    } else {
      str = Buffer.from(data).toString('utf-8');
    }
    let parsed: unknown;

    try {
      parsed = JSON.parse(str);
    } catch {
      console.error('Invalid JSON from relay:', str);
      return;
    }

    const result = safeParseRelayToAgentMessage(parsed);
    if (!result.success) {
      console.error('Invalid message from relay:', parsed);
      return;
    }

    const message = result.data as RelayToAgentMessage;

    switch (message.type) {
      case 'registered':
        if (message.success && message.machineId) {
          config.onRegistered(message.machineId);
        } else {
          config.onError(new Error(message.error || 'Registration failed'));
        }
        break;

      case 'list_sessions':
        send({ type: 'sessions', sessions: config.onListSessions() });
        break;

      case 'start_session': {
        const session = config.onStartSession(message.name, message.command);
        if (session) {
          send({ type: 'session_started', session });
        }
        break;
      }

      case 'attach':
        config.onAttach(message.sessionId, message.clientId);
        break;

      case 'detach':
        config.onDetach(message.sessionId, message.clientId);
        break;

      case 'data':
        config.onData(message.sessionId, message.data);
        break;

      case 'resize':
        config.onResize(message.sessionId, message.cols, message.rows);
        break;

      case 'ping':
        send({ type: 'pong' });
        break;
    }
  };

  const connect = (): void => {
    if (ws) {
      ws.close();
    }

    console.log(`Connecting to relay: ${config.relayUrl}`);
    ws = new WebSocket(config.relayUrl);

    ws.on('open', () => {
      console.log('Connected to relay');
      connected = true;
      reconnectAttempt = 0;

      // Authenticate
      send({
        type: 'register',
        machineName: config.machineName,
        token: config.token,
      });

      // Start ping interval
      pingInterval = setInterval(() => {
        send({ type: 'pong' });
      }, 30000);
    });

    ws.on('message', handleMessage);

    ws.on('close', () => {
      console.log('Disconnected from relay');
      connected = false;
      config.onDisconnect();

      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }

      // Reconnect with exponential backoff
      const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
      console.log(`Reconnecting in ${delay / 1000}s...`);
      reconnectAttempt++;

      reconnectTimeout = setTimeout(connect, delay);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
      config.onError(error);
    });
  };

  const disconnect = (): void => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }

    connected = false;
  };

  return {
    connect,
    disconnect,
    isConnected: () => connected,
    sendSessions: (sessions) => send({ type: 'sessions', sessions }),
    sendSessionStarted: (session) => send({ type: 'session_started', session }),
    sendSessionEnded: (sessionId) => send({ type: 'session_ended', sessionId }),
    sendData: (sessionId, data) => send({ type: 'data', sessionId, data }),
  };
};
