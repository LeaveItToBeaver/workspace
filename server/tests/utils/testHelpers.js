// Test utilities and helpers
const request = require('supertest');

/**
 * Mock Firebase Admin SDK
 */
const createMockFirebase = () => {
    const mockData = new Map();

    const mockRef = {
        once: jest.fn(),
        push: jest.fn(),
        child: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    // Mock database methods
    mockRef.once.mockImplementation((eventType) => {
        if (eventType === 'value') {
            const data = Object.fromEntries(mockData);
            return Promise.resolve({
                val: () => Object.keys(data).length > 0 ? data : null,
                exists: () => Object.keys(data).length > 0,
            });
        }
        return Promise.resolve({ val: () => null, exists: () => false });
    });

    mockRef.child.mockImplementation((path) => ({
        ...mockRef,
        once: jest.fn().mockImplementation((eventType) => {
            if (eventType === 'value') {
                const data = mockData.get(path);
                return Promise.resolve({
                    val: () => data || null,
                    exists: () => !!data,
                });
            }
            return Promise.resolve({ val: () => null, exists: () => false });
        }),
        set: jest.fn().mockImplementation((data) => {
            mockData.set(path, data);
            return Promise.resolve();
        }),
        update: jest.fn().mockImplementation((data) => {
            const existing = mockData.get(path) || {};
            mockData.set(path, { ...existing, ...data });
            return Promise.resolve();
        }),
        remove: jest.fn().mockImplementation(() => {
            mockData.delete(path);
            return Promise.resolve();
        }),
    }));

    mockRef.push.mockImplementation(() => {
        const id = `mock-id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        return {
            ...mockRef.child(id),
            key: id,
        };
    });

    mockRef.set.mockImplementation((data) => {
        // For root level sets
        Object.entries(data).forEach(([key, value]) => {
            mockData.set(key, value);
        });
        return Promise.resolve();
    });

    return {
        ref: () => mockRef,
        mockData,
        clearMockData: () => mockData.clear(),
    };
};

/**
 * Mock OpenWeatherMap API responses
 */
const createMockWeatherResponse = (zipCode = '12345') => ({
    coord: {
        lat: 40.7128,
        lon: -74.0060,
    },
    weather: [
        {
            description: 'clear sky',
        },
    ],
    name: 'New York',
    sys: {
        country: 'US',
    },
    timezone: -18000, // UTC-5 in seconds
});

/**
 * Create test user data
 */
const createTestUser = (overrides = {}) => ({
    name: 'John Doe',
    zipCode: '12345',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: -18000,
    timezoneOffset: '-05:00',
    city: 'New York',
    state: 'NY',
    country: 'US',
    currentWeather: 'clear sky',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
});

/**
 * Create invalid test data for validation tests
 */
const createInvalidUserData = () => [
    { name: '', zipCode: '12345', error: 'Name is required' },
    { name: 'A', zipCode: '12345', error: 'Name must be between 2 and 100 characters' },
    { name: 'John123', zipCode: '12345', error: 'Name can only contain letters' },
    { name: 'John Doe', zipCode: '', error: 'Zip code is required' },
    { name: 'John Doe', zipCode: '1234', error: 'Zip code must be exactly 5 digits' },
    { name: 'John Doe', zipCode: 'ABCDE', error: 'Zip code must be exactly 5 digits' },
];

/**
 * Helper to make authenticated requests
 */
const makeRequest = (app) => request(app);

/**
 * Wait for a promise to resolve with timeout
 */
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    createMockFirebase,
    createMockWeatherResponse,
    createTestUser,
    createInvalidUserData,
    makeRequest,
    waitFor,
};
