const userRepository = require('../../src/repositories/userRepository');
const { createMockFirebase, createTestUser } = require('../utils/testHelpers');

// Mock the database
jest.mock('../../src/config/database');

describe('UserRepository', () => {
    let mockFirebase;

    beforeEach(() => {
        mockFirebase = createMockFirebase();

        const database = require('../../src/config/database');
        database.getUsersRef = jest.fn().mockReturnValue(mockFirebase.ref());
        database.getServerTimestamp = jest.fn().mockReturnValue(Date.now());
    });

    afterEach(() => {
        mockFirebase.clearMockData();
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all users as array', async () => {
            // Setup mock data
            const testUsers = {
                'user1': createTestUser({ name: 'User 1' }),
                'user2': createTestUser({ name: 'User 2' }),
            };

            mockFirebase.mockData.set('user1', testUsers.user1);
            mockFirebase.mockData.set('user2', testUsers.user2);

            const users = await userRepository.findAll();

            expect(Array.isArray(users)).toBe(true);
            expect(users).toHaveLength(2);
            expect(users[0]).toMatchObject({ id: 'user1', name: 'User 1' });
            expect(users[1]).toMatchObject({ id: 'user2', name: 'User 2' });
        });

        it('should return empty array when no users exist', async () => {
            const users = await userRepository.findAll();

            expect(Array.isArray(users)).toBe(true);
            expect(users).toHaveLength(0);
        });

        it('should handle database errors', async () => {
            const mockRef = mockFirebase.ref();
            mockRef.once.mockRejectedValue(new Error('Database connection failed'));

            await expect(userRepository.findAll())
                .rejects.toThrow('Failed to fetch users: Database connection failed');
        });
    });

    describe('findById', () => {
        it('should return user when found', async () => {
            const testUser = createTestUser();
            mockFirebase.mockData.set('user123', testUser);

            const user = await userRepository.findById('user123');

            expect(user).toMatchObject({
                id: 'user123',
                ...testUser,
            });
        });

        it('should return null when user not found', async () => {
            const user = await userRepository.findById('nonexistent');

            expect(user).toBeNull();
        });

        it('should handle database errors', async () => {
            const mockRef = mockFirebase.ref();
            const mockChild = jest.fn().mockReturnValue({
                once: jest.fn().mockRejectedValue(new Error('Database error')),
            });
            mockRef.child = mockChild;

            await expect(userRepository.findById('user123'))
                .rejects.toThrow('Failed to fetch user: Database error');
        });
    });

    describe('create', () => {
        it('should create user and return with ID', async () => {
            const userData = createTestUser();
            delete userData.id; // Remove ID since it should be generated

            const createdUser = await userRepository.create(userData);

            expect(createdUser).toMatchObject(userData);
            expect(createdUser.id).toBeDefined();
            expect(typeof createdUser.id).toBe('string');
            expect(createdUser.createdAt).toBeDefined();
            expect(createdUser.updatedAt).toBeDefined();
        });

        it('should handle database errors during creation', async () => {
            const mockRef = mockFirebase.ref();
            const mockPush = jest.fn().mockReturnValue({
                key: 'new-user-id',
                set: jest.fn().mockRejectedValue(new Error('Database write failed')),
            });
            mockRef.push = mockPush;

            const userData = createTestUser();

            await expect(userRepository.create(userData))
                .rejects.toThrow('Failed to create user: Database write failed');
        });
    });

    describe('update', () => {
        it('should update user and return updated data', async () => {
            const existingUser = createTestUser();
            mockFirebase.mockData.set('user123', existingUser);

            const updateData = { name: 'Updated Name' };
            const updatedUser = await userRepository.update('user123', updateData);

            expect(updatedUser).toMatchObject({
                id: 'user123',
                name: 'Updated Name',
            });
            expect(updatedUser.updatedAt).toBeDefined();
        });

        it('should handle database errors during update', async () => {
            const mockRef = mockFirebase.ref();
            const mockChild = jest.fn().mockReturnValue({
                update: jest.fn().mockRejectedValue(new Error('Database update failed')),
                once: jest.fn().mockResolvedValue({
                    val: () => createTestUser(),
                    exists: () => true,
                }),
            });
            mockRef.child = mockChild;

            await expect(userRepository.update('user123', { name: 'Test' }))
                .rejects.toThrow('Failed to update user: Database update failed');
        });
    });

    describe('delete', () => {
        it('should delete user and return deleted data', async () => {
            const testUser = createTestUser();
            mockFirebase.mockData.set('user123', testUser);

            const deletedUser = await userRepository.delete('user123');

            expect(deletedUser).toMatchObject({
                id: 'user123',
                ...testUser,
            });
        });

        it('should handle database errors during deletion', async () => {
            const mockRef = mockFirebase.ref();
            const mockChild = jest.fn().mockReturnValue({
                once: jest.fn().mockResolvedValue({
                    val: () => createTestUser(),
                    exists: () => true,
                }),
                remove: jest.fn().mockRejectedValue(new Error('Database delete failed')),
            });
            mockRef.child = mockChild;

            await expect(userRepository.delete('user123'))
                .rejects.toThrow('Failed to delete user: Database delete failed');
        });
    });

    describe('findByZipCode', () => {
        it('should return users with matching zip code', async () => {
            const users = {
                'user1': createTestUser({ name: 'User 1', zipCode: '12345' }),
                'user2': createTestUser({ name: 'User 2', zipCode: '54321' }),
                'user3': createTestUser({ name: 'User 3', zipCode: '12345' }),
            };

            Object.entries(users).forEach(([id, user]) => {
                mockFirebase.mockData.set(id, user);
            });

            const result = await userRepository.findByZipCode('12345');

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('User 1');
            expect(result[1].name).toBe('User 3');
            expect(result.every(user => user.zipCode === '12345')).toBe(true);
        });

        it('should return empty array when no users match zip code', async () => {
            const result = await userRepository.findByZipCode('99999');

            expect(result).toEqual([]);
        });
    });
});
