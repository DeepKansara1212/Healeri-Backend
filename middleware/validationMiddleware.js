const { body, validationResult } = require("express-validator")

// Validation middleware to check for errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    })
  }
  next()
}

// User registration validation
const validateUserRegistration = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),

  handleValidationErrors,
]

// User login validation
const validateUserLogin = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
]

// Product validation
const validateProduct = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ max: 500 })
    .withMessage("Product name cannot exceed 500 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),

  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

  body("category").notEmpty().withMessage("Category is required"),

  handleValidationErrors,
]

// Category validation
const validateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),

  handleValidationErrors,
]

// Review validation
const validateReview = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Review comment is required")
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),

  handleValidationErrors,
]

// Add these validation rules

// Forgot password validation
const validateForgotPassword = [
  body("email").isEmail().withMessage("Please provide a valid email").normalizeEmail(),
  handleValidationErrors,
];

// Reset password validation
const validateResetPassword = [
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  handleValidationErrors,
];

// Add to module.exports
module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateCategory,
  validateReview,
  validateForgotPassword,
  validateResetPassword,
};
