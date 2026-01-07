import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**', '.vscode/**'],
  },
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      indent: ['error', 2],
      'comma-dangle': ['error', 'only-multiline'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'keyword-spacing': 'error',
      'object-curly-spacing': ['error', 'always'],
      'arrow-spacing': 'error',
    },
  },
  {
    files: ['renderer.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
      },
    },
  },
];
