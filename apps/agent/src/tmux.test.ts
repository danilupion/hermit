import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock child_process
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  spawn: vi.fn(() => ({
    stdin: { write: vi.fn(), end: vi.fn() },
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    kill: vi.fn(),
  })),
}));

import { execFileSync } from 'node:child_process';

import {
  createSession,
  isTmuxAvailable,
  killSession,
  listSessions,
  sessionExists,
  toSessionInfo,
} from './tmux.js';

const mockExecFileSync = vi.mocked(execFileSync);

describe('Tmux controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isTmuxAvailable', () => {
    it('returns true when tmux is available', () => {
      mockExecFileSync.mockReturnValueOnce(Buffer.from('/usr/bin/tmux'));
      expect(isTmuxAvailable()).toBe(true);
    });

    it('returns false when tmux is not available', () => {
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('not found');
      });
      expect(isTmuxAvailable()).toBe(false);
    });
  });

  describe('listSessions', () => {
    it('returns empty array when no sessions', () => {
      const error = new Error('no server running') as Error & { status: number; stderr: Buffer };
      error.status = 1;
      error.stderr = Buffer.from('no server running on /tmp/tmux-501/default');
      mockExecFileSync.mockImplementationOnce(() => {
        throw error;
      });

      expect(listSessions()).toEqual([]);
    });

    it('parses tmux output correctly', () => {
      const now = Math.floor(Date.now() / 1000);
      mockExecFileSync.mockReturnValueOnce(
        `$0:main:${now}:0\n$1:dev:${now}:1` as unknown as Buffer,
      );

      const sessions = listSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions[0].name).toBe('main');
      expect(sessions[0].attached).toBe(false);
      expect(sessions[1].name).toBe('dev');
      expect(sessions[1].attached).toBe(true);
    });

    it('returns empty array for empty output', () => {
      mockExecFileSync.mockReturnValueOnce('' as unknown as Buffer);
      expect(listSessions()).toEqual([]);
    });
  });

  describe('sessionExists', () => {
    it('returns true when session exists', () => {
      mockExecFileSync.mockReturnValueOnce('' as unknown as Buffer);
      expect(sessionExists('main')).toBe(true);
    });

    it('returns false when session does not exist', () => {
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error("can't find session: main");
      });
      expect(sessionExists('main')).toBe(false);
    });
  });

  describe('createSession', () => {
    it('creates a session and returns info', () => {
      const now = Math.floor(Date.now() / 1000);
      mockExecFileSync.mockReturnValueOnce(`$5:${now}` as unknown as Buffer);

      const session = createSession('test-session');
      expect(session.id).toBe('5');
      expect(session.name).toBe('test-session');
      expect(session.attached).toBe(false);
    });

    it('passes command when provided', () => {
      const now = Math.floor(Date.now() / 1000);
      mockExecFileSync.mockReturnValueOnce(`$5:${now}` as unknown as Buffer);

      createSession('test-session', 'bash');
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'tmux',
        [
          'new-session',
          '-d',
          '-s',
          'test-session',
          '-P',
          '-F',
          '#{session_id}:#{session_created}',
          'bash',
        ],
        expect.any(Object),
      );
    });
  });

  describe('killSession', () => {
    it('calls tmux kill-session', () => {
      mockExecFileSync.mockReturnValueOnce('' as unknown as Buffer);
      killSession('test-session');
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'tmux',
        ['kill-session', '-t', 'test-session'],
        expect.any(Object),
      );
    });
  });

  describe('toSessionInfo', () => {
    it('converts TmuxSession to SessionInfo', () => {
      const tmuxSession = {
        id: '5',
        name: 'main',
        createdAt: new Date('2025-01-24T12:00:00Z'),
        attached: true,
      };

      const info = toSessionInfo(tmuxSession);
      expect(info.id).toBe('5');
      expect(info.name).toBe('main');
      expect(info.createdAt).toBe('2025-01-24T12:00:00.000Z');
      expect(info.attachedClients).toBe(1);
    });

    it('sets attachedClients to 0 when not attached', () => {
      const tmuxSession = {
        id: '5',
        name: 'main',
        createdAt: new Date('2025-01-24T12:00:00Z'),
        attached: false,
      };

      const info = toSessionInfo(tmuxSession);
      expect(info.attachedClients).toBe(0);
    });
  });
});
