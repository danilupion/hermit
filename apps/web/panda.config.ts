import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
  jsxFramework: 'react',
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#3b82f6' },
          'primary.hover': { value: '#2563eb' },
          surface: { value: '#1e1e2e' },
          'surface.hover': { value: '#313244' },
          background: { value: '#11111b' },
          text: { value: '#cdd6f4' },
          muted: { value: '#6c7086' },
          border: { value: '#313244' },
          success: { value: '#a6e3a1' },
          error: { value: '#f38ba8' },
        },
        fonts: {
          mono: { value: 'JetBrains Mono, Menlo, Monaco, monospace' },
        },
      },
    },
  },
});
