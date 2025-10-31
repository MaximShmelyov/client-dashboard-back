import js from '@eslint/js';
import json from '@eslint/json';
import { defineConfig } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import cyrillicBan from './eslint-plugin-cyrillic-ban.js';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    plugins: { cyrillicBan, import: importPlugin },
    extends: [js.configs.recommended, prettier],
    languageOptions: { globals: globals.node },
    ignores: ['node_modules', '.idea', 'package-lock.json'],
    rules: {
      semi: 'error',
      'import/order': ['error', { alphabetize: { order: 'asc' } }],
      'cyrillicBan/no-cyrillic-string': 'error',
    },
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.json'],
    language: 'json/json',
    extends: [json.configs.recommended],
  },
]);
