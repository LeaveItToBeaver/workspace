describe('Configuration Tests', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset modules to ensure fresh config loading
        jest.resetModules();
        process.env = {
            ...originalEnv,
            // Set required vars to prevent exit
            FIREBASE_DATABASE_URL: 'https://test.firebaseio.com/',
            OPENWEATHER_API_KEY: 'test-key'
        };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Environment Configuration', () => {
        it('should load default values when environment variables are not set', () => {
            delete process.env.PORT;
            delete process.env.NODE_ENV;

            const config = require('../../src/config/environment');

            expect(config.PORT).toBe(8080);
            expect(config.NODE_ENV).toBe('development');
        });

        it('should use environment variables when provided', () => {
            process.env.PORT = '3000';
            process.env.NODE_ENV = 'production';

            const config = require('../../src/config/environment');

            expect(config.PORT).toBe('3000');
            expect(config.NODE_ENV).toBe('production');
        });

        it('should parse service account from environment variable', () => {
            const mockServiceAccount = {
                type: 'service_account',
                project_id: 'test-project',
                client_email: 'test@test.iam.gserviceaccount.com',
            };

            process.env.SERVICE_ACCOUNT_KEY = JSON.stringify(mockServiceAccount);

            const config = require('../../src/config/environment');
            const serviceAccount = config.getServiceAccount();

            expect(serviceAccount).toEqual(mockServiceAccount);
        });
    });
});