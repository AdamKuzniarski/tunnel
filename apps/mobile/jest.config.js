/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/**/__tests__/**/*.(test|spec).(ts|tsx)', '<rootDir>/**/*.(test|spec).(ts|tsx)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo/src/async-require/messageSocket$': '<rootDir>/test/mocks/expoMessageSocket.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    // Reduce noise from pure constants/style files if desired.
    '!src/theme/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/modules/',
    '/ios/',
    '/android/',
    '/.expo/',
    '/dist/',
  ],
};

