const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  forgotPassword,
  resetPassword,
  getUserProfileOrders,
} = require("../controllers/userController")

const router = express.Router()

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", authMiddleware, getUserProfile)

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", authMiddleware, updateUserProfile)

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
router.put("/change-password", authMiddleware, changePassword)

// @desc    Get user's recent orders with tracking
// @route   GET /api/users/profile/orders
// @access  Private
router.get("/profile/orders", authMiddleware, getUserProfileOrders)

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
router.post("/forgot-password", forgotPassword)

// @desc    Reset password
// @route   PUT /api/users/reset-password/:token
// @access  Public
router.put("/reset-password/:token", resetPassword)

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get("/", authMiddleware, adminMiddleware, getAllUsers)

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
router.get("/:id", authMiddleware, adminMiddleware, getUserById)

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put("/:id", authMiddleware, adminMiddleware, updateUser)

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser)

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
router.get("/stats", authMiddleware, adminMiddleware, getUserStats)

module.exports = router
