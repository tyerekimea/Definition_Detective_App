const nextConfig = require('eslint-config-next');

module.exports = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      '.mobile-build-backup/**',
      'build/**',
      'android/**',
      'test-openai.ts',
      'testSmartHint.ts',
      'quick-test.ts',
      'quick-test-hint.ts',
      'debug-flows.ts',
      'firebase-debug.log'
    ]
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/purity': 'off',
      'react/no-unescaped-entities': 'off'
    }
  }
];
