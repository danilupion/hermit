import { hostname } from 'node:os';
import * as readline from 'node:readline';

import {
  configExists,
  getConfigPath,
  type HermitConfig,
  loadConfig,
  saveConfig,
} from '../config.js';
import { isTmuxAvailable } from '../tmux.js';

const prompt = (rl: readline.Interface, question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

type InitOptions = {
  relayUrl?: string;
  machineName?: string;
  token?: string;
  force?: boolean;
};

export const initCommand = async (options: InitOptions): Promise<void> => {
  // Check if tmux is available
  if (!isTmuxAvailable()) {
    console.error('Error: tmux is not installed or not in PATH');
    console.error('Please install tmux: brew install tmux (macOS) or apt install tmux (Linux)');
    process.exit(1);
  }

  // Check if already configured
  if (configExists() && !options.force) {
    const existingConfig = loadConfig();
    if (existingConfig) {
      console.log('Hermit is already configured for this machine.');
      console.log(`  Machine: ${existingConfig.machineName}`);
      console.log(`  Relay: ${existingConfig.relayUrl}`);
      console.log(`  Config: ${getConfigPath()}`);
      console.log('\nUse --force to reconfigure.');
      return;
    }
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Get relay URL
    let relayUrl = options.relayUrl;
    if (!relayUrl) {
      relayUrl = await prompt(rl, 'Relay URL (e.g., wss://hermit.example.com/ws/agent): ');
    }
    if (!relayUrl) {
      console.error('Error: Relay URL is required');
      process.exit(1);
    }

    // Validate relay URL
    try {
      const url = new URL(relayUrl);
      if (!['ws:', 'wss:'].includes(url.protocol)) {
        console.error('Error: Relay URL must start with ws:// or wss://');
        process.exit(1);
      }
    } catch {
      console.error('Error: Invalid relay URL');
      process.exit(1);
    }

    // Get machine name
    let machineName = options.machineName;
    if (!machineName) {
      const defaultName = hostname().split('.')[0];
      machineName = await prompt(rl, `Machine name [${defaultName}]: `);
      if (!machineName) {
        machineName = defaultName;
      }
    }

    // Get token
    let token = options.token;
    if (!token) {
      token = await prompt(rl, 'Machine token (from relay registration): ');
    }
    if (!token) {
      console.error('Error: Machine token is required');
      console.error('Register a machine via the relay web interface or API to get a token.');
      process.exit(1);
    }

    // Validate token format
    if (!token.startsWith('hmt_')) {
      console.error('Error: Invalid token format (should start with hmt_)');
      process.exit(1);
    }

    // Save config
    const config: HermitConfig = {
      machineId: '', // Will be set after successful registration
      machineName,
      relayUrl,
      token,
    };

    saveConfig(config);
    console.log('\nConfiguration saved to:', getConfigPath());
    console.log('\nNext steps:');
    console.log('  1. Run `hermit connect` to connect to the relay');
    console.log('  2. Use `hermit new <name>` to create a new session');
    console.log('  3. Use `hermit list` to see your sessions');
  } finally {
    rl.close();
  }
};
