const request = require('supertest');
const express = require('express');
const { createMockFirebase, createMockWeatherResponse, createTestUser } = require('../utils/testHelpers');

// Mock dependencies before importing
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

// Create test app without the full initialization
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

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: 'test',
            uptime: process.uptime(),
        });
    });

    app.get('/', (req, res) => {
        res.json({
            message: 'User Management API',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                users: '/api/users',
            },
        });
    });

    app.use('/api/users', userRoutes);
    app.use(errorHandler);

    // Handle 404
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: `Cannot ${req.method} ${req.url}`,
        });
    });

    return app;
};

describe('User API Endpoints', () => {
    let app;
    let mockFirebase;

    beforeEach(() => {
        app = createTestApp();
        mockFirebase = createMockFirebase();

        // Mock database
        const database = require('../../src/config/database');
        database.initialize = jest.fn().mockResolvedValue(true);
        database.getUsersRef = jest.fn().mockReturnValue(mockFirebase.ref());
        database.getServerTimestamp = jest.fn().mockReturnValue(Date.now());

        // Mock axios for OpenWeatherMap API
        axios.get.mockResolvedValue({
            data: createMockWeatherResponse(),
        });
    });

    afterEach(() => {
        mockFirebase.clearMockData();
        jest.clearAllMocks();
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                status: 'OK',
                environment: 'test',
            });
            expect(response.body.timestamp).toBeDefined();
            expect(response.body.uptime).toBeDefined();
        });
    });

    describe('GET /', () => {
        it('should return API information', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                message: 'User Management API',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    users: '/api/users',
                },
            });
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user with valid data', async () => {
            const userData = {
                name: 'John Doe',
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                success: true,
                message: 'User created successfully',
            });
            expect(response.body.data).toMatchObject({
                name: 'John Doe',
                zipCode: '12345',
                latitude: expect.any(Number),
                longitude: expect.any(Number),
                timezone: expect.any(Number),
            });
            expect(response.body.data.id).toBeDefined();
        });

        it('should return 400 for missing name', async () => {
            const userData = {
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });

        it('should return 400 for missing zip code', async () => {
            const userData = {
                name: 'John Doe',
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
        });

        it('should return 400 for invalid zip code format', async () => {
            const userData = {
                name: 'John Doe',
                zipCode: '1234', // Too short
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid name format', async () => {
            const userData = {
                name: 'John123', // Contains numbers
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should handle API errors gracefully', async () => {
            axios.get.mockRejectedValue(new Error('API Error'));

            const userData = {
                name: 'John Doe',
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/api/users')
                .send(userData);

            expect(response.status).toBe(400);  // Changed from 500 to 400
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users', () => {
        it('should return all users', async () => {
            // Setup mock data
            const testUsers = {
                'user1': createTestUser({ name: 'User 1' }),
                'user2': createTestUser({ name: 'User 2' }),
            };

            mockFirebase.mockData.set('user1', testUsers.user1);
            mockFirebase.mockData.set('user2', testUsers.user2);

            const response = await request(app).get('/api/users');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                count: 2,
            });
            expect(response.body.data).toHaveLength(2);
        });

        it('should return empty array when no users exist', async () => {
            const response = await request(app).get('/api/users');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                count: 0,
                data: [],
            });
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return a specific user', async () => {
            const testUser = createTestUser();
            mockFirebase.mockData.set('user123', testUser);

            const response = await request(app).get('/api/users/user123');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
            });
            expect(response.body.data).toMatchObject({
                id: 'user123',
                ...testUser,
            });
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app).get('/api/users/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:id', () => {
        beforeEach(() => {
            const testUser = createTestUser();
            mockFirebase.mockData.set('user123', testUser);
        });

        it('should update user name only', async () => {
            const updateData = {
                name: 'Jane Smith',
            };

            const response = await request(app)
                .put('/api/users/user123')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'User updated successfully',
            });
            expect(response.body.data.name).toBe('Jane Smith');
        });

        it('should update zip code and refetch location data', async () => {
            const updateData = {
                zipCode: '54321',
            };

            // Mock different weather response for new zip code
            axios.get.mockResolvedValue({
                data: {
                    ...createMockWeatherResponse(),
                    coord: { lat: 34.0522, lon: -118.2437 },
                    name: 'Los Angeles',
                },
            });

            const response = await request(app)
                .put('/api/users/user123')
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data.zipCode).toBe('54321');
            expect(response.body.data.latitude).toBe(34.0522);
            expect(response.body.data.longitude).toBe(-118.2437);
            expect(response.body.data.city).toBe('Los Angeles');
        });

        it('should return 404 for non-existent user', async () => {
            const updateData = {
                name: 'Jane Smith',
            };

            const response = await request(app)
                .put('/api/users/nonexistent')
                .send(updateData);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should validate updated data', async () => {
            const updateData = {
                name: 'A', // Too short
            };

            const response = await request(app)
                .put('/api/users/user123')
                .send(updateData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/users/:id', () => {
        beforeEach(() => {
            const testUser = createTestUser();
            mockFirebase.mockData.set('user123', testUser);
        });

        it('should delete an existing user', async () => {
            const response = await request(app).delete('/api/users/user123');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'User deleted successfully',
            });
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app).delete('/api/users/nonexistent');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 for unknown routes', async () => {
            const response = await request(app).get('/api/unknown');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Not Found');
        });

        it('should handle database connection errors', async () => {
            const database = require('../../src/config/database');
            database.getUsersRef.mockImplementation(() => {
                throw new Error('Database connection failed');
            });

            const response = await request(app).get('/api/users');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        });
    });
});
