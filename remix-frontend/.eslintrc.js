/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  env: {
    "cypress/globals": true,
  },
  plugins: ["cypress", "simple-import-sort", "unused-imports"],
  // we're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but it means we have to explicitly
  // set the jest version.
  settings: {
    jest: {
      version: 28,
    },
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/no-misused-promises": "error",
      },
    },
    {
      files: ["**/*.ts", "**/*.tsx"],
      excludedFiles: ["./cypress", "./cypress.config.ts"],
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ["./cypress", "./cypress.config.ts", "vitest.config.ts"],
      parserOptions: {
        project: "./tsconfig.spec.json",
        tsconfigRootDir: __dirname,
      },
    },
  ],
  rules: {
    "simple-import-sort/imports": "error",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "error",
      {
        vars: "all",
        varsIgnorePattern: "^_",
        args: "after-used",
        argsIgnorePattern: "^_",
      },
    ],
    "import/newline-after-import": ["error", { count: 1 }],
  },
};
