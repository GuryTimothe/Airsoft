import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "jest.config.js",
    "jest.setup.ts",
    "postcss.config.mjs",
    "next.config.ts",
  ]),
]);

export default eslintConfig;
