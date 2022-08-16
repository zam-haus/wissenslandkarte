module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: ['./tsconfig.eslint.json'],
    extraFileExtensions: ['.svelte'],
  },
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {
        // need to disable the following, because of limitations of the svelte plugin
        // of course ideally they should be enabled and as soon as we can, we should do that
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/no-unresolved': 'off',
        'import/prefer-default-export': 'off',
        'svelte/indent': ['error', { indent: 2 }],
        indent: 'off',
        'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 2, maxEOF: 0 }],
      },
    },
  ],
  plugins: [
    'svelte3',
    '@typescript-eslint',
  ],
  settings: {
    'svelte3/typescript': true,
  },
  rules: {
    'react/jsx-filename-extension': 'off',
    'max-classes-per-file': 'off',
    'import/prefer-default-export': 'off',
    'no-restricted-syntax': 'off',
    'no-unused-vars': ['error', { args: 'after-used' }],
    '@typescript-eslint/no-use-before-define': 'off',
    // need to disable the following, because of limitations of the svelte plugin
    // of course ideally they should be enabled and as soon as we can, we should do that
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
  },
};
