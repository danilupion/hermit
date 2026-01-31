import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from './api';

describe('api', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('login', () => {
    it('should call the login endpoint with credentials', async () => {
      const response = {
        user: { id: 'user-1', email: 'test@example.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      });

      const result = await api.login('test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });
      expect(result).toEqual(response);
    });

    it('should throw error on invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      await expect(api.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should handle generic error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(api.login('test@example.com', 'password')).rejects.toThrow(
        'Request failed with status 500',
      );
    });
  });

  describe('register', () => {
    it('should call the register endpoint with credentials', async () => {
      const response = {
        user: { id: 'user-1', email: 'new@example.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      });

      const result = await api.register('new@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'new@example.com', password: 'password123' }),
      });
      expect(result).toEqual(response);
    });

    it('should throw error when email already registered', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already registered' }),
      });

      await expect(api.register('existing@example.com', 'password123')).rejects.toThrow(
        'Email already registered',
      );
    });
  });

  describe('getMachines', () => {
    it('should call the machines endpoint with auth header', async () => {
      const machines = [
        {
          id: 'machine-1',
          name: 'dev-machine',
          online: true,
          lastSeen: '2025-01-27',
          sessionCount: 2,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(machines),
      });

      const result = await api.getMachines('my-token');

      expect(mockFetch).toHaveBeenCalledWith('/api/machines', {
        headers: { Authorization: 'Bearer my-token' },
      });
      expect(result).toEqual(machines);
    });

    it('should throw error on unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      await expect(api.getMachines('invalid-token')).rejects.toThrow('Unauthorized');
    });
  });
});
