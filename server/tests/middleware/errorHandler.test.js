const request = require('supertest');
const express = require('express');
const errorHandler = require('../../src/middleware/errorHandler');

describe('Error Handler Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Standard Error Handling', () => {
        it('should handle validation errors with 400 status', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Validation failed');
                error.name = 'ValidationError';
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Validation Error',
                message: 'Validation failed',
            });
        });

        it('should handle cast errors with 400 status', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Invalid ID');
                error.name = 'CastError';
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Invalid ID Format',
                message: 'The provided ID is not valid',
            });
        });

        it('should handle duplicate entry errors with 409 status', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Duplicate key error');
                error.code = 11000;
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(409);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Duplicate Entry',
                message: 'A resource with this value already exists',
            });
        });

        it('should handle Firebase errors with 500 status', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Firebase connection failed');
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Database Error',
            });
        });

        it('should handle OpenWeather API errors with 503 status', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('OpenWeather API failed');
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(503);
            expect(response.body).toMatchObject({
                success: false,
                error: 'External Service Error',
                message: 'Unable to fetch location data. Please try again later.',
            });
        });
    });

    describe('Custom Status Code Handling', () => {
        it('should handle custom 404 errors', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('User not found');
                error.statusCode = 404;
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(404);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Not Found',
                message: 'User not found',
            });
        });

        it('should handle custom 400 errors', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Bad request data');
                error.statusCode = 400;
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Bad Request',
                message: 'Bad request data',
            });
        });

        it('should handle custom 401 errors', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Unauthorized access');
                error.statusCode = 401;
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Unauthorized',
                message: 'Unauthorized access',
            });
        });
    });

    describe('Default Error Handling', () => {
        it('should handle generic errors with 500 status', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error('Something went wrong');
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Error',
                message: 'Something went wrong',
            });
        });

        it('should handle errors without message', async () => {
            app.get('/test', (req, res, next) => {
                const error = new Error();
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                error: 'Error',
                message: 'Internal Server Error',
            });
        });
    });

    describe('Environment-specific Behavior', () => {
        const originalEnv = process.env.NODE_ENV;

        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });

        it('should include stack trace in development', async () => {
            process.env.NODE_ENV = 'development';

            app.get('/test', (req, res, next) => {
                const error = new Error('Test error');
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.stack).toBeDefined();
        });

        it('should exclude stack trace in production', async () => {
            process.env.NODE_ENV = 'production';

            app.get('/test', (req, res, next) => {
                const error = new Error('Test error');
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.stack).toBeUndefined();
        });

        it('should mask Firebase errors in production', async () => {
            process.env.NODE_ENV = 'production';

            app.get('/test', (req, res, next) => {
                const error = new Error('Firebase detailed error message');
                next(error);
            });
            app.use(errorHandler);

            const response = await request(app).get('/test');

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('A database error occurred');
        });
    });
});
