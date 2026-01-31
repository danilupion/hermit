import type { SessionId, SessionInfo } from './types.js';

// Agent → Relay messages
export type AgentRegisterMessage = {
  type: 'register';
  machineName: string;
  machineId?: string; // Optional - sent if agent has cached ID from previous registration
  token: string;
};

export type AgentSessionsMessage = {
  type: 'sessions';
  sessions: SessionInfo[];
};

export type AgentDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type AgentSessionStartedMessage = {
  type: 'session_started';
  session: SessionInfo;
};

export type AgentSessionEndedMessage = {
  type: 'session_ended';
  sessionId: SessionId;
};

export type AgentSessionReplayMessage = {
  type: 'session_replay';
  sessionId: SessionId;
  data: string; // base64 encoded scrollback
  lineCount: number;
};

export type AgentPongMessage = {
  type: 'pong';
};

export type AgentMessage =
  | AgentRegisterMessage
  | AgentSessionsMessage
  | AgentDataMessage
  | AgentSessionStartedMessage
  | AgentSessionEndedMessage
  | AgentSessionReplayMessage
  | AgentPongMessage;

// Relay → Agent messages
export type RelayRegisteredMessage = {
  type: 'registered';
  success: boolean;
  machineId?: string;
  error?: string;
};

export type RelayListSessionsMessage = {
  type: 'list_sessions';
};

export type RelayStartSessionMessage = {
  type: 'start_session';
  name: string;
  command?: string;
};

export type RelayAttachMessage = {
  type: 'attach';
  sessionId: SessionId;
  clientId: string;
  requestReplay?: boolean;
  replayLines?: number;
};

export type RelayDetachMessage = {
  type: 'detach';
  sessionId: SessionId;
  clientId: string;
};

export type RelayDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type RelayResizeMessage = {
  type: 'resize';
  sessionId: SessionId;
  cols: number;
  rows: number;
};

export type RelayPingMessage = {
  type: 'ping';
};

export type RelayToAgentMessage =
  | RelayRegisteredMessage
  | RelayListSessionsMessage
  | RelayStartSessionMessage
  | RelayAttachMessage
  | RelayDetachMessage
  | RelayDataMessage
  | RelayResizeMessage
  | RelayPingMessage;
