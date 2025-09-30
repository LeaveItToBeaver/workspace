const userRepository = require('../repositories/userRepository');
const geolocationService = require('./geolocationService');

class UserService {
    /**
     * Get all users
     */
    async getAllUsers() {
        try {
            const users = await userRepository.findAll();
            return users;
        } catch (error) {
            throw new Error(`Service error: ${error.message}`);
        }
    }

    /**
     * Get user by ID
     */
    async getUserById(id) {
        try {
            const user = await userRepository.findById(id);

            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

            return user;
        } catch (error) {
            if (error.statusCode) throw error;
            throw new Error(`Service error: ${error.message}`);
        }
    }

    /**
     * Create new user with geolocation data
     */
    async createUser(userData) {
        try {
            const { name, zipCode } = userData;

            // Validate required fields
            if (!name || !zipCode) {
                const error = new Error('Name and zip code are required');
                error.statusCode = 400;
                throw error;
            }

            // Trim and sanitize inputs
            const sanitizedData = {
                name: name.trim(),
                zipCode: zipCode.trim(),
            };

            if (!geolocationService.isValidZipCode(sanitizedData.zipCode)) {
                const error = new Error('Invalid zip code format. Must be 5 digits.');
                error.statusCode = 400;
                throw error;
            }

            // Fetch geolocation data
            console.log(`Fetching location data for zip code: ${sanitizedData.zipCode}`);
            const locationData = await geolocationService.fetchLocationData(sanitizedData.zipCode);

            // Combine user data with location data (per readme requirements)
            const completeUserData = {
                ...sanitizedData,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                timezone: locationData.timezone,
                timezoneOffset: locationData.timezoneOffset,
                city: locationData.city,
            };

            // Create user in database
            const newUser = await userRepository.create(completeUserData);

            console.log(`User created successfully: ${newUser.id}`);
            return newUser;
        } catch (error) {
            if (error.statusCode) throw error;

            // Check if it's a geolocation error
            if (error.message.includes('Zip code') || error.message.includes('API')) {
                error.statusCode = 400;
            }

            throw error;
        }
    }

    /**
     * Update existing user
     */
    async updateUser(id, updateData) {
        try {
            // Check if user exists
            const existingUser = await userRepository.findById(id);

            if (!existingUser) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
            const updates = {};

            if (updateData.name !== undefined) {
                updates.name = updateData.name.trim();
            }

            // Check if zip code is being updated
            if (updateData.zipCode && updateData.zipCode !== existingUser.zipCode) {
                const newZipCode = updateData.zipCode.trim();

                if (!geolocationService.isValidZipCode(newZipCode)) {
                    const error = new Error('Invalid zip code format. Must be 5 digits.');
                    error.statusCode = 400;
                    throw error;
                }

                console.log(`Zip code changed from ${existingUser.zipCode} to ${newZipCode}. Fetching new location data...`);

                // Fetch new geolocation data
                const locationData = await geolocationService.fetchLocationData(newZipCode);

                // Add location updates (per readme requirements)
                updates.zipCode = newZipCode;
                updates.latitude = locationData.latitude;
                updates.longitude = locationData.longitude;
                updates.timezone = locationData.timezone;
                updates.timezoneOffset = locationData.timezoneOffset;
                updates.city = locationData.city;
                updates.locationUpdatedAt = Date.now();
            }

            // Only update if there are changes
            if (Object.keys(updates).length === 0) {
                const error = new Error('No valid updates provided');
                error.statusCode = 400;
                throw error;
            }

            // Update user in database
            const updatedUser = await userRepository.update(id, updates);

            console.log(`User updated successfully: ${id}`);
            return updatedUser;
        } catch (error) {
            if (error.statusCode) throw error;

            // Check if it's a geolocation error
            if (error.message.includes('Zip code') || error.message.includes('API')) {
                error.statusCode = 400;
            }

            throw error;
        }
    }

    /**
     * Delete user
     */
    async deleteUser(id) {
        try {
            const deletedUser = await userRepository.delete(id);

            if (!deletedUser) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

            console.log(`User deleted successfully: ${id}`);
            return deletedUser;
        } catch (error) {
            if (error.statusCode) throw error;
            throw new Error(`Service error: ${error.message}`);
        }
    }

    /**
     * Get users by zip code
     */
    async getUsersByZipCode(zipCode) {
        try {
            if (!geolocationService.isValidZipCode(zipCode)) {
                const error = new Error('Invalid zip code format. Must be 5 digits.');
                error.statusCode = 400;
                throw error;
            }

            const users = await userRepository.findByZipCode(zipCode);
            return users;
        } catch (error) {
            if (error.statusCode) throw error;
            throw new Error(`Service error: ${error.message}`);
        }
    }

    /**
     * Refresh location data for a user
     */
    async refreshUserLocation(id) {
        try {
            const user = await userRepository.findById(id);

            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }

            // Fetch fresh location data
            const locationData = await geolocationService.fetchLocationData(user.zipCode);

            const updates = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                timezone: locationData.timezone,
                timezoneOffset: locationData.timezoneOffset,
                locationUpdatedAt: Date.now(),
            };

            const updatedUser = await userRepository.update(id, updates);

            console.log(`Location refreshed for user: ${id}`);
            return updatedUser;
        } catch (error) {
            if (error.statusCode) throw error;
            throw new Error(`Service error: ${error.message}`);
        }
    }
}

module.exports = new UserService();