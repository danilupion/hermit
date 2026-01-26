import { execFileSync, spawn } from 'node:child_process';

import type { SessionInfo } from '@hermit/protocol/types.js';

export type TmuxSession = {
  id: string;
  name: string;
  createdAt: Date;
  attached: boolean;
};

const runTmux = (args: string[]): string => {
  try {
    return execFileSync('tmux', args, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const execError = error as { status?: number; stderr?: Buffer | string };
    const stderr = execError.stderr?.toString() || '';
    if (execError.status === 1 && stderr.includes('no server running')) {
      return '';
    }
    throw error;
  }
};

export const isTmuxAvailable = (): boolean => {
  try {
    execFileSync('which', ['tmux'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
};

export const listSessions = (): TmuxSession[] => {
  const output = runTmux([
    'list-sessions',
    '-F',
    '#{session_id}:#{session_name}:#{session_created}:#{session_attached}',
  ]);

  if (!output) {
    return [];
  }

  return output.split('\n').map((line) => {
    const [id, name, createdTimestamp, attached] = line.split(':');
    return {
      id: id.replace('$', ''),
      name,
      createdAt: new Date(Number(createdTimestamp) * 1000),
      attached: attached === '1',
    };
  });
};

export const sessionExists = (name: string): boolean => {
  try {
    runTmux(['has-session', '-t', name]);
    return true;
  } catch {
    return false;
  }
};

export const createSession = (name: string, command?: string): TmuxSession => {
  const args = ['new-session', '-d', '-s', name, '-P', '-F', '#{session_id}:#{session_created}'];
  if (command) {
    args.push(command);
  }

  const output = runTmux(args);
  const [id, createdTimestamp] = output.split(':');

  return {
    id: id.replace('$', ''),
    name,
    createdAt: new Date(Number(createdTimestamp) * 1000),
    attached: false,
  };
};

export const killSession = (name: string): void => {
  runTmux(['kill-session', '-t', name]);
};

export const toSessionInfo = (session: TmuxSession): SessionInfo => {
  return {
    id: session.id,
    name: session.name,
    command: 'tmux', // tmux doesn't easily expose the command
    createdAt: session.createdAt.toISOString(),
    attachedClients: session.attached ? 1 : 0,
  };
};

export const sendKeys = (sessionId: string, data: string): void => {
  // Use spawn to handle binary data properly
  const tmux = spawn('tmux', ['send-keys', '-t', `$${sessionId}`, '-l', data]);
  tmux.stdin.end();
};

export const capturePane = (sessionId: string): string => {
  return runTmux(['capture-pane', '-t', `$${sessionId}`, '-p']);
};

export type PtyProcess = {
  onData: (callback: (data: string) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  kill: () => void;
};

export const attachToSession = (sessionId: string): PtyProcess => {
  const tmux = spawn('tmux', ['attach-session', '-t', `$${sessionId}`], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const callbacks: ((data: string) => void)[] = [];

  tmux.stdout.on('data', (data: Buffer) => {
    const str = data.toString();
    callbacks.forEach((cb) => cb(str));
  });

  tmux.stderr.on('data', (data: Buffer) => {
    const str = data.toString();
    callbacks.forEach((cb) => cb(str));
  });

  return {
    onData: (callback) => {
      callbacks.push(callback);
    },
    write: (data) => {
      tmux.stdin.write(data);
    },
    resize: (cols, rows) => {
      runTmux(['resize-window', '-t', `$${sessionId}`, '-x', String(cols), '-y', String(rows)]);
    },
    kill: () => {
      tmux.kill();
    },
  };
};
