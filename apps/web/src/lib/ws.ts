import type { ClientMessage, RelayToClientMessage } from '@hermit/protocol/client-messages.js';

export type WebSocketClient = {
  connect: () => void;
  disconnect: () => void;
  send: (message: ClientMessage) => void;
  onMessage: (handler: (message: RelayToClientMessage) => void) => () => void;
  isConnected: () => boolean;
};

export type CreateWebSocketClientOptions = {
  url: string;
  token: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
};

export const createWebSocketClient = ({
  url,
  token,
  onConnect,
  onDisconnect,
  onError,
}: CreateWebSocketClientOptions): WebSocketClient => {
  let ws: WebSocket | null = null;
  let connected = false;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let intentionalClose = false;
  const handlers = new Set<(message: RelayToClientMessage) => void>();

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    intentionalClose = false;
    ws = new WebSocket(url);

    ws.onopen = () => {
      connected = true;
      ws?.send(JSON.stringify({ type: 'auth', token }));
      onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as RelayToClientMessage;
        handlers.forEach((h) => h(message));
      } catch {
        // Ignore invalid JSON
      }
    };

    ws.onclose = () => {
      connected = false;
      onDisconnect?.();

      // Auto-reconnect after 2s unless intentionally closed
      if (!intentionalClose) {
        reconnectTimeout = setTimeout(connect, 2000);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };
  };

  const disconnect = () => {
    intentionalClose = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    connected = false;
  };

  const send = (message: ClientMessage) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  };

  const onMessage = (handler: (message: RelayToClientMessage) => void): (() => void) => {
    handlers.add(handler);
    return () => handlers.delete(handler);
  };

  return {
    connect,
    disconnect,
    send,
    onMessage,
    isConnected: () => connected,
  };
};
