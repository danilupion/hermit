import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMachine,
  findMachineById,
  findMachineByUserAndName,
  findMachinesByUserId,
} from './machines.js';

// Mock the db module
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
}));

// Mock the auth service
vi.mock('../services/auth.js', () => ({
  hashMachineToken: vi.fn().mockResolvedValue('hashed_token'),
}));

import { query } from '../db/index.js';

const mockQuery = vi.mocked(query);

describe('Machine repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMachine', () => {
    it('inserts machine and returns MachineInfo', async () => {
      const createdAt = new Date();
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'machine-uuid',
            name: 'workstation',
            last_seen: null,
            created_at: createdAt,
          },
        ],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await createMachine('user-uuid', 'workstation', 'hmt_token');

      expect(result).toEqual({
        id: 'machine-uuid',
        name: 'workstation',
        online: false,
        lastSeen: createdAt.toISOString(),
        sessionCount: 0,
      });
    });
  });

  describe('findMachinesByUserId', () => {
    it('returns array of MachineInfo', async () => {
      const lastSeen = new Date();
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'm1', name: 'laptop', last_seen: lastSeen, created_at: new Date() },
          { id: 'm2', name: 'desktop', last_seen: null, created_at: new Date() },
        ],
        command: 'SELECT',
        rowCount: 2,
        oid: 0,
        fields: [],
      });

      const result = await findMachinesByUserId('user-uuid');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('laptop');
      expect(result[0].lastSeen).toBe(lastSeen.toISOString());
    });
  });

  describe('findMachineById', () => {
    it('returns machine row when found', async () => {
      const mockMachine = {
        id: 'machine-uuid',
        user_id: 'user-uuid',
        name: 'workstation',
        token_hash: 'hash',
        last_seen: null,
        created_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockMachine],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await findMachineById('machine-uuid');
      expect(result).toEqual(mockMachine);
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await findMachineById('unknown');
      expect(result).toBeNull();
    });
  });

  describe('findMachineByUserAndName', () => {
    it('returns machine when found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'machine-uuid', name: 'laptop' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await findMachineByUserAndName('user-uuid', 'laptop');
      expect(result).toBeDefined();
    });
  });
});
