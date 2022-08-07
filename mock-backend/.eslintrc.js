module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  overrides: [
    {
      files: ['*.ts'],
      extends: ['airbnb-typescript'],
      parserOptions: {
        project: ['./tsconfig.json'], // Specify it only for TypeScript files
      },
      rules: {
        'react/jsx-filename-extension': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
  ],
  rules: {
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    'no-unused-vars': ['error', { args: 'after-used' }],
    'react/jsx-filename-extension': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
  },
};
