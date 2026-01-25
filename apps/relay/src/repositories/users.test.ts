import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createUser, findUserByEmail, findUserById } from './users.js';

// Mock the db module
vi.mock('../db/index.js', () => ({
  query: vi.fn(),
}));

// Mock the auth service
vi.mock('../services/auth.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
}));

import { query } from '../db/index.js';

const mockQuery = vi.mocked(query);

describe('User repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('inserts user and returns UserInfo', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-uuid', email: 'test@example.com' }],
        command: 'INSERT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await createUser('test@example.com', 'password123');

      expect(result).toEqual({
        id: 'user-uuid',
        email: 'test@example.com',
      });
      expect(mockQuery).toHaveBeenCalledWith(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        ['test@example.com', 'hashed_password'],
      );
    });
  });

  describe('findUserByEmail', () => {
    it('returns user when found', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@example.com',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValueOnce({
        rows: [mockUser],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await findUserByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await findUserByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('returns UserInfo when found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-uuid', email: 'test@example.com' }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await findUserById('user-uuid');
      expect(result).toEqual({ id: 'user-uuid', email: 'test@example.com' });
    });

    it('returns null when not found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        command: 'SELECT',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      const result = await findUserById('unknown-id');
      expect(result).toBeNull();
    });
  });
});
