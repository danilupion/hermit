import type { SessionInfo } from '@hermit/protocol/types.js';

import { execFileSync, spawn } from 'node:child_process';

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
    // Handle "no server running" or "error connecting" (no tmux sessions)
    if (
      execError.status === 1 &&
      (stderr.includes('no server running') || stderr.includes('error connecting'))
    ) {
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
    execFileSync('tmux', ['has-session', '-t', name], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch {
    // Session doesn't exist, or tmux server not running
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

export const captureScrollback = (sessionId: string, lines: number = 1000): string => {
  // -p: print to stdout
  // -S -N: start N lines from history (negative = from scrollback)
  // -e: include escape sequences (colors)
  // -J: join wrapped lines
  return runTmux(['capture-pane', '-t', `$${sessionId}`, '-p', '-S', `-${lines}`, '-e', '-J']);
};

// Decode octal escapes from tmux control mode output (\012 → newline)
export const decodeOctal = (str: string): string => {
  return str.replace(/\\(\d{3})/g, (_match: string, octal: string) =>
    String.fromCharCode(parseInt(octal, 8)),
  );
};

export type TmuxControlSession = {
  onOutput: (callback: (data: string) => void) => void;
  sendKeys: (keys: string) => void;
  resize: (cols: number, rows: number) => void;
  close: () => void;
};

export const attachControlMode = (sessionId: string): TmuxControlSession => {
  const tmux = spawn('tmux', ['-CC', 'attach-session', '-t', `$${sessionId}`], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let outputCallback: ((data: string) => void) | null = null;
  let buffer = '';

  // Parse control mode output
  tmux.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();

    // Process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('%output ')) {
        // Format: %output %[pane-id] [octal-escaped-data]
        const match = line.match(/^%output %\d+ (.*)$/);
        if (match && outputCallback) {
          const decoded = decodeOctal(match[1]);
          outputCallback(decoded);
        }
      }
      // Other notifications (%window-add, %exit, etc.) can be handled here
    }
  });

  tmux.on('error', (err) => {
    console.error('Tmux control mode error:', err);
  });

  tmux.on('close', () => {
    buffer = '';
    outputCallback = null;
  });

  return {
    onOutput: (cb) => {
      outputCallback = cb;
    },
    sendKeys: (keys) => {
      // Use -l for literal keys (no special interpretation)
      // Escape special characters for tmux command
      const escaped = keys.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      tmux.stdin.write(`send-keys -t $${sessionId} -l "${escaped}"\n`);
    },
    resize: (cols, rows) => {
      tmux.stdin.write(`refresh-client -C ${cols},${rows}\n`);
    },
    close: () => {
      tmux.stdin.write('detach-client\n');
      tmux.kill();
    },
  };
};
