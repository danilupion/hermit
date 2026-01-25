import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  attachClientToSession,
  clearClients,
  detachClientFromSession,
  getClient,
  getClientsAttachedToSession,
  getClientsByUserId,
  registerClient,
  unregisterClient,
} from './clients.js';

describe('Client registry', () => {
  const mockWs = { send: vi.fn(), close: vi.fn() } as unknown as Parameters<
    typeof registerClient
  >[2];

  beforeEach(() => {
    clearClients();
  });

  afterEach(() => {
    clearClients();
  });

  describe('registerClient', () => {
    it('registers a client', () => {
      registerClient('client-1', 'user-1', mockWs);

      const client = getClient('client-1');
      expect(client).toBeDefined();
      expect(client?.userId).toBe('user-1');
    });
  });

  describe('unregisterClient', () => {
    it('removes a client', () => {
      registerClient('client-1', 'user-1', mockWs);
      unregisterClient('client-1');

      expect(getClient('client-1')).toBeUndefined();
    });
  });

  describe('getClientsByUserId', () => {
    it('returns clients for a user', () => {
      registerClient('client-1', 'user-1', mockWs);
      registerClient('client-2', 'user-1', mockWs);
      registerClient('client-3', 'user-2', mockWs);

      const clients = getClientsByUserId('user-1');
      expect(clients).toHaveLength(2);
    });
  });

  describe('session attachment', () => {
    it('attaches client to session', () => {
      registerClient('client-1', 'user-1', mockWs);
      attachClientToSession('client-1', 'session-1', 'machine-1');

      const client = getClient('client-1');
      expect(client?.attachedSessions.get('session-1')).toBe('machine-1');
    });

    it('detaches client from session', () => {
      registerClient('client-1', 'user-1', mockWs);
      attachClientToSession('client-1', 'session-1', 'machine-1');
      detachClientFromSession('client-1', 'session-1');

      const client = getClient('client-1');
      expect(client?.attachedSessions.has('session-1')).toBe(false);
    });

    it('finds clients attached to a session', () => {
      registerClient('client-1', 'user-1', mockWs);
      registerClient('client-2', 'user-1', mockWs);
      registerClient('client-3', 'user-1', mockWs);

      attachClientToSession('client-1', 'session-1', 'machine-1');
      attachClientToSession('client-2', 'session-1', 'machine-1');
      attachClientToSession('client-3', 'session-2', 'machine-1');

      const attached = getClientsAttachedToSession('machine-1', 'session-1');
      expect(attached).toHaveLength(2);
    });
  });
});
