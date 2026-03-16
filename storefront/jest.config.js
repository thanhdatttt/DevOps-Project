/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
      tsconfig: { jsx: 'react-jsx', esModuleInterop: true },
    }],
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^styles/(.*)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  collectCoverageFrom: [
    'common/**/*.{ts,tsx}',
    'modules/address/**/*.{ts,tsx}',
    'modules/cart/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}',
    'asset/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
};

module.exports = config;
