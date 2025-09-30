const { body, param, validationResult } = require('express-validator');

// Validation rules for creating a user
const validateCreateUser = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+(?:\s\d+)?$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

    body('zipCode')
        .trim()
        .notEmpty().withMessage('Zip code is required')
        .matches(/^\d{5}$/).withMessage('Zip code must be exactly 5 digits'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array().map(err => ({
                    field: err.path || err.param,
                    message: err.msg,
                })),
            });
        }
        next();
    },
];

// Validation rules for updating a user
const validateUpdateUser = [
    body('name')
        .optional()
        .trim()
        .notEmpty().withMessage('Name cannot be empty')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s'-]+(?:\s\d+)?$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

    body('zipCode')
        .optional()
        .trim()
        .notEmpty().withMessage('Zip code cannot be empty')
        .matches(/^\d{5}$/).withMessage('Zip code must be exactly 5 digits'),

    // Handle validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array().map(err => ({
                    field: err.path || err.param,
                    message: err.msg,
                })),
            });
        }

        next();
    },
];

module.exports = {
    validateCreateUser,
    validateUpdateUser,
};