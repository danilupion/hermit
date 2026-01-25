import type { MachineId, MachineInfo, SessionId, SessionInfo, UserInfo } from './types.js';

// Client → Relay messages
export type ClientAuthMessage = {
  type: 'auth';
  token: string;
};

export type ClientListMachinesMessage = {
  type: 'list_machines';
};

export type ClientListSessionsMessage = {
  type: 'list_sessions';
  machineId: MachineId;
};

export type ClientAttachMessage = {
  type: 'attach';
  machineId: MachineId;
  sessionId: SessionId;
};

export type ClientDetachMessage = {
  type: 'detach';
  sessionId: SessionId;
};

export type ClientCreateSessionMessage = {
  type: 'create_session';
  machineId: MachineId;
  name: string;
  command?: string;
};

export type ClientDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type ClientResizeMessage = {
  type: 'resize';
  sessionId: SessionId;
  cols: number;
  rows: number;
};

export type ClientPongMessage = {
  type: 'pong';
};

export type ClientMessage =
  | ClientAuthMessage
  | ClientListMachinesMessage
  | ClientListSessionsMessage
  | ClientAttachMessage
  | ClientDetachMessage
  | ClientCreateSessionMessage
  | ClientDataMessage
  | ClientResizeMessage
  | ClientPongMessage;

// Relay → Client messages
export type RelayAuthenticatedMessage = {
  type: 'authenticated';
  user: UserInfo;
};

export type RelayMachinesMessage = {
  type: 'machines';
  machines: MachineInfo[];
};

export type RelaySessionsMessage = {
  type: 'sessions';
  machineId: MachineId;
  sessions: SessionInfo[];
};

export type RelayAttachedMessage = {
  type: 'attached';
  sessionId: SessionId;
};

export type RelayDetachedMessage = {
  type: 'detached';
  sessionId: SessionId;
};

export type RelayClientDataMessage = {
  type: 'data';
  sessionId: SessionId;
  data: string; // base64 encoded
};

export type RelayMachineOnlineMessage = {
  type: 'machine_online';
  machine: MachineInfo;
};

export type RelayMachineOfflineMessage = {
  type: 'machine_offline';
  machineId: MachineId;
};

export type RelaySessionStartedMessage = {
  type: 'session_started';
  machineId: MachineId;
  session: SessionInfo;
};

export type RelaySessionEndedMessage = {
  type: 'session_ended';
  machineId: MachineId;
  sessionId: SessionId;
};

export type RelayErrorMessage = {
  type: 'error';
  code: string;
  message: string;
};

export type RelayClientPingMessage = {
  type: 'ping';
};

export type RelayToClientMessage =
  | RelayAuthenticatedMessage
  | RelayMachinesMessage
  | RelaySessionsMessage
  | RelayAttachedMessage
  | RelayDetachedMessage
  | RelayClientDataMessage
  | RelayMachineOnlineMessage
  | RelayMachineOfflineMessage
  | RelaySessionStartedMessage
  | RelaySessionEndedMessage
  | RelayErrorMessage
  | RelayClientPingMessage;
