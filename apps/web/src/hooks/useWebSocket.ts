'use client';

import type { ClientMessage, RelayToClientMessage } from '@hermit/protocol/client-messages.js';

import { useCallback, useEffect, useRef } from 'react';

import { createWebSocketClient, type WebSocketClient } from '../lib/ws';
import { useAuthStore } from '../stores/auth';
import { useRelayStore } from '../stores/relay';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/client';

export type UseWebSocketResult = {
  connected: boolean;
  send: (message: ClientMessage) => void;
  onMessage: (handler: (message: RelayToClientMessage) => void) => () => void;
};

export const useWebSocket = (): UseWebSocketResult => {
  const token = useAuthStore((s) => s.token);
  const setConnected = useRelayStore((s) => s.setConnected);
  const setMachines = useRelayStore((s) => s.setMachines);
  const setSessions = useRelayStore((s) => s.setSessions);
  const addSession = useRelayStore((s) => s.addSession);
  const connected = useRelayStore((s) => s.connected);

  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const client = createWebSocketClient({
      url: WS_URL,
      token,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    clientRef.current = client;

    // Handle incoming messages
    const unsubscribe = client.onMessage((message) => {
      switch (message.type) {
        case 'machines':
          setMachines(message.machines);
          break;
        case 'sessions':
          setSessions(message.machineId, message.sessions);
          break;
        case 'session_started':
          addSession(message.machineId, message.session);
          break;
        // Other message types will be handled by specific components
      }
    });

    client.connect();

    return () => {
      unsubscribe();
      client.disconnect();
      clientRef.current = null;
    };
  }, [token, setConnected, setMachines, setSessions, addSession]);

  const send = useCallback((message: ClientMessage) => {
    clientRef.current?.send(message);
  }, []);

  const onMessage = useCallback(
    (handler: (message: RelayToClientMessage) => void): (() => void) => {
      if (!clientRef.current) {
        return () => {};
      }
      return clientRef.current.onMessage(handler);
    },
    [],
  );

  return { connected, send, onMessage };
};
