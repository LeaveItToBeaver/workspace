const request = require('supertest');
const express = require('express');
const validation = require('../../src/middleware/validation');

describe('Validation Middleware', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
    });

    describe('validateCreateUser', () => {
        beforeEach(() => {
            app.post('/test', validation.validateCreateUser, (req, res) => {
                res.json({ success: true, data: req.body });
            });
        });

        it('should pass validation with valid data', async () => {
            const validData = {
                name: 'John Doe',
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should reject empty name', async () => {
            const invalidData = {
                name: '',
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Validation failed');
            expect(response.body.details).toContainEqual(
                expect.objectContaining({
                    field: 'name',
                    message: 'Name is required',
                })
            );
        });

        it('should reject name that is too short', async () => {
            const invalidData = {
                name: 'A',
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.details).toContainEqual(
                expect.objectContaining({
                    field: 'name',
                    message: 'Name must be between 2 and 100 characters',
                })
            );
        });

        it('should reject name with invalid characters', async () => {
            const invalidData = {
                name: 'John123',
                zipCode: '12345',
            };

            const response = await request(app)
                .post('/test')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.details).toContainEqual(
                expect.objectContaining({
                    field: 'name',
                    message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
                })
            );
        });

        it('should accept valid name variations', async () => {
            const validNames = [
                "John Doe",
                "Mary-Jane",
                "O'Connor",
            ];

            for (const name of validNames) {
                const response = await request(app)
                    .post('/test')
                    .send({ name, zipCode: '12345' });

                expect(response.status).toBe(200);
            }
        });

        it('should reject invalid zip codes', async () => {
            const invalidZipCodes = [
                { zipCode: '', error: 'Zip code is required' },
                { zipCode: '1234', error: 'Zip code must be exactly 5 digits' },
                { zipCode: '123456', error: 'Zip code must be exactly 5 digits' },
                { zipCode: 'ABCDE', error: 'Zip code must be exactly 5 digits' },
            ];

            for (const { zipCode, error } of invalidZipCodes) {
                const response = await request(app)
                    .post('/test')
                    .send({ name: 'John Doe', zipCode });

                expect(response.status).toBe(400);
                expect(response.body.details).toContainEqual(
                    expect.objectContaining({
                        field: 'zipCode',
                        message: error,
                    })
                );
            }
        });

        it('should trim whitespace from inputs', async () => {
            const dataWithWhitespace = {
                name: '  John Doe  ',
                zipCode: '  12345  ',
            };

            const response = await request(app)
                .post('/test')
                .send(dataWithWhitespace);

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('John Doe');
            expect(response.body.data.zipCode).toBe('12345');
        });
    });

    describe('validateUpdateUser', () => {
        beforeEach(() => {
            app.put('/test', validation.validateUpdateUser, (req, res) => {
                res.json({ success: true, data: req.body });
            });
        });

        it('should pass validation with valid partial update', async () => {
            const validData = {
                name: 'Jane Smith',
            };

            const response = await request(app)
                .put('/test')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should pass validation with empty body (no updates)', async () => {
            const response = await request(app)
                .put('/test')
                .send({});

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
