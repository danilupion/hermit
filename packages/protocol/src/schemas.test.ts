import { describe, expect, it } from 'vitest';

import {
  safeParseAgentMessage,
  safeParseClientMessage,
  safeParseRelayToAgentMessage,
  safeParseRelayToClientMessage,
} from './schemas.js';

describe('Agent message schemas', () => {
  it('parses valid register message', () => {
    const result = safeParseAgentMessage({
      type: 'register',
      machineName: 'workstation',
      token: 'hmt_abc123',
    });
    expect(result.success).toBe(true);
  });

  it('parses valid sessions message', () => {
    const result = safeParseAgentMessage({
      type: 'sessions',
      sessions: [
        {
          id: 'session-1',
          name: 'claude',
          command: 'claude',
          createdAt: '2025-01-24T00:00:00Z',
          attachedClients: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid message type', () => {
    const result = safeParseAgentMessage({
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const result = safeParseAgentMessage({
      type: 'register',
      // missing machineName and token
    });
    expect(result.success).toBe(false);
  });
});

describe('Relay to agent message schemas', () => {
  it('parses valid registered message', () => {
    const result = safeParseRelayToAgentMessage({
      type: 'registered',
      success: true,
      machineId: 'machine-uuid',
    });
    expect(result.success).toBe(true);
  });

  it('parses valid ping message', () => {
    const result = safeParseRelayToAgentMessage({ type: 'ping' });
    expect(result.success).toBe(true);
  });
});

describe('Client message schemas', () => {
  it('parses valid auth message', () => {
    const result = safeParseClientMessage({
      type: 'auth',
      token: 'jwt.token.here',
    });
    expect(result.success).toBe(true);
  });

  it('parses valid attach message', () => {
    const result = safeParseClientMessage({
      type: 'attach',
      machineId: 'machine-1',
      sessionId: 'session-1',
    });
    expect(result.success).toBe(true);
  });
});

describe('Relay to client message schemas', () => {
  it('parses valid authenticated message', () => {
    const result = safeParseRelayToClientMessage({
      type: 'authenticated',
      user: {
        id: 'user-uuid',
        email: 'test@example.com',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email in user', () => {
    const result = safeParseRelayToClientMessage({
      type: 'authenticated',
      user: {
        id: 'user-uuid',
        email: 'not-an-email',
      },
    });
    expect(result.success).toBe(false);
  });

  it('parses valid machines message', () => {
    const result = safeParseRelayToClientMessage({
      type: 'machines',
      machines: [
        {
          id: 'machine-1',
          name: 'workstation',
          online: true,
          lastSeen: '2025-01-24T00:00:00Z',
          sessionCount: 2,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('parses valid error message', () => {
    const result = safeParseRelayToClientMessage({
      type: 'error',
      code: 'UNAUTHORIZED',
      message: 'Invalid token',
    });
    expect(result.success).toBe(true);
  });
});
