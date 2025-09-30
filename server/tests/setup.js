// Global test setup

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests
process.env.FIREBASE_DATABASE_URL = 'https://test-project.firebaseio.com/';
process.env.OPENWEATHER_API_KEY = 'test-api-key';

// Mock console methods to reduce noise in tests
const originalConsole = console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});
