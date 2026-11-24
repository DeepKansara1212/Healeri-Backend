const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const {
  getAllCategories,
  getCategoryById,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
} = require("../controllers/categoryController")

const router = express.Router()

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get("/", getAllCategories)

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
router.get("/:id", getCategoryById)

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
router.get("/:id/products", getProductsByCategory)

// @desc    Create category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
router.post("/", authMiddleware, adminMiddleware, createCategory)

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
router.put("/:id", authMiddleware, adminMiddleware, updateCategory)

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory)

// @desc    Get category statistics (Admin only)
// @route   GET /api/categories/stats
// @access  Private/Admin
router.get("/stats", authMiddleware, adminMiddleware, getCategoryStats)

module.exports = router
