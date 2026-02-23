import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  { ignores: ['dist'] },

  // TypeScript recommended: sets up TS parser, enables TS rules,
  // and disables base ESLint rules that TS handles better (like no-unused-vars)
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],

    settings: {
      react: { version: 'detect' },
    },

    languageOptions: {
      // tseslint.configs.recommended already sets the parser and handles
      // ecmaVersion, sourceType, and JSX support for TS files.
      // We only need browser globals here.
      globals: globals.browser,
    },

    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      'simple-import-sort': simpleImportSort,
    },

    rules: {
      // Base ESLint recommended rules (things like no-debugger, no-undef, etc.)
      ...eslint.configs.recommended.rules,

      // React plugin recommended rules
      ...react.configs.recommended.rules,

      // React hooks recommended (sets rules-of-hooks: error, exhaustive-deps: warn)
      ...reactHooks.configs.recommended.rules,

      // Modern React (17+) doesn't need React in scope for JSX
      'react/react-in-jsx-scope': 'off',

      // Using TypeScript for prop validation instead
      'react/prop-types': 'off',

      // Allows apostrophes etc. in JSX text — matter of preference
      'react/no-unescaped-entities': 'off',

      // Disable base no-unused-vars; tseslint's version (from recommended) handles this
      'no-unused-vars': 'off',

      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Vite HMR: warn if exports aren't components
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Catch missing keys in lists
      'react/jsx-key': 'warn',

      // Catch typos in HTML/SVG attributes in JSX
      'react/no-unknown-property': 'warn',
    },
  },
];
