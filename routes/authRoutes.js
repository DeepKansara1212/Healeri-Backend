const express = require("express")
const {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  changePassword,
  toggleWishlist,
  getWishlist,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController")
const authMiddleware = require("../middleware/authMiddleware")
const { validateUserRegistration, validateUserLogin } = require("../middleware/validationMiddleware")

const router = express.Router()

// Public routes
router.post("/register", validateUserRegistration, registerUser)
router.post("/login", validateUserLogin, loginUser)
router.post("/google", googleLogin)
router.post("/forgot-password", forgotPassword)
router.put("/reset-password/:token", resetPassword)

// Protected routes
router.get("/profile", authMiddleware, getUserProfile)
router.put("/profile", authMiddleware, updateUserProfile)
router.put("/change-password", authMiddleware, changePassword)
router.get("/wishlist", authMiddleware, getWishlist)
router.post("/wishlist/:productId", authMiddleware, toggleWishlist)

module.exports = router
