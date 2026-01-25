import type { ClientId, MachineId, SessionId, UserId } from '@hermit/protocol/types.js';
import type { ServerWebSocket } from '@hono/node-ws';

export type ClientConnection = {
  clientId: ClientId;
  userId: UserId;
  ws: ServerWebSocket;
  attachedSessions: Map<SessionId, MachineId>;
  connectedAt: Date;
};

const clients = new Map<ClientId, ClientConnection>();

export const registerClient = (clientId: ClientId, userId: UserId, ws: ServerWebSocket): void => {
  clients.set(clientId, {
    clientId,
    userId,
    ws,
    attachedSessions: new Map(),
    connectedAt: new Date(),
  });
};

export const unregisterClient = (clientId: ClientId): void => {
  clients.delete(clientId);
};

export const getClient = (clientId: ClientId): ClientConnection | undefined => {
  return clients.get(clientId);
};

export const getClientsByUserId = (userId: UserId): ClientConnection[] => {
  return Array.from(clients.values()).filter((client) => client.userId === userId);
};

export const attachClientToSession = (
  clientId: ClientId,
  sessionId: SessionId,
  machineId: MachineId,
): void => {
  const client = clients.get(clientId);
  if (client) {
    client.attachedSessions.set(sessionId, machineId);
  }
};

export const detachClientFromSession = (clientId: ClientId, sessionId: SessionId): void => {
  const client = clients.get(clientId);
  if (client) {
    client.attachedSessions.delete(sessionId);
  }
};

export const getClientsAttachedToSession = (
  machineId: MachineId,
  sessionId: SessionId,
): ClientConnection[] => {
  return Array.from(clients.values()).filter((client) => {
    const attachedMachine = client.attachedSessions.get(sessionId);
    return attachedMachine === machineId;
  });
};

export const clearClients = (): void => {
  clients.clear();
};
