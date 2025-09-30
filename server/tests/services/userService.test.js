const { createMockFirebase, createMockWeatherResponse, createTestUser } = require('../utils/testHelpers');

// Mock dependencies
jest.mock('../../src/repositories/userRepository');
jest.mock('../../src/services/geolocationService');

const userService = require('../../src/services/userService');
const userRepository = require('../../src/repositories/userRepository');
const geolocationService = require('../../src/services/geolocationService');

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllUsers', () => {
        it('should return all users', async () => {
            const mockUsers = [
                createTestUser({ name: 'User 1' }),
                createTestUser({ name: 'User 2' }),
            ];
            userRepository.findAll.mockResolvedValue(mockUsers);

            const result = await userService.getAllUsers();

            expect(result).toEqual(mockUsers);
            expect(userRepository.findAll).toHaveBeenCalledTimes(1);
        });

        it('should throw error when repository fails', async () => {
            userRepository.findAll.mockRejectedValue(new Error('Database error'));

            await expect(userService.getAllUsers()).rejects.toThrow('Service error: Database error');
        });
    });

    describe('getUserById', () => {
        it('should return user when found', async () => {
            const mockUser = createTestUser();
            userRepository.findById.mockResolvedValue(mockUser);

            const result = await userService.getUserById('user123');

            expect(result).toEqual(mockUser);
            expect(userRepository.findById).toHaveBeenCalledWith('user123');
        });

        it('should throw 404 error when user not found', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(userService.getUserById('nonexistent')).rejects.toMatchObject({
                message: 'User not found',
                statusCode: 404,
            });
        });

        it('should propagate repository errors', async () => {
            userRepository.findById.mockRejectedValue(new Error('Database error'));

            await expect(userService.getUserById('user123')).rejects.toThrow('Service error: Database error');
        });
    });

    describe('createUser', () => {
        beforeEach(() => {
            geolocationService.isValidZipCode.mockReturnValue(true);
            geolocationService.fetchLocationData.mockResolvedValue({
                latitude: 40.7128,
                longitude: -74.0060,
                timezone: -18000,
                timezoneOffset: '-05:00',
                city: 'New York',
                state: 'NY',
                country: 'US',
                weather: 'clear sky',
            });
            userRepository.create.mockResolvedValue({ id: 'new-user-id', ...createTestUser() });
        });

        it('should create user with valid data', async () => {
            const userData = {
                name: 'John Doe',
                zipCode: '12345',
            };

            const result = await userService.createUser(userData);

            expect(result.name).toBe('John Doe');
            expect(result.zipCode).toBe('12345');
            expect(result.latitude).toBe(40.7128);
            expect(result.longitude).toBe(-74.0060);
            expect(geolocationService.isValidZipCode).toHaveBeenCalledWith('12345');
            expect(geolocationService.fetchLocationData).toHaveBeenCalledWith('12345');
            expect(userRepository.create).toHaveBeenCalled();
        });

        it('should trim whitespace from inputs', async () => {
            const userData = {
                name: '  John Doe  ',
                zipCode: '  12345  ',
            };

            await userService.createUser(userData);

            expect(geolocationService.isValidZipCode).toHaveBeenCalledWith('12345');
            expect(geolocationService.fetchLocationData).toHaveBeenCalledWith('12345');
        });

        it('should throw 400 error for missing name', async () => {
            const userData = {
                zipCode: '12345',
            };

            await expect(userService.createUser(userData)).rejects.toMatchObject({
                message: 'Name and zip code are required',
                statusCode: 400,
            });
        });

        it('should throw 400 error for missing zip code', async () => {
            const userData = {
                name: 'John Doe',
            };

            await expect(userService.createUser(userData)).rejects.toMatchObject({
                message: 'Name and zip code are required',
                statusCode: 400,
            });
        });

        it('should throw 400 error for invalid zip code', async () => {
            geolocationService.isValidZipCode.mockReturnValue(false);

            const userData = {
                name: 'John Doe',
                zipCode: 'invalid',
            };

            await expect(userService.createUser(userData)).rejects.toMatchObject({
                message: 'Invalid zip code format. Must be 5 digits.',
                statusCode: 400,
            });
        });

        it('should handle geolocation service errors', async () => {
            geolocationService.fetchLocationData.mockRejectedValue(new Error('Zip code not found'));

            const userData = {
                name: 'John Doe',
                zipCode: '12345',
            };

            await expect(userService.createUser(userData)).rejects.toMatchObject({
                message: 'Zip code not found',
                statusCode: 400,
            });
        });
    });

    describe('updateUser', () => {
        beforeEach(() => {
            userRepository.findById.mockResolvedValue(createTestUser());
            geolocationService.isValidZipCode.mockReturnValue(true);
            geolocationService.fetchLocationData.mockResolvedValue({
                latitude: 34.0522,
                longitude: -118.2437,
                timezone: -28800,
                timezoneOffset: '-08:00',
                city: 'Los Angeles',
                state: 'CA',
                country: 'US',
                weather: 'sunny',
            });
            userRepository.update.mockResolvedValue({ id: 'user123', ...createTestUser() });
        });

        it('should update user name only', async () => {
            const updateData = { name: 'Jane Smith' };

            const result = await userService.updateUser('user123', updateData);

            expect(userRepository.update).toHaveBeenCalledWith('user123', expect.objectContaining({
                name: 'Jane Smith',
            }));
            expect(geolocationService.fetchLocationData).not.toHaveBeenCalled();
        });

        it('should refetch location data when zip code changes', async () => {
            const updateData = { zipCode: '54321' };

            await userService.updateUser('user123', updateData);

            expect(geolocationService.fetchLocationData).toHaveBeenCalledWith('54321');
            expect(userRepository.update).toHaveBeenCalledWith('user123', expect.objectContaining({
                zipCode: '54321',
                latitude: 34.0522,
                longitude: -118.2437,
                city: 'Los Angeles',
            }));
        });

        it('should throw 404 for non-existent user', async () => {
            userRepository.findById.mockResolvedValue(null);

            await expect(userService.updateUser('nonexistent', { name: 'Test' }))
                .rejects.toMatchObject({
                    message: 'User not found',
                    statusCode: 404,
                });
        });
    });

    describe('deleteUser', () => {
        it('should delete existing user', async () => {
            const mockUser = createTestUser();
            userRepository.delete.mockResolvedValue(mockUser);

            const result = await userService.deleteUser('user123');

            expect(result).toEqual(mockUser);
            expect(userRepository.delete).toHaveBeenCalledWith('user123');
        });

        it('should throw 404 for non-existent user', async () => {
            userRepository.delete.mockResolvedValue(null);

            await expect(userService.deleteUser('nonexistent'))
                .rejects.toMatchObject({
                    message: 'User not found',
                    statusCode: 404,
                });
        });
    });
});
