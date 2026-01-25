import { describe, expect, it } from 'vitest';

import {
  generateAccessToken,
  generateMachineToken,
  generateRefreshToken,
  hashMachineToken,
  hashPassword,
  verifyMachineToken,
  verifyPassword,
  verifyToken,
} from './auth.js';

describe('Auth service', () => {
  describe('hashPassword', () => {
    it('returns a hash different from the password', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const password = 'mysecretpassword';
      const hash = await hashPassword(password);

      const result = await verifyPassword('wrongpassword', hash);
      expect(result).toBe(false);
    });
  });

  describe('JWT tokens', () => {
    it('generates and verifies access token', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';

      const token = await generateAccessToken(userId, email);
      const payload = await verifyToken(token);

      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe(email);
    });

    it('generates and verifies refresh token', async () => {
      const userId = 'user-123';

      const token = await generateRefreshToken(userId);
      const payload = await verifyToken(token);

      expect(payload.sub).toBe(userId);
      expect(payload.type).toBe('refresh');
    });

    it('rejects invalid token', async () => {
      await expect(verifyToken('invalid-token')).rejects.toThrow();
    });
  });

  describe('Machine tokens', () => {
    it('generates token with hmt_ prefix', () => {
      const token = generateMachineToken();
      expect(token.startsWith('hmt_')).toBe(true);
      expect(token.length).toBeGreaterThan(10);
    });

    it('hashes and verifies machine token', async () => {
      const token = generateMachineToken();
      const hash = await hashMachineToken(token);

      expect(await verifyMachineToken(token, hash)).toBe(true);
      expect(await verifyMachineToken('wrong-token', hash)).toBe(false);
    });
  });
});
