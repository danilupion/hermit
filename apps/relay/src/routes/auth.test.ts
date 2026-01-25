import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../index.js';

// Mock the repositories
vi.mock('../repositories/users.js', () => ({
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
}));

// Mock the auth service
vi.mock('../services/auth.js', () => ({
  generateAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockResolvedValue('mock-refresh-token'),
  verifyPassword: vi.fn(),
}));

// Mock the db
vi.mock('../db/index.js', () => ({
  runMigrations: vi.fn().mockResolvedValue(undefined),
  query: vi.fn(),
}));

import { createUser, findUserByEmail } from '../repositories/users.js';
import { verifyPassword } from '../services/auth.js';

const mockCreateUser = vi.mocked(createUser);
const mockFindUserByEmail = vi.mocked(findUserByEmail);
const mockVerifyPassword = vi.mocked(verifyPassword);

describe('Auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('creates user and returns tokens', async () => {
      mockFindUserByEmail.mockResolvedValueOnce(null);
      mockCreateUser.mockResolvedValueOnce({
        id: 'user-uuid',
        email: 'test@example.com',
      });

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.email).toBe('test@example.com');
      expect(body.accessToken).toBe('mock-access-token');
      expect(body.refreshToken).toBe('mock-refresh-token');
    });

    it('returns 400 for existing email', async () => {
      mockFindUserByEmail.mockResolvedValueOnce({
        id: 'existing-user',
        email: 'test@example.com',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid email', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for short password', async () => {
      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'short',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('returns tokens for valid credentials', async () => {
      mockFindUserByEmail.mockResolvedValueOnce({
        id: 'user-uuid',
        email: 'test@example.com',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockVerifyPassword.mockResolvedValueOnce(true);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.accessToken).toBe('mock-access-token');
    });

    it('returns 401 for unknown user', async () => {
      mockFindUserByEmail.mockResolvedValueOnce(null);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 for wrong password', async () => {
      mockFindUserByEmail.mockResolvedValueOnce({
        id: 'user-uuid',
        email: 'test@example.com',
        password_hash: 'hash',
        created_at: new Date(),
        updated_at: new Date(),
      });
      mockVerifyPassword.mockResolvedValueOnce(false);

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      expect(res.status).toBe(401);
    });
  });
});
