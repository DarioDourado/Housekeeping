import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

// - Regras do .agents/20-rules; as que o código atual ainda viola estão em 'warn'
//   e sobem a 'error' na sub-tarefa do plano que as limpa (4.2, 4.5, 4.6)
export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.agents', 'public']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-imports': ['error', { patterns: [{ group: ['../*'], message: 'Usar alias @/' }] }],
      'no-restricted-syntax': ['warn', { selector: 'ExportDefaultDeclaration', message: 'Named exports (20-rules)' }],
    },
  },
  {
    files: ['*.config.{ts,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-restricted-syntax': 'off' },
  },
]);
