import javascriptNodeConfig from '@slango.configs/eslint/javascript-node.js';

const eslintConfig = [...javascriptNodeConfig, { ignores: ['apps/**', 'packages/**'] }];

export default eslintConfig;
