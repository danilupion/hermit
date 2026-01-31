import type { AgentMessage } from '@hermit/protocol/agent-messages.js';
import type { WSContext, WSMessageReceive } from 'hono/ws';
import type { WebSocket } from 'ws';

import { safeParseAgentMessage } from '@hermit/protocol/schemas.js';

import {
  addAgentSession,
  getAgent,
  registerAgent,
  removeAgentSession,
  unregisterAgent,
  updateAgentSessions,
} from '../registries/agents.js';
import { getClientsAttachedToSession } from '../registries/clients.js';
import {
  findAllMachines,
  findMachineById,
  updateMachineLastSeen,
} from '../repositories/machines.js';
import type { MachineRow } from '../repositories/machines.js';
import { verifyMachineToken } from '../services/auth.js';

type AgentState = {
  machineId: string | null;
  authenticated: boolean;
};

const sendToAgent = (ws: WSContext<WebSocket>, message: object): void => {
  ws.send(JSON.stringify(message));
};

const broadcastToClients = (machineId: string, sessionId: string, message: object): void => {
  const clients = getClientsAttachedToSession(machineId, sessionId);
  const json = JSON.stringify(message);
  for (const client of clients) {
    client.ws.send(json);
  }
};

const handleAgentMessage = async (
  ws: WSContext<WebSocket>,
  state: AgentState,
  message: AgentMessage,
): Promise<void> => {
  if (message.type === 'register') {
    let machine: MachineRow | null = null;

    // If agent has cached machineId, look up by ID (fast path)
    if (message.machineId) {
      machine = await findMachineById(message.machineId);
      if (machine) {
        const valid = await verifyMachineToken(message.token, machine.token_hash);
        if (!valid) {
          machine = null; // Invalid token, don't use this machine
        }
      }
    }

    // If no machineId or lookup failed, search by token (slow path for first registration)
    if (!machine) {
      const allMachines = await findAllMachines();
      for (const m of allMachines) {
        const valid = await verifyMachineToken(message.token, m.token_hash);
        if (valid) {
          machine = m;
          break;
        }
      }
    }

    if (!machine) {
      sendToAgent(ws, { type: 'registered', success: false, error: 'Invalid token' });
      return;
    }

    state.machineId = machine.id;
    state.authenticated = true;

    registerAgent(machine.id, machine.name, machine.user_id, ws);
    await updateMachineLastSeen(machine.id);

    sendToAgent(ws, { type: 'registered', success: true, machineId: machine.id });
    sendToAgent(ws, { type: 'list_sessions' });

    console.log(`Agent registered: ${machine.name} (${machine.id})`);
    return;
  }

  if (!state.authenticated || !state.machineId) {
    sendToAgent(ws, { type: 'error', code: 'NOT_AUTHENTICATED', message: 'Not authenticated' });
    return;
  }

  switch (message.type) {
    case 'sessions':
      updateAgentSessions(state.machineId, message.sessions);

      // Re-attach any clients that were viewing these sessions (agent reconnect)
      for (const session of message.sessions) {
        const clients = getClientsAttachedToSession(state.machineId, session.id);
        if (clients.length > 0) {
          // Tell agent to start streaming again (no replay since clients have context)
          sendToAgent(ws, {
            type: 'attach',
            sessionId: session.id,
            clientId: clients[0].clientId, // Use first client as reference
            requestReplay: false,
          });
        }
      }
      break;

    case 'session_started':
      addAgentSession(state.machineId, message.session);
      break;

    case 'session_ended':
      removeAgentSession(state.machineId, message.sessionId);
      break;

    case 'data':
      broadcastToClients(state.machineId, message.sessionId, {
        type: 'data',
        sessionId: message.sessionId,
        data: message.data,
      });
      break;

    case 'session_replay':
      broadcastToClients(state.machineId, message.sessionId, {
        type: 'session_replay',
        sessionId: message.sessionId,
        data: message.data,
        lineCount: message.lineCount,
      });
      break;

    case 'pong':
      break;
  }
};

export const createAgentHandlers = () => {
  const state: AgentState = {
    machineId: null,
    authenticated: false,
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
        sendToAgent(ws, {
          type: 'error',
          code: 'INVALID_JSON',
          message: 'Invalid JSON',
        });
        return;
      }

      const result = safeParseAgentMessage(parsed);
      if (!result.success) {
        sendToAgent(ws, {
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: 'Invalid message format',
        });
        return;
      }

      const message = result.data as AgentMessage;
      await handleAgentMessage(ws, state, message);
    },

    onClose: (): void => {
      if (state.machineId) {
        unregisterAgent(state.machineId);
        console.log(`Agent disconnected: ${state.machineId}`);
      }
    },

    onError: (error: Event): void => {
      console.error('Agent WebSocket error:', error);
    },
  };
};

export const sendToAgentByMachineId = (machineId: string, message: object): boolean => {
  const agent = getAgent(machineId);
  if (!agent) return false;
  agent.ws.send(JSON.stringify(message));
  return true;
};
