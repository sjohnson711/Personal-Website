module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/__tests__/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  cacheDirectory: "<rootDir>/../node_modules/.cache/jest-frontend",
  clearMocks: true,
  transformIgnorePatterns: ["[\\\\/]node_modules[\\\\/](?!marked[\\\\/])"],
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", {
      tsconfig: {
        allowJs: true,
        target: "ES2020",
        module: "CommonJS",
        moduleResolution: "Node",
        jsx: "react-jsx",
        esModuleInterop: true,
        types: ["jest", "node"],
      },
    }],
  },
};
