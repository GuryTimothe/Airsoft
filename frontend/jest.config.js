// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/assets/(.*)$": "<rootDir>/src/assets/$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest"],
    "^.+\\.(jpg|jpeg|png|gif|webp|svg)$": "jest-transform-stub",
  },
};

module.exports = createJestConfig(config);
