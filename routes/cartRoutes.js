const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
} = require("../controllers/cartController")

const router = express.Router()

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get("/", authMiddleware, getUserCart)

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
router.post("/add", authMiddleware, addToCart)

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
router.put("/update", authMiddleware, updateCartItem)

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
router.delete("/remove/:productId", authMiddleware, removeFromCart)

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
router.delete("/clear", authMiddleware, clearCart)

// @desc    Get cart summary
// @route   GET /api/cart/summary
// @access  Private
router.get("/summary", authMiddleware, getCartSummary)

module.exports = router
