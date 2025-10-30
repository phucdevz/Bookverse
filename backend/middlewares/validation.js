const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// User validation rules
const validateUser = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('profile.firstName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('First name cannot exceed 50 characters')
        .trim(),
    body('profile.lastName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Last name cannot exceed 50 characters')
        .trim(),
    body('profile.phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    handleValidationErrors
];

// Login validation
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Product validation rules
const validateProduct = [
    body('title')
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters')
        .trim(),
    body('description')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters')
        .trim(),
    body('author')
        .isLength({ min: 1, max: 100 })
        .withMessage('Author must be between 1 and 100 characters')
        .trim(),
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('originalPrice')
        .optional()
        .isNumeric()
        .withMessage('Original price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Original price must be a positive number'),
    body('category')
        .isMongoId()
        .withMessage('Please provide a valid category ID'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    body('condition')
        .optional()
        .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
        .withMessage('Invalid condition value'),
    body('language')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Language cannot exceed 50 characters'),
    body('publisher')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Publisher cannot exceed 100 characters'),
    body('publishYear')
        .optional()
        .isInt({ min: 1000, max: new Date().getFullYear() + 1 })
        .withMessage('Invalid publish year'),
    body('pages')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Pages must be a positive integer'),
    body('isbn')
        .optional()
        .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9X]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
        .withMessage('Please provide a valid ISBN'),
    handleValidationErrors
];

// Order validation rules
const validateOrder = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Order must contain at least one item'),
    body('items.*.product')
        .isMongoId()
        .withMessage('Please provide a valid product ID'),
    body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),
    body('shippingAddress.fullName')
        .isLength({ min: 1, max: 100 })
        .withMessage('Full name must be between 1 and 100 characters')
        .trim(),
    body('shippingAddress.phone')
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please provide a valid phone number'),
    body('shippingAddress.email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('shippingAddress.street')
        .isLength({ min: 1, max: 200 })
        .withMessage('Street address must be between 1 and 200 characters')
        .trim(),
    body('shippingAddress.city')
        .isLength({ min: 1, max: 50 })
        .withMessage('City must be between 1 and 50 characters')
        .trim(),
    body('shippingAddress.state')
        .isLength({ min: 1, max: 50 })
        .withMessage('State must be between 1 and 50 characters')
        .trim(),
    body('shippingAddress.zipCode')
        .isLength({ min: 1, max: 20 })
        .withMessage('ZIP code must be between 1 and 20 characters')
        .trim(),
    body('payment.method')
        .isIn(['cod', 'bank_transfer', 'credit_card', 'paypal'])
        .withMessage('Invalid payment method'),
    handleValidationErrors
];

// Review validation rules
const validateReview = [
    body('product')
        .isMongoId()
        .withMessage('Please provide a valid product ID'),
    body('order')
        .optional()
        .isMongoId()
        .withMessage('Please provide a valid order ID'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('title')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Review title cannot exceed 100 characters')
        .trim(),
    body('comment')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Review comment must be between 10 and 1000 characters')
        .trim(),
    body('detailedRatings.quality')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Quality rating must be between 1 and 5'),
    body('detailedRatings.value')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Value rating must be between 1 and 5'),
    body('detailedRatings.shipping')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Shipping rating must be between 1 and 5'),
    body('detailedRatings.communication')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Communication rating must be between 1 and 5'),
    handleValidationErrors
];

// Category validation rules
const validateCategory = [
    body('name')
        .isLength({ min: 1, max: 50 })
        .withMessage('Category name must be between 1 and 50 characters')
        .trim(),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters')
        .trim(),
    body('parent')
        .optional()
        .isMongoId()
        .withMessage('Please provide a valid parent category ID'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value'),
    body('isFeatured')
        .optional()
        .isBoolean()
        .withMessage('isFeatured must be a boolean value'),
    body('sortOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Sort order must be a non-negative integer'),
    handleValidationErrors
];

// Query parameter validation
const validateQuery = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('sort')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'price', 'title', 'rating'])
        .withMessage('Invalid sort field'),
    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc'),
    handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName = 'id') => [
    param(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName} format`),
    handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Password confirmation does not match new password');
            }
            return true;
        }),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUser,
    validateLogin,
    validateProduct,
    validateOrder,
    validateReview,
    validateCategory,
    validateQuery,
    validateObjectId,
    validatePasswordChange
};

