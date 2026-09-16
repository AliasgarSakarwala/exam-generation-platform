import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  coverageReporters: ["text", "lcov"],
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!.next/**",
    "!coverage/**",
    "!app/settings/**",
    "app/components/SettingsComponents.tsx",
    "!app/api/**",
    "!services/**",
    "!context/**",
    "!lib/**",
    "!app/layout.tsx",
    "!app/provider.tsx",
    "!app/Test/**",
    "!jest.config.ts",
    "!jest.setup.ts",
    "!middleware.ts",
    "!next-env.d.ts",
    "!next.config.ts",
    "!app/components/sub-components/**"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/coverage/",
  ],
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);