import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  addAgentSession,
  clearAgents,
  getAgent,
  getAgentsByUserId,
  getAgentSessions,
  isAgentOnline,
  registerAgent,
  removeAgentSession,
  unregisterAgent,
  updateAgentSessions,
} from './agents.js';

describe('Agent registry', () => {
  const mockWs = { send: vi.fn(), close: vi.fn() } as unknown as Parameters<
    typeof registerAgent
  >[3];

  beforeEach(() => {
    clearAgents();
  });

  afterEach(() => {
    clearAgents();
  });

  describe('registerAgent', () => {
    it('registers an agent', () => {
      registerAgent('machine-1', 'Workstation', 'user-1', mockWs);

      const agent = getAgent('machine-1');
      expect(agent).toBeDefined();
      expect(agent?.machineName).toBe('Workstation');
      expect(agent?.userId).toBe('user-1');
    });
  });

  describe('unregisterAgent', () => {
    it('removes an agent', () => {
      registerAgent('machine-1', 'Workstation', 'user-1', mockWs);
      unregisterAgent('machine-1');

      expect(getAgent('machine-1')).toBeUndefined();
    });
  });

  describe('isAgentOnline', () => {
    it('returns true for registered agent', () => {
      registerAgent('machine-1', 'Workstation', 'user-1', mockWs);
      expect(isAgentOnline('machine-1')).toBe(true);
    });

    it('returns false for unknown agent', () => {
      expect(isAgentOnline('unknown')).toBe(false);
    });
  });

  describe('getAgentsByUserId', () => {
    it('returns agents for a user', () => {
      registerAgent('machine-1', 'Laptop', 'user-1', mockWs);
      registerAgent('machine-2', 'Desktop', 'user-1', mockWs);
      registerAgent('machine-3', 'Other', 'user-2', mockWs);

      const agents = getAgentsByUserId('user-1');
      expect(agents).toHaveLength(2);
    });
  });

  describe('session management', () => {
    it('updates and retrieves sessions', () => {
      registerAgent('machine-1', 'Workstation', 'user-1', mockWs);

      updateAgentSessions('machine-1', [
        {
          id: 'session-1',
          name: 'claude',
          command: 'claude',
          createdAt: '2025-01-24T00:00:00Z',
          attachedClients: 0,
        },
      ]);

      const sessions = getAgentSessions('machine-1');
      expect(sessions).toHaveLength(1);
      expect(sessions[0].name).toBe('claude');
    });

    it('adds a session', () => {
      registerAgent('machine-1', 'Workstation', 'user-1', mockWs);

      addAgentSession('machine-1', {
        id: 'session-1',
        name: 'bash',
        command: 'bash',
        createdAt: '2025-01-24T00:00:00Z',
        attachedClients: 0,
      });

      expect(getAgentSessions('machine-1')).toHaveLength(1);
    });

    it('removes a session', () => {
      registerAgent('machine-1', 'Workstation', 'user-1', mockWs);
      addAgentSession('machine-1', {
        id: 'session-1',
        name: 'bash',
        command: 'bash',
        createdAt: '2025-01-24T00:00:00Z',
        attachedClients: 0,
      });

      removeAgentSession('machine-1', 'session-1');
      expect(getAgentSessions('machine-1')).toHaveLength(0);
    });
  });
});
