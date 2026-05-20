import type { Config } from 'jest';

const config: Config = {
  displayName: 'integration',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
  moduleNameMapper: {
    '^@brushia/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
    '^@brushia/config(.*)$': '<rootDir>/../../packages/config/src$1',
    '^@brushia/db(.*)$': '<rootDir>/../../packages/db/src$1',
  },
  setupFilesAfterSetup: ['<rootDir>/test/setup/test-db.ts'],
  testTimeout: 30000, // DB operations can be slow
  verbose: true,
};

export default config;
