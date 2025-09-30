module.exports = {
    // Test environment
    testEnvironment: 'node',

    // Test file patterns
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],

    // Ignore patterns
    testPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/'
    ],

    // Coverage configuration
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/**/*.spec.js',
        '!node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60
        }
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Module mapping for absolute imports
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },

    // Clear mocks between tests
    clearMocks: true,

    // Timeout for tests
    testTimeout: 10000,

    // Verbose output
    verbose: true
};