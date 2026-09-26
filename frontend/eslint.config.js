import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      // Catches a JSX component that is used but never imported or defined.
      // This is what turns a silent white page into a lint error.
      'react/jsx-no-undef': 'error',
      'no-undef': 'error',

      // React 19 no longer needs the import at all.
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],

      // Not worth the noise for this codebase.
      'react/prop-types': 'off',

      // Every page fetches with useEffect(() => { load(); }, []). That is the
      // pattern used throughout the app, so keep it rather than rewriting the
      // whole data layer to satisfy this rule.
      'react-hooks/set-state-in-effect': 'off',

      // The UI is in French, so straight apostrophes in JSX text are everywhere.
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.node },
  },
];
