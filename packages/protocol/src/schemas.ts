import { z } from 'zod';

// Shared type schemas
export const SessionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  command: z.string(),
  createdAt: z.string(),
  attachedClients: z.number(),
});

export const MachineInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  online: z.boolean(),
  lastSeen: z.string(),
  sessionCount: z.number(),
});

export const UserInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

// Agent → Relay message schemas
export const AgentMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('register'),
    machineName: z.string(),
    machineId: z.string().optional(),
    token: z.string(),
  }),
  z.object({ type: z.literal('sessions'), sessions: z.array(SessionInfoSchema) }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({ type: z.literal('session_started'), session: SessionInfoSchema }),
  z.object({ type: z.literal('session_ended'), sessionId: z.string() }),
  z.object({
    type: z.literal('session_replay'),
    sessionId: z.string(),
    data: z.string(),
    lineCount: z.number(),
  }),
  z.object({ type: z.literal('pong') }),
]);

// Relay → Agent message schemas
export const RelayToAgentMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('registered'),
    success: z.boolean(),
    machineId: z.string().optional(),
    error: z.string().optional(),
  }),
  z.object({ type: z.literal('list_sessions') }),
  z.object({ type: z.literal('start_session'), name: z.string(), command: z.string().optional() }),
  z.object({
    type: z.literal('attach'),
    sessionId: z.string(),
    clientId: z.string(),
    requestReplay: z.boolean().optional(),
    replayLines: z.number().optional(),
  }),
  z.object({ type: z.literal('detach'), sessionId: z.string(), clientId: z.string() }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({
    type: z.literal('resize'),
    sessionId: z.string(),
    cols: z.number(),
    rows: z.number(),
  }),
  z.object({ type: z.literal('ping') }),
]);

// Client → Relay message schemas
export const ClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('auth'), token: z.string() }),
  z.object({ type: z.literal('list_machines') }),
  z.object({ type: z.literal('list_sessions'), machineId: z.string() }),
  z.object({
    type: z.literal('attach'),
    machineId: z.string(),
    sessionId: z.string(),
    requestReplay: z.boolean().optional(),
    replayLines: z.number().optional(),
  }),
  z.object({ type: z.literal('detach'), sessionId: z.string() }),
  z.object({
    type: z.literal('create_session'),
    machineId: z.string(),
    name: z.string(),
    command: z.string().optional(),
  }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({
    type: z.literal('resize'),
    sessionId: z.string(),
    cols: z.number(),
    rows: z.number(),
  }),
  z.object({ type: z.literal('pong') }),
]);

// Relay → Client message schemas
export const RelayToClientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('authenticated'), user: UserInfoSchema }),
  z.object({ type: z.literal('machines'), machines: z.array(MachineInfoSchema) }),
  z.object({
    type: z.literal('sessions'),
    machineId: z.string(),
    sessions: z.array(SessionInfoSchema),
  }),
  z.object({ type: z.literal('attached'), sessionId: z.string() }),
  z.object({ type: z.literal('detached'), sessionId: z.string() }),
  z.object({ type: z.literal('data'), sessionId: z.string(), data: z.string() }),
  z.object({ type: z.literal('machine_online'), machine: MachineInfoSchema }),
  z.object({ type: z.literal('machine_offline'), machineId: z.string() }),
  z.object({
    type: z.literal('session_started'),
    machineId: z.string(),
    session: SessionInfoSchema,
  }),
  z.object({ type: z.literal('session_ended'), machineId: z.string(), sessionId: z.string() }),
  z.object({
    type: z.literal('session_replay'),
    sessionId: z.string(),
    data: z.string(),
    lineCount: z.number(),
  }),
  z.object({ type: z.literal('error'), code: z.string(), message: z.string() }),
  z.object({ type: z.literal('ping') }),
]);

// Parse helpers
export const parseAgentMessage = (data: unknown) => AgentMessageSchema.parse(data);
export const parseRelayToAgentMessage = (data: unknown) => RelayToAgentMessageSchema.parse(data);
export const parseClientMessage = (data: unknown) => ClientMessageSchema.parse(data);
export const parseRelayToClientMessage = (data: unknown) => RelayToClientMessageSchema.parse(data);

// Safe parse helpers (return result instead of throwing)
export const safeParseAgentMessage = (data: unknown) => AgentMessageSchema.safeParse(data);
export const safeParseRelayToAgentMessage = (data: unknown) =>
  RelayToAgentMessageSchema.safeParse(data);
export const safeParseClientMessage = (data: unknown) => ClientMessageSchema.safeParse(data);
export const safeParseRelayToClientMessage = (data: unknown) =>
  RelayToClientMessageSchema.safeParse(data);
