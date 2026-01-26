import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export type HermitConfig = {
  machineId: string;
  machineName: string;
  relayUrl: string;
  token: string;
};

const CONFIG_DIR = join(homedir(), '.hermit');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export const getConfigPath = (): string => CONFIG_FILE;

export const getConfigDir = (): string => CONFIG_DIR;

export const configExists = (): boolean => {
  return existsSync(CONFIG_FILE);
};

export const loadConfig = (): HermitConfig | null => {
  if (!configExists()) {
    return null;
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content) as HermitConfig;

    // Validate required fields (machineId can be empty initially)
    if (!config.machineName || !config.relayUrl || !config.token) {
      return null;
    }

    return config;
  } catch {
    return null;
  }
};

export const saveConfig = (config: HermitConfig): void => {
  const dir = dirname(CONFIG_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
};

export const deleteConfig = (): void => {
  if (existsSync(CONFIG_FILE)) {
    unlinkSync(CONFIG_FILE);
  }
};
