import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Global ignores (must be first)
  {
    ignores: [
      'dist/**',
      'dist-cjs/**',
      'node_modules/**',
      'coverage/**',
      'bin/**',
      '*.js',
      '*.mjs',
      '*.cjs',
      'examples/**',
      'scripts/**',
      'docker-test/**',
      'docs/**',
      'src/__tests__/**',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/**/*.js',
      'src/**/*.d.ts',
    ],
  },
  // TypeScript config for src files
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['src/**/*.ts'],
  })),
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // TypeScript handles undefined checking, so disable this
      'no-undef': 'off',
      // Allow let/const in switch case blocks
      'no-case-declarations': 'off',
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      // General rules
      'no-console': 'off',
      'no-useless-escape': 'warn',
      'no-useless-catch': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
];
