module.exports = {
  root: true,
  env: {
    node: true,
    jest: true,
    'react-native/react-native': true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint', 'react', 'react-native', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'react-native/no-inline-styles': 'warn',
    'import/no-unresolved': 'off'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    }
  ]
};
