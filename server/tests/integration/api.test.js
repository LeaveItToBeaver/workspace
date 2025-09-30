const request = require('supertest');
const express = require('express');
const { createMockFirebase, createMockWeatherResponse } = require('../utils/testHelpers');

// Mock all external dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/config/environment', () => ({
    PORT: 8080,
    NODE_ENV: 'test',
    FIREBASE_DATABASE_URL: 'https://test.firebaseio.com/',
    OPENWEATHER_API_KEY: 'test-key',
    OPENWEATHER_BASE_URL: 'https://api.openweathermap.org/data/2.5/weather',
    getServiceAccount: () => ({ type: 'service_account', project_id: 'test' })
}));
jest.mock('firebase-admin');
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

describe('User API Integration Tests', () => {
    let app;
    let mockFirebase;

    beforeEach(() => {
        app = createTestApp();
        mockFirebase = createMockFirebase();

        // Mock database initialization
        const database = require('../../src/config/database');
        database.initialize = jest.fn().mockResolvedValue(true);
        database.getUsersRef = jest.fn().mockReturnValue(mockFirebase.ref());
        database.getServerTimestamp = jest.fn().mockReturnValue(Date.now());

        // Mock successful OpenWeatherMap API response
        axios.get.mockResolvedValue({
            data: createMockWeatherResponse(),
        });
    });

    afterEach(() => {
        mockFirebase.clearMockData();
        jest.clearAllMocks();
    });

    describe('Complete User Lifecycle', () => {
        it('should create, read, update, and delete a user', async () => {
            // 1. Create user
            const createResponse = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe',
                    zipCode: '12345',
                });

            expect(createResponse.status).toBe(201);
            expect(createResponse.body.success).toBe(true);

            const userId = createResponse.body.data.id;
            expect(userId).toBeDefined();

            // 2. Read user
            const readResponse = await request(app).get(`/api/users/${userId}`);

            expect(readResponse.status).toBe(200);
            expect(readResponse.body.data).toMatchObject({
                id: userId,
                name: 'John Doe',
                zipCode: '12345',
                latitude: 40.7128,
                longitude: -74.0060,
                city: 'New York',
            });

            // 3. Update user
            axios.get.mockResolvedValue({
                data: {
                    ...createMockWeatherResponse(),
                    coord: { lat: 34.0522, lon: -118.2437 },
                    name: 'Los Angeles',
                },
            });

            const updateResponse = await request(app)
                .put(`/api/users/${userId}`)
                .send({
                    name: 'Jane Smith',
                    zipCode: '90210',
                });

            expect(updateResponse.status).toBe(200);
            expect(updateResponse.body.data).toMatchObject({
                name: 'Jane Smith',
                zipCode: '90210',
                latitude: 34.0522,
                longitude: -118.2437,
                city: 'Los Angeles',
            });

            // 4. Delete user
            const deleteResponse = await request(app).delete(`/api/users/${userId}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body.success).toBe(true);

            // 5. Verify user is deleted
            const verifyResponse = await request(app).get(`/api/users/${userId}`);
            expect(verifyResponse.status).toBe(404);
        });

        it('should handle multiple users correctly', async () => {
            // Create multiple users
            const users = [
                { name: 'User 1', zipCode: '12345' },
                { name: 'User 2', zipCode: '54321' },
                { name: 'User 3', zipCode: '67890' },
            ];

            const createdUsers = [];
            for (const userData of users) {
                const response = await request(app)
                    .post('/api/users')
                    .send(userData);

                expect(response.status).toBe(201);
                createdUsers.push(response.body.data);
            }

            // Get all users
            const getAllResponse = await request(app).get('/api/users');

            expect(getAllResponse.status).toBe(200);
            expect(getAllResponse.body.count).toBe(3);
            expect(getAllResponse.body.data).toHaveLength(3);

            // Verify each user exists individually
            for (const user of createdUsers) {
                const response = await request(app).get(`/api/users/${user.id}`);
                expect(response.status).toBe(200);
                expect(response.body.data.name).toBe(user.name);
            }
        });
    });

    describe('Error Scenarios', () => {
        it('should handle OpenWeatherMap API failures during user creation', async () => {
            axios.get.mockRejectedValue({
                response: { status: 404 },
                message: 'Not found',
            });

            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'John Doe',
                    zipCode: '99999', // Invalid zip code
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle database failures gracefully', async () => {
            const database = require('../../src/config/database');
            database.getUsersRef.mockImplementation(() => {
                throw new Error('Database connection lost');
            });

            const response = await request(app).get('/api/users');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Database Error');
        });

        it('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Content-Type', 'application/json')
                .send('{ invalid json }');

            expect(response.status).toBe(400);
        });

        it('should handle requests with no content type', async () => {
            const response = await request(app)
                .post('/api/users')
                .send('name=John&zipCode=12345');

            // Should still work with URL encoded data
            expect(response.status).toBe(201);
        });
    });

    describe('CORS and Security', () => {
        it('should include CORS headers', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3000');

            expect(response.headers['access-control-allow-origin']).toBeDefined();
        });

        it('should include security headers', async () => {
            const response = await request(app).get('/health');

            // Check for helmet security headers
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBeDefined();
        });

        it('should handle preflight OPTIONS requests', async () => {
            const response = await request(app)
                .options('/api/users')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'POST');

            expect(response.status).toBe(204);
        });
    });

    describe('Performance and Reliability', () => {
        it('should handle concurrent requests', async () => {
            const requests = Array.from({ length: 5 }, (_, i) =>
                request(app)
                    .post('/api/users')
                    .send({
                        name: `User ${i + 1}`,
                        zipCode: '12345',
                    })
            );

            const responses = await Promise.all(requests);

            responses.forEach(response => {
                expect(response.status).toBe(201);
                expect(response.body.success).toBe(true);
            });

            // Verify all users were created
            const getAllResponse = await request(app).get('/api/users');
            expect(getAllResponse.body.count).toBe(5);
        });

        it('should handle large payloads appropriately', async () => {
            const largeData = {
                name: 'A'.repeat(200), // Exceeds max length
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/api/users')
                .send(largeData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
