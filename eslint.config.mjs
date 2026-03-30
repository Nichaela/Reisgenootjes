import js from "@eslint/js"
import globals from "globals"
import { defineConfig } from "eslint/config"

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
      // naamgeving
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

      // stijl
      semi: ["error", "never"],
      "no-extra-semi": "error",

      // witruimte en leesbaarheid
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
      "padded-blocks": ["error", "never"],
      "eol-last": ["error", "always"],

      // codekwaliteit
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-redeclare": "error",
      "no-console": "off",

      // voorkeur voor modernere syntax
      "prefer-const": "error",
      "object-shorthand": ["error", "always"],
      "prefer-arrow-callback": [
        "error",
        { allowNamedFunctions: false, allowUnboundThis: true }
      ],

      // veiligheid / duidelijkheid
      eqeqeq: ["error", "always"],
      curly: ["error", "multi-line"],
      "dot-notation": "error"
    }
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs"
    }
  }
])
