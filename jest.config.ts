import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/__tests__/**/*.test.ts", "<rootDir>/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "app/api/**/*.ts",
    "lib/**/*.ts",
    "components/**/*.tsx",
    "!**/*.d.ts",
  ],
};

export default createJestConfig(config);
