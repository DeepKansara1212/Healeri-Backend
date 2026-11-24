const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  cancelOrder,
  getAllOrders,
  getOrderStats,
} = require("../controllers/orderController")

const router = express.Router()

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post("/", authMiddleware, createOrder)

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get("/myorders", authMiddleware, getMyOrders)

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get("/:id", authMiddleware, getOrderById)

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
router.put("/:id/pay", authMiddleware, updateOrderToPaid)

// @desc    Update order to delivered (Admin only)
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
router.put("/:id/deliver", authMiddleware, adminMiddleware, updateOrderToDelivered)

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put("/:id/cancel", authMiddleware, cancelOrder)

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
router.get("/", authMiddleware, adminMiddleware, getAllOrders)

// @desc    Get order statistics (Admin only)
// @route   GET /api/orders/stats
// @access  Private/Admin
router.get("/stats", authMiddleware, adminMiddleware, getOrderStats)

module.exports = router
