/* eslint-disable import/no-unresolved */
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

import markdown from "eslint-plugin-markdown";
import globals from "globals";
import react from "eslint-plugin-react";
// import jsxA11Y from "eslint-plugin-jsx-a11y";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

import typescriptEslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default tseslint.config([
  includeIgnoreFile(gitignorePath),
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylistic,
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  /* eslint-enable @typescript-eslint/no-unsafe-member-access */
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: {
          allowDefaultProject: ["eslint.config.mjs", "postcss.config.js"],
        },

        tsconfigRootDir: import.meta.dirname,
      },

      globals: {
        ...globals.browser,
        ...globals.commonjs,
      },
    },
    rules: {
      "@typescript-eslint/no-unnecessary-type-arguments": "off",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        {
          ignoreArrowShorthand: true,
          ignoreVoidOperator: true,
        },
      ],
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          allow: ["TypedResponse", "Response"],
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^__",
          caughtErrors: "all",
          destructuredArrayIgnorePattern: "^__",
          varsIgnorePattern: "^__",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],

    plugins: {
      react,
    },

    extends: [
      react.configs.flat.recommended, // This is not a plugin object, but a shareable config object
      react.configs.flat["jsx-runtime"], // Add this if you are using React 17+
      reactHooks.configs["recommended-latest"],
      // jsxA11Y.flatConfigs.recommended,
    ],

    settings: {
      react: {
        version: "detect",
      },

      formComponents: ["Form"],

      linkComponents: [
        {
          name: "Link",
          linkAttribute: "to",
        },
        {
          name: "NavLink",
          linkAttribute: "to",
        },
      ],
    },

    rules: {
      "react/jsx-no-leaked-render": [
        "warn",
        {
          validStrategies: ["ternary"],
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],

    plugins: {
      "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
      parser: tsParser,
    },

    settings: {
      "import/internal-regex": "^~/",

      "import/resolver": {
        node: {
          extensions: [".ts", ".tsx"],
        },

        typescript: {
          alwaysTryTypes: true,
        },
      },
    },

    rules: {
      "import/order": [
        "error",
        {
          alphabetize: {
            caseInsensitive: true,
            order: "asc",
          },

          groups: ["builtin", "external", "internal", "parent", "sibling"],
          "newlines-between": "always",
        },
      ],
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ...markdown.configs.recommended,
  {
    files: ["**/eslint.config.mjs", "mocks/**/*.js"],

    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  eslintPluginPrettierRecommended,
]);
