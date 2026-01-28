import typescriptNext from '@slango.configs/eslint/typescript-next.js';

const eslintConfig = [
  ...typescriptNext,
  {
    ignores: ['src/styled-system/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
