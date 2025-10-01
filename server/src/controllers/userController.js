const userService = require("../services/userService");

class UserController {
  /**
   * GET /api/users
   * Get all users
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();

      res.status(200).json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Get single user by ID
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Create new user
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;

      const newUser = await userService.createUser(userData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: newUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedUser = await userService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const deletedUser = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
        data: deletedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/zip/:zipCode
   * Get users by zip code
   */
  async getUsersByZipCode(req, res, next) {
    try {
      const { zipCode } = req.params;

      const users = await userService.getUsersByZipCode(zipCode);

      res.status(200).json({
        success: true,
        count: users.length,
        zipCode: zipCode,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/:id/refresh-location
   * Refresh user's location data
   */
  async refreshUserLocation(req, res, next) {
    try {
      const { id } = req.params;

      const updatedUser = await userService.refreshUserLocation(id);

      res.status(200).json({
        success: true,
        message: "Location data refreshed successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
