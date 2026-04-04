import js from "@eslint/js"
import globals from "globals"
import { defineConfig } from "eslint/config"
import html from "@html-eslint/eslint-plugin"
import htmlParser from "@html-eslint/parser"

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      camelcase: ["error", { properties: "never" }],
      "id-match": [
        "error",
        "^[a-z][a-zA-Z0-9]*$",
        {
          onlyDeclarations: true,
          properties: false,
          ignoreDestructuring: true
        }
      ],
      semi: ["error", "never"],
      "no-extra-semi": "error",
      "no-multiple-empty-lines": [
        "error",
        { max: 2, maxEOF: 1 }
      ],
      "padded-blocks": ["error", "never"],
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" }
      ],
      "no-undef": "error",
      "no-redeclare": "error",
      "no-console": "off",
      "prefer-const": "error",
      "object-shorthand": ["error", "always"],
      "prefer-arrow-callback": [
        "error",
        {
          allowNamedFunctions: false,
          allowUnboundThis: true
        }
      ],
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"],
      "dot-notation": "error"
    }
  },
  {
    files: ["**/*.html", "**/*.ejs"],
    plugins: {
      "@html-eslint": html
    },
    languageOptions: {
      parser: htmlParser
    },
    rules: {
      "@html-eslint/require-img-alt": "error"
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs"
    }
  },
  {
    rules: {
      semi: ["error", "never"]
    }
  }
])