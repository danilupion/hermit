import type { SessionInfo } from '@hermit/protocol/types.js';

import { loadConfig, saveConfig } from '../config.js';
import { createRelayConnection, type RelayConnection } from '../relay-connection.js';
import {
  attachControlMode,
  captureScrollback,
  createSession,
  listSessions,
  type TmuxControlSession,
  toSessionInfo,
} from '../tmux.js';

type ConnectOptions = {
  daemon?: boolean;
};

let relayConnection: RelayConnection | null = null;
const attachedSessions = new Map<string, TmuxControlSession>();

export const connectCommand = (options: ConnectOptions): void => {
  const config = loadConfig();
  if (!config) {
    console.error('Error: Hermit is not configured.');
    console.error('Run `hermit init` first to configure the agent.');
    process.exit(1);
  }

  if (options.daemon) {
    console.log('Daemon mode not yet implemented');
    console.log('Running in foreground...');
  }

  console.log(`Connecting to relay as "${config.machineName}"...`);

  relayConnection = createRelayConnection({
    relayUrl: config.relayUrl,
    machineName: config.machineName,
    machineId: config.machineId || undefined,
    token: config.token,

    onRegistered: (machineId) => {
      console.log(`Registered with machine ID: ${machineId}`);
      // Update config with machine ID
      if (!config.machineId) {
        config.machineId = machineId;
        saveConfig(config);
      }
    },

    onListSessions: (): SessionInfo[] => {
      return listSessions().map(toSessionInfo);
    },

    onStartSession: (name, command): SessionInfo | null => {
      try {
        const session = createSession(name, command);
        return toSessionInfo(session);
      } catch (error) {
        console.error('Failed to create session:', error);
        return null;
      }
    },

    onAttach: ({ sessionId, clientId, requestReplay, replayLines }) => {
      console.log(`Client ${clientId} attaching to session ${sessionId}`);

      // Send scrollback replay if requested (default: true)
      if (requestReplay !== false) {
        const lines = replayLines ?? 1000;
        const scrollback = captureScrollback(sessionId, lines);
        if (scrollback) {
          const base64 = Buffer.from(scrollback).toString('base64');
          relayConnection?.sendSessionReplay(sessionId, base64, lines);
        }
      }

      // If not already attached, start streaming output via control mode
      if (!attachedSessions.has(sessionId)) {
        const ctrl = attachControlMode(sessionId);
        attachedSessions.set(sessionId, ctrl);

        ctrl.onOutput((data) => {
          const base64 = Buffer.from(data).toString('base64');
          relayConnection?.sendData(sessionId, base64);
        });
      }
    },

    onDetach: (sessionId, clientId) => {
      console.log(`Client ${clientId} detaching from session ${sessionId}`);
      // Note: We keep the session attached for now, in case other clients are viewing
      // Could implement reference counting later
    },

    onData: (sessionId, data) => {
      const ctrl = attachedSessions.get(sessionId);
      if (ctrl) {
        const decoded = Buffer.from(data, 'base64').toString();
        ctrl.sendKeys(decoded);
      }
    },

    onResize: (sessionId, cols, rows) => {
      const ctrl = attachedSessions.get(sessionId);
      if (ctrl) {
        ctrl.resize(cols, rows);
      }
    },

    onError: (error) => {
      console.error('Connection error:', error.message);
    },

    onDisconnect: () => {
      // Clean up attached sessions
      for (const [, ctrl] of attachedSessions) {
        ctrl.close();
      }
      attachedSessions.clear();
    },
  });

  relayConnection.connect();

  // Handle shutdown
  const shutdown = (): void => {
    console.log('\nShutting down...');
    relayConnection?.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  console.log('Press Ctrl+C to disconnect');
};
