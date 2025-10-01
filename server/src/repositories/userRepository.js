const database = require("../config/database");

class UserRepository {
  constructor() {
    this.getUsersRef = () => database.getUsersRef();
  }

  /**
   * Find all users
   */
  async findAll() {
    try {
      const snapshot = await this.getUsersRef().once("value");
      const users = snapshot.val() || {};

      // Convert Firebase object to array with IDs
      return Object.entries(users).map(([id, data]) => ({
        id,
        ...data,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   */
  async findById(id) {
    try {
      const snapshot = await this.getUsersRef().child(id).once("value");
      const user = snapshot.val();

      if (!user) {
        return null;
      }

      return { id, ...user };
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Create new user
   */
  async create(userData) {
    try {
      const newUserRef = this.getUsersRef().push();
      const serverTimestamp = database.getServerTimestamp();
      const clientNow = Date.now();

      const newUser = {
        ...userData,
        createdAt: serverTimestamp,
        updatedAt: serverTimestamp,
      };

      await newUserRef.set(newUser);

      // Return with ID and estimated timestamps
      const snapshot = await newUserRef.once("value");
      return {
        id: newUserRef.key,
        ...snapshot.val(),
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Update existing user
   */
  async update(id, updateData) {
    try {
      const userRef = this.getUsersRef().child(id);

      // Check if user exists
      const snapshot = await userRef.once("value");
      if (!snapshot.exists()) {
        return null;
      }

      // Add updated timestamp
      const updates = {
        ...updateData,
        updatedAt: database.getServerTimestamp(),
      };

      // Update user
      await userRef.update(updates);

      // Fetch and return updated user
      const updatedSnapshot = await userRef.once("value");
      const updatedUser = updatedSnapshot.val();

      return { id, ...updatedUser };
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user
   */
  async delete(id) {
    try {
      const userRef = this.getUsersRef().child(id);

      // Check if user exists and get data before deletion
      const snapshot = await userRef.once("value");
      const user = snapshot.val();

      if (!user) {
        return null;
      }

      // Delete user
      await userRef.remove();

      return { id, ...user };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Check if user exists
   */
  async exists(id) {
    try {
      const snapshot = await this.getUsersRef().child(id).once("value");
      return snapshot.exists();
    } catch (error) {
      throw new Error(`Failed to check user existence: ${error.message}`);
    }
  }

  /**
   * Find users by zip code
   */
  async findByZipCode(zipCode) {
    try {
      const usersRef = this.getUsersRef();
      if (
        typeof usersRef.orderByChild === "function" &&
        typeof usersRef.equalTo === "function"
      ) {
        const snapshot = await usersRef
          .orderByChild("zipCode")
          .equalTo(zipCode)
          .once("value");
        const users = snapshot.val() || {};
        return Object.entries(users).map(([id, data]) => ({ id, ...data }));
      }

      // Fallback: read all and filter in memory (used by tests/mocks without query methods)
      const snapshot = await usersRef.once("value");
      const allUsers = snapshot.val() || {};
      return Object.entries(allUsers)
        .filter(([, data]) => data && data.zipCode === zipCode)
        .map(([id, data]) => ({ id, ...data }));
    } catch (error) {
      throw new Error(`Failed to find users by zip code: ${error.message}`);
    }
  }
}

module.exports = new UserRepository();
