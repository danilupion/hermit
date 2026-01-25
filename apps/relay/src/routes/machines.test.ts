import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../index.js';

// Mock the repositories
vi.mock('../repositories/machines.js', () => ({
  createMachine: vi.fn(),
  findMachineByUserAndName: vi.fn(),
  findMachinesByUserId: vi.fn(),
}));

// Mock the auth service
vi.mock('../services/auth.js', () => ({
  generateMachineToken: vi.fn().mockReturnValue('hmt_test-token'),
  hashMachineToken: vi.fn().mockResolvedValue('hashed'),
  verifyToken: vi.fn().mockResolvedValue({ sub: 'user-uuid', email: 'test@example.com' }),
}));

// Mock the db
vi.mock('../db/index.js', () => ({
  runMigrations: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
}));

import {
  createMachine,
  findMachineByUserAndName,
  findMachinesByUserId,
} from '../repositories/machines.js';

const mockCreateMachine = vi.mocked(createMachine);
const mockFindMachineByUserAndName = vi.mocked(findMachineByUserAndName);
const mockFindMachinesByUserId = vi.mocked(findMachinesByUserId);

describe('Machine routes', () => {
  const validToken = 'Bearer valid-jwt-token';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/machines', () => {
    it('returns machines for authenticated user', async () => {
      mockFindMachinesByUserId.mockResolvedValueOnce([
        {
          id: 'machine-1',
          name: 'workstation',
          online: false,
          lastSeen: '2025-01-24T00:00:00Z',
          sessionCount: 0,
        },
      ]);

      const res = await app.request('/api/machines', {
        headers: { Authorization: validToken },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { machines: Array<{ name: string }> };
      expect(body.machines).toHaveLength(1);
      expect(body.machines[0].name).toBe('workstation');
    });

    it('returns 401 without auth header', async () => {
      const res = await app.request('/api/machines');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/machines', () => {
    it('creates machine and returns token', async () => {
      mockFindMachineByUserAndName.mockResolvedValueOnce(null);
      mockCreateMachine.mockResolvedValueOnce({
        id: 'machine-uuid',
        name: 'my-laptop',
        online: false,
        lastSeen: '2025-01-24T00:00:00Z',
        sessionCount: 0,
      });

      const res = await app.request('/api/machines', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'my-laptop' }),
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as { machine: { name: string }; token: string };
      expect(body.machine.name).toBe('my-laptop');
      expect(body.token).toBe('hmt_test-token');
    });

    it('returns 400 for duplicate name', async () => {
      mockFindMachineByUserAndName.mockResolvedValueOnce({
        id: 'existing',
        user_id: 'user-uuid',
        name: 'my-laptop',
        token_hash: 'hash',
        last_seen: null,
        created_at: new Date(),
      });

      const res = await app.request('/api/machines', {
        method: 'POST',
        headers: {
          Authorization: validToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'my-laptop' }),
      });

      expect(res.status).toBe(400);
    });
  });
});
