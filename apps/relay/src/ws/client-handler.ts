import type { ClientMessage } from '@hermit/protocol/client-messages.js';
import type { WSContext, WSMessageReceive } from 'hono/ws';
import type { WebSocket } from 'ws';

import { safeParseClientMessage } from '@hermit/protocol/schemas.js';

import {
  getAgent,
  getAgentsByUserId,
  getAgentSessions,
  isAgentOnline,
} from '../registries/agents.js';
import {
  attachClientToSession,
  detachClientFromSession,
  getClient,
  registerClient,
  unregisterClient,
} from '../registries/clients.js';
import { findMachinesByUserId } from '../repositories/machines.js';
import { findUserById } from '../repositories/users.js';
import { verifyToken } from '../services/auth.js';
import { sendToAgentByMachineId } from './agent-handler.js';

type ClientState = {
  clientId: string;
  userId: string | null;
  authenticated: boolean;
  ws: WSContext<WebSocket> | null;
};

const sendToClient = (ws: WSContext<WebSocket>, message: object): void => {
  ws.send(JSON.stringify(message));
};

const handleClientMessage = async (
  ws: WSContext<WebSocket>,
  state: ClientState,
  message: ClientMessage,
): Promise<void> => {
  if (message.type === 'auth') {
    try {
      const payload = await verifyToken(message.token);
      const user = await findUserById(payload.sub);

      if (!user) {
        sendToClient(ws, { type: 'error', code: 'USER_NOT_FOUND', message: 'User not found' });
        return;
      }

      state.userId = user.id;
      state.authenticated = true;
      state.ws = ws;

      registerClient(state.clientId, user.id, ws);

      sendToClient(ws, { type: 'authenticated', user });
      console.log(`Client authenticated: ${state.clientId} (${user.email})`);
    } catch {
      sendToClient(ws, { type: 'error', code: 'INVALID_TOKEN', message: 'Invalid token' });
    }
    return;
  }

  if (!state.authenticated || !state.userId) {
    sendToClient(ws, { type: 'error', code: 'NOT_AUTHENTICATED', message: 'Not authenticated' });
    return;
  }

  switch (message.type) {
    case 'list_machines': {
      const dbMachines = await findMachinesByUserId(state.userId);
      const onlineAgents = getAgentsByUserId(state.userId);
      const onlineIds = new Set(onlineAgents.map((a) => a.machineId));

      const machines = dbMachines.map((m) => ({
        ...m,
        online: onlineIds.has(m.id),
        sessionCount: isAgentOnline(m.id) ? getAgentSessions(m.id).length : 0,
      }));

      sendToClient(ws, { type: 'machines', machines });
      break;
    }

    case 'list_sessions': {
      const sessions = getAgentSessions(message.machineId);
      sendToClient(ws, {
        type: 'sessions',
        machineId: message.machineId,
        sessions,
      });
      break;
    }

    case 'attach': {
      const agent = getAgent(message.machineId);
      if (!agent || agent.userId !== state.userId) {
        sendToClient(ws, {
          type: 'error',
          code: 'MACHINE_NOT_FOUND',
          message: 'Machine not found or offline',
        });
        return;
      }

      attachClientToSession(state.clientId, message.sessionId, message.machineId);
      sendToAgentByMachineId(message.machineId, {
        type: 'attach',
        sessionId: message.sessionId,
        clientId: state.clientId,
      });
      sendToClient(ws, { type: 'attached', sessionId: message.sessionId });
      break;
    }

    case 'detach': {
      detachClientFromSession(state.clientId, message.sessionId);
      sendToClient(ws, { type: 'detached', sessionId: message.sessionId });
      break;
    }

    case 'create_session': {
      const agent = getAgent(message.machineId);
      if (!agent || agent.userId !== state.userId) {
        sendToClient(ws, {
          type: 'error',
          code: 'MACHINE_NOT_FOUND',
          message: 'Machine not found or offline',
        });
        return;
      }

      sendToAgentByMachineId(message.machineId, {
        type: 'start_session',
        name: message.name,
        command: message.command,
      });
      break;
    }

    case 'data': {
      const client = getClient(state.clientId);
      if (!client) break;

      const machineId = client.attachedSessions.get(message.sessionId);
      if (machineId) {
        sendToAgentByMachineId(machineId, {
          type: 'data',
          sessionId: message.sessionId,
          data: message.data,
        });
      }
      break;
    }

    case 'resize': {
      const client = getClient(state.clientId);
      if (!client) break;

      const machineId = client.attachedSessions.get(message.sessionId);
      if (machineId) {
        sendToAgentByMachineId(machineId, {
          type: 'resize',
          sessionId: message.sessionId,
          cols: message.cols,
          rows: message.rows,
        });
      }
      break;
    }

    case 'pong':
      break;
  }
};

export const createClientHandlers = () => {
  const clientId = crypto.randomUUID();
  const state: ClientState = {
    clientId,
    userId: null,
    authenticated: false,
    ws: null,
  };

  return {
    onMessage: async (
      event: MessageEvent<WSMessageReceive>,
      ws: WSContext<WebSocket>,
    ): Promise<void> => {
      const data =
        typeof event.data === 'string'
          ? event.data
          : new TextDecoder().decode(event.data as ArrayBuffer);
      let parsed: unknown;

      try {
        parsed = JSON.parse(data);
      } catch {
        sendToClient(ws, {
          type: 'error',
          code: 'INVALID_JSON',
          message: 'Invalid JSON',
        });
        return;
      }

      const result = safeParseClientMessage(parsed);
      if (!result.success) {
        sendToClient(ws, {
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Invalid message format',
        });
        return;
      }

      const message = result.data as ClientMessage;
      await handleClientMessage(ws, state, message);
    },

    onClose: (): void => {
      if (state.authenticated) {
        unregisterClient(state.clientId);
        console.log(`Client disconnected: ${state.clientId}`);
      }
    },

    onError: (error: Event): void => {
      console.error('Client WebSocket error:', error);
    },
  };
};
