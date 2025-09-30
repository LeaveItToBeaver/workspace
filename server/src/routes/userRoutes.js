const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const validation = require('../middleware/validation');

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/zip/:zipCode - Get users by zip code
router.get('/zip/:zipCode', userController.getUsersByZipCode);

// GET /api/users/:id - Get single user
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', validation.validateCreateUser, userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', validation.validateUpdateUser, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

// POST /api/users/:id/refresh-location - Refresh location data
router.post('/:id/refresh-location', userController.refreshUserLocation);

module.exports = router;