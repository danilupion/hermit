export type MachineId = string;
export type SessionId = string;
export type UserId = string;
export type ClientId = string;

export type SessionInfo = {
  id: SessionId;
  name: string;
  command: string;
  createdAt: string;
  attachedClients: number;
};

export type MachineInfo = {
  id: MachineId;
  name: string;
  online: boolean;
  lastSeen: string;
  sessionCount: number;
};

export type UserInfo = {
  id: UserId;
  email: string;
};
