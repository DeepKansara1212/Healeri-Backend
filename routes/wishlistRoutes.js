const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  checkWishlistItem,
  getWishlistCount,
} = require("../controllers/wishlistController")

const router = express.Router()

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
router.get("/", authMiddleware, getUserWishlist)

// @desc    Add item to wishlist
// @route   POST /api/wishlist/add
// @access  Private
router.post("/add", authMiddleware, addToWishlist)

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
router.delete("/remove/:productId", authMiddleware, removeFromWishlist)

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
router.delete("/clear", authMiddleware, clearWishlist)

// @desc    Move wishlist item to cart
// @route   POST /api/wishlist/move-to-cart/:productId
// @access  Private
router.post("/move-to-cart/:productId", authMiddleware, moveToCart)

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
router.get("/check/:productId", authMiddleware, checkWishlistItem)

// @desc    Get wishlist count
// @route   GET /api/wishlist/count
// @access  Private
router.get("/count", authMiddleware, getWishlistCount)

module.exports = router
