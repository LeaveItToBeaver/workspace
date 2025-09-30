const request = require('supertest');
const express = require('express');
const { createMockFirebase, createMockWeatherResponse } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/config/environment', () => ({
    PORT: 8080,
    NODE_ENV: 'test',
    FIREBASE_DATABASE_URL: 'https://test.firebaseio.com/',
    OPENWEATHER_API_KEY: 'test-key',
    OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    getServiceAccount: () => ({ type: 'service_account', project_id: 'test' })
}));
jest.mock('axios');

const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const userRoutes = require('../../src/routes/userRoutes');
const errorHandler = require('../../src/middleware/errorHandler');

const createTestApp = () => {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/users', userRoutes);
    app.use(errorHandler);

    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Cannot ${req.method} ${req.url}`,
        });
    });

    return app;
};

describe('API Performance Tests', () => {
    let app;
    let mockFirebase;

    beforeEach(() => {
        app = createTestApp();
        mockFirebase = createMockFirebase();

        const database = require('../../src/config/database');
        database.initialize = jest.fn().mockResolvedValue(true);
        database.getUsersRef = jest.fn().mockReturnValue(mockFirebase.ref());
        database.getServerTimestamp = jest.fn().mockReturnValue(Date.now());

        axios.get.mockResolvedValue({
            data: createMockWeatherResponse(),
        });
    });

    afterEach(() => {
        mockFirebase.clearMockData();
        jest.clearAllMocks();
    });

    describe('Response Times', () => {
        it('should respond to user creation quickly', async () => {
            const start = Date.now();

            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe',
                    zipCode: '12345',
                });

            const duration = Date.now() - start;
            expect(response.status).toBe(201);
            expect(duration).toBeLessThan(1000); // Should complete in under 1 second
        });
    });

    describe('Load Testing', () => {
        it('should handle multiple simultaneous user creations', async () => {
            const numberOfRequests = 10;
            const requests = Array.from({ length: numberOfRequests }, (_, i) =>
                request(app)
                    .post('/api/users')
                    .send({
                        name: `User ${i + 1}`,
                        zipCode: '12345',
                    })
            );

            const start = Date.now();
            const responses = await Promise.all(requests);
            const duration = Date.now() - start;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            });

            // Should complete all requests in reasonable time
            expect(duration).toBeLessThan(5000); // 5 seconds for 10 requests

            // Verify all users were created
            const getAllResponse = await request(app).get('/api/users');
            expect(getAllResponse.body.count).toBe(numberOfRequests);
        });

        it('should handle rapid GET requests efficiently', async () => {
            // Create some test data first
            await request(app)
                .post('/api/users')
                .send({ name: 'Test User', zipCode: '12345' });

            const numberOfRequests = 20;
            const requests = Array.from({ length: numberOfRequests }, () =>
                request(app).get('/api/users')
            );

            const start = Date.now();
            const responses = await Promise.all(requests);
            const duration = Date.now() - start;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            // Should be very fast for read operations
            expect(duration).toBeLessThan(2000); // 2 seconds for 20 requests
        });
    });

    describe('Memory and Resource Management', () => {
        it('should not leak memory during multiple operations', async () => {
            const initialMemory = process.memoryUsage().heapUsed;

            // Perform many operations
            for (let i = 0; i < 50; i++) {
                await request(app)
                    .post('/api/users')
                    .send({
                        name: `User ${i}`,
                        zipCode: '12345',
                    });
            }

            // Get all users (should be 50)
            const getAllResponse = await request(app).get('/api/users');
            expect(getAllResponse.body.count).toBe(50);

            // Delete all users
            for (let i = 0; i < 50; i++) {
                const users = getAllResponse.body.data;
                if (users[i]) {
                    await request(app).delete(`/api/users/${users[i].id}`);
                }
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;

            // Memory should not increase dramatically (allow for some variance)
            expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
        });

        it('should handle API timeout scenarios', async () => {
            // Mock a timeout error
            const timeoutError = new Error('Request timeout');
            timeoutError.code = 'ECONNABORTED';
            axios.get.mockRejectedValue(timeoutError);

            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe',
                    zipCode: '12345',
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
