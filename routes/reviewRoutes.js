const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const { validateReview } = require("../middleware/validationMiddleware")
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getAllReviews,
  getReviewStats,
} = require("../controllers/reviewController")

const router = express.Router()

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
router.get("/product/:productId", getProductReviews)

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
router.post("/", authMiddleware, validateReview, createReview)

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
router.put("/:id", authMiddleware, validateReview, updateReview)

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete("/:id", authMiddleware, deleteReview)

// @desc    Get user reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
router.get("/my-reviews", authMiddleware, getMyReviews)

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private/Admin
router.get("/", authMiddleware, adminMiddleware, getAllReviews)

// @desc    Get review statistics (Admin only)
// @route   GET /api/reviews/stats
// @access  Private/Admin
router.get("/stats", authMiddleware, adminMiddleware, getReviewStats)

module.exports = router
