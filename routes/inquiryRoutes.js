const express = require("express")
const router = express.Router()
const { body } = require("express-validator")
const { createInquiry } = require("../controllers/inquiryController")
const { 
  // reuse existing error handler pattern from validation middleware
} = require("../middleware/validationMiddleware")

// Inline validation for minimal coupling
const validateInquiry = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("product").trim().notEmpty().withMessage("Product is required"),
  body("quantity").isInt({ min: 10 }).withMessage("Quantity must be at least 10"),
  body("message").optional().isLength({ max: 1000 }).withMessage("Message too long"),
  (req, res, next) => {
    const { validationResult } = require("express-validator")
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() })
    }
    next()
  },
]

router.post("/", validateInquiry, createInquiry)

module.exports = router


