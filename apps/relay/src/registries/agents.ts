import type { MachineId, SessionInfo } from '@hermit/protocol/types.js';
import type { ServerWebSocket } from '@hono/node-ws';

export type AgentConnection = {
  machineId: MachineId;
  machineName: string;
  userId: string;
  ws: ServerWebSocket;
  sessions: Map<string, SessionInfo>;
  connectedAt: Date;
};

const agents = new Map<MachineId, AgentConnection>();

export const registerAgent = (
  machineId: MachineId,
  machineName: string,
  userId: string,
  ws: ServerWebSocket,
): void => {
  agents.set(machineId, {
    machineId,
    machineName,
    userId,
    ws,
    sessions: new Map(),
    connectedAt: new Date(),
  });
};

export const unregisterAgent = (machineId: MachineId): void => {
  agents.delete(machineId);
};

export const getAgent = (machineId: MachineId): AgentConnection | undefined => {
  return agents.get(machineId);
};

export const getAgentsByUserId = (userId: string): AgentConnection[] => {
  return Array.from(agents.values()).filter((agent) => agent.userId === userId);
};

export const isAgentOnline = (machineId: MachineId): boolean => {
  return agents.has(machineId);
};

export const updateAgentSessions = (machineId: MachineId, sessions: SessionInfo[]): void => {
  const agent = agents.get(machineId);
  if (agent) {
    agent.sessions.clear();
    for (const session of sessions) {
      agent.sessions.set(session.id, session);
    }
  }
};

export const getAgentSessions = (machineId: MachineId): SessionInfo[] => {
  const agent = agents.get(machineId);
  return agent ? Array.from(agent.sessions.values()) : [];
};

export const addAgentSession = (machineId: MachineId, session: SessionInfo): void => {
  const agent = agents.get(machineId);
  if (agent) {
    agent.sessions.set(session.id, session);
  }
};

export const removeAgentSession = (machineId: MachineId, sessionId: string): void => {
  const agent = agents.get(machineId);
  if (agent) {
    agent.sessions.delete(sessionId);
  }
};

export const getAllAgents = (): AgentConnection[] => {
  return Array.from(agents.values());
};

export const clearAgents = (): void => {
  agents.clear();
};
