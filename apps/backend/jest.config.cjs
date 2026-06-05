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
    "^.+\\.tsx?$": ["ts-jest", { 
      tsconfig: "./tsconfig.jest.json",
      diagnostics: { ignoreCodes: [151002]} 
    }],
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
