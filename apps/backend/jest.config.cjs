/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["dotenv/config"],
  globals: {
    '^.+\\.tsx?$': [
    "ts-jest", {
      tsconfig: "./tsconfig.jest.json",
    },]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@storefront/config$": "<rootDir>/../../packages/config/src/index",
    "^@storefront/types$": "<rootDir>/../../packages/types/src/index",
  },
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/db/migrate.ts",
    "!src/db/seeds/**",
  ],
};

module.exports = config;
