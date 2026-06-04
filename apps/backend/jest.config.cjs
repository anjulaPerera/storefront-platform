/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"], // Removed non-existent tests directory path
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    // Strips trailing .js extensions so Jest maps cleanly onto your local .ts source files
    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    // Fixes the ts-jest deprecation warning by extracting tsconfig targeting options here
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "./tsconfig.jest.json" }],
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
