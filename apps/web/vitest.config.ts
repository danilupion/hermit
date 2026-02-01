import reactPreset from '@slango.configs/vitest/react';
import path from 'node:path';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  reactPreset,
  defineConfig({
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      passWithNoTests: true,
      coverage: {
        exclude: ['node_modules/**', 'src/styled-system/**', '**/*.config.{js,ts}', 'dist/**'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
);
