const Order = require("../models/orderModel")
const Cart = require("../models/cartModel")
const Product = require("../models/productModel")
const User = require("../models/userModel")

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentResult,
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
    } = req.body

    // Validate cart items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order",
      })
    }

    // Validate all stock before creating or changing anything.
    for (const item of items) {
      const product = await Product.findById(item.product)
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} is no longer available`,
        })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}`,
        })
      }
    }

    // Create order (use constructor + save to trigger pre-save hook for orderNumber)
    const order = new Order({
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      paymentResult,
      subtotal: itemsPrice,
      tax: taxPrice,
      shippingCost: shippingPrice,
      discount: discountPrice || 0,
      totalAmount: totalPrice,
    })
    await order.save()

    const decrementedItems = []
    try {
      for (const item of items) {
        const updated = await Product.findOneAndUpdate(
          { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        )
        if (!updated) throw new Error(`Insufficient stock for ${item.name}`)
        decrementedItems.push(item)
      }
    } catch (stockError) {
      for (const item of decrementedItems) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      }
      await Order.findByIdAndDelete(order._id)
      return res.status(400).json({
        success: false,
        message: stockError.message,
      })
    }

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [] },
      { new: true }
    )

    await order.populate("user", "firstName lastName email")
    await order.populate("items.product", "name bannerImage")

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order,
      },
    })
  } catch (error) {
    console.error("Create order error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Server error creating order",
      error: error,
    })
  }
}

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name bannerImage")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Order.countDocuments({ user: req.user.id })
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get my orders error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
    })
  }
}

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("items.product", "name bannerImage description")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user is authorized to view this order
    if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      })
    }

    res.json({
      success: true,
      data: {
        order,
      },
    })
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching order",
    })
  }
}

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  try {
    const { id, status, update_time, email_address } = req.body

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    order.paymentStatus = "Paid"
    order.paymentResult = {
      id,
      status,
      update_time,
      email_address,
    }

    const updatedOrder = await order.save()
    await updatedOrder.populate("user", "firstName lastName email")
    await updatedOrder.populate("items.product", "name bannerImage")

    res.json({
      success: true,
      message: "Order payment updated successfully",
      data: {
        order: updatedOrder,
      },
    })
  } catch (error) {
    console.error("Update order to paid error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating order payment",
    })
  }
}

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    order.orderStatus = "Delivered"
    order.deliveredAt = Date.now()

    const updatedOrder = await order.save()
    await updatedOrder.populate("user", "firstName lastName email")
    await updatedOrder.populate("items.product", "name bannerImage")

    res.json({
      success: true,
      message: "Order delivered successfully",
      data: {
        order: updatedOrder,
      },
    })
  } catch (error) {
    console.error("Update order to delivered error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating order delivery",
    })
  }
}

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if user is authorized to cancel this order
    if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      })
    }

    // Check if order can be cancelled
    if (order.orderStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel delivered order",
      })
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      })
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product)
      if (product) {
        product.stock += item.quantity
        await product.save()
      }
    }

    order.orderStatus = "Cancelled"
    order.cancelledAt = Date.now()

    const updatedOrder = await order.save()
    await updatedOrder.populate("user", "firstName lastName email")
    await updatedOrder.populate("items.product", "name bannerImage")

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: updatedOrder,
      },
    })
  } catch (error) {
    console.error("Cancel order error:", error)
    res.status(500).json({
      success: false,
      message: "Server error cancelling order",
    })
  }
}

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sort = "createdAt", order = "desc" } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (status) filter.orderStatus = status

    const sortOptions = {}
    sortOptions[sort] = order === "desc" ? -1 : 1

    const orders = await Order.find(filter)
      .populate("user", "firstName lastName email")
      .populate("items.product", "name bannerImage")
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Order.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get all orders error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
    })
  }
}

// @desc    Get order statistics (Admin only)
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments()
    const pendingOrders = await Order.countDocuments({ orderStatus: "Pending" })
    const processingOrders = await Order.countDocuments({ orderStatus: "Processing" })
    const shippedOrders = await Order.countDocuments({ orderStatus: "Shipped" })
    const deliveredOrders = await Order.countDocuments({ orderStatus: "Delivered" })
    const cancelledOrders = await Order.countDocuments({ orderStatus: "Cancelled" })

    // Calculate total revenue
    const revenueData = await Order.aggregate([
      { $match: { paymentStatus: "Paid", orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ])

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0

    res.json({
      success: true,
      data: {
        stats: {
          totalOrders,
          pendingOrders,
          processingOrders,
          shippedOrders,
          deliveredOrders,
          cancelledOrders,
          totalRevenue,
        },
      },
    })
  } catch (error) {
    console.error("Get order stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching order statistics",
    })
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  cancelOrder,
  getAllOrders,
  getOrderStats,
}
