import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { HermitConfig } from './config.js';

// Create unique test directory for this test run
const testId = `hermit-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const TEST_HOME = join(tmpdir(), testId);
const TEST_CONFIG_DIR = join(TEST_HOME, '.hermit');
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, 'config.json');

// Mock homedir before importing the config module
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => TEST_HOME,
  };
});

// Import after mocking
const { configExists, deleteConfig, loadConfig, saveConfig } = await import('./config.js');

describe('Config manager', () => {
  beforeAll(() => {
    // Ensure test home exists
    mkdirSync(TEST_HOME, { recursive: true });
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(TEST_HOME)) {
      rmSync(TEST_HOME, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clean up config dir before each test
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up config dir after each test
    if (existsSync(TEST_CONFIG_DIR)) {
      rmSync(TEST_CONFIG_DIR, { recursive: true });
    }
  });

  describe('configExists', () => {
    it('returns false when config does not exist', () => {
      expect(configExists()).toBe(false);
    });

    it('returns true when config exists', () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, '{}');
      expect(configExists()).toBe(true);
    });
  });

  describe('saveConfig and loadConfig', () => {
    it('saves and loads config', () => {
      const config: HermitConfig = {
        machineId: 'machine-123',
        machineName: 'My Workstation',
        relayUrl: 'wss://relay.example.com/ws/agent',
        token: 'hmt_testtoken123',
      };

      saveConfig(config);
      const loaded = loadConfig();

      expect(loaded).toEqual(config);
    });

    it('creates config directory if it does not exist', () => {
      const config: HermitConfig = {
        machineId: 'machine-123',
        machineName: 'Test',
        relayUrl: 'wss://relay.example.com/ws/agent',
        token: 'hmt_test',
      };

      saveConfig(config);
      expect(existsSync(TEST_CONFIG_DIR)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('returns null for missing config', () => {
      expect(loadConfig()).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, 'not json');
      expect(loadConfig()).toBeNull();
    });

    it('returns null for config missing required fields', () => {
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, JSON.stringify({ machineId: 'test' }));
      expect(loadConfig()).toBeNull();
    });

    it('accepts config with empty machineId', () => {
      const config: HermitConfig = {
        machineId: '',
        machineName: 'Test',
        relayUrl: 'wss://relay.example.com/ws/agent',
        token: 'hmt_test',
      };
      mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      writeFileSync(TEST_CONFIG_FILE, JSON.stringify(config));
      expect(loadConfig()).toEqual(config);
    });
  });

  describe('deleteConfig', () => {
    it('deletes existing config', () => {
      const config: HermitConfig = {
        machineId: 'machine-123',
        machineName: 'Test',
        relayUrl: 'wss://relay.example.com/ws/agent',
        token: 'hmt_test',
      };

      saveConfig(config);
      expect(configExists()).toBe(true);

      deleteConfig();
      expect(configExists()).toBe(false);
    });

    it('does nothing if config does not exist', () => {
      expect(() => deleteConfig()).not.toThrow();
    });
  });
});
