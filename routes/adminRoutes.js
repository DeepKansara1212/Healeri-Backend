const express = require("express")
const User = require("../models/userModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const { Category } = require("../models/categoryModel")
const authMiddleware = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const { validateProduct, validateCategory } = require("../middleware/validationMiddleware")
const upload = require("../middleware/uploadMiddleware")
const { uploadBuffer } = require("../utils/uploadToCloudinary")

const router = express.Router()

// Apply auth and admin middleware to all routes
router.use(authMiddleware)
router.use(adminMiddleware)

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "customer" })
    const totalOrders = await Order.countDocuments()
    const totalProducts = await Product.countDocuments({ isActive: true })

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ])
    const totalRevenue = revenueResult[0]?.totalRevenue || 0

    // Recent orders
    const recentOrders = await Order.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5)

    // Monthly sales data
    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
          paymentStatus: "Paid",
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue,
        },
        recentOrders,
        monthlySales,
      },
    })
  } catch (error) {
    console.error("Get dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard data",
    })
  }
})

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get("/users", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const users = await User.find({ role: "customer" })
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await User.countDocuments({ role: "customer" })

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
        },
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    })
  }
})

// @desc    Create product
// @route   POST /api/admin/products
// @access  Private/Admin
router.post("/products", validateProduct, async (req, res) => {
  try {
    const body = { ...req.body }

    // If uploads/images returned objects with url/public_id, accept both arrays or single
    if (body.bannerImage && typeof body.bannerImage === "object" && body.bannerImage.url) {
      body.bannerImage = body.bannerImage.url
      body.bannerImageId = body.bannerImage.public_id
    }
    if (Array.isArray(body.images)) {
      body.images = body.images.map((img) => (typeof img === "object" && img.url ? img.url : img))
    }

    const product = await Product.create(body)
    await product.populate("category", "name")

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        product,
      },
    })
  } catch (error) {
    console.error("Create product error:", error)
    res.status(500).json({
      success: false,
      message: "Server error creating product",
    })
  }
})

// @desc    Update product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
router.put("/products/:id", validateProduct, async (req, res) => {
  try {
    const body = { ...req.body }
    if (body.bannerImage && typeof body.bannerImage === "object" && body.bannerImage.url) {
      body.bannerImage = body.bannerImage.url
      body.bannerImageId = body.bannerImage.public_id
    }
    if (Array.isArray(body.images)) {
      body.images = body.images.map((img) => (typeof img === "object" && img.url ? img.url : img))
    }

    const product = await Product.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).populate("category", "name")

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: {
        product,
      },
    })
  } catch (error) {
    console.error("Update product error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating product",
    })
  }
})

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    })
  } catch (error) {
    console.error("Delete product error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting product",
    })
  }
})

// @desc    Upload product images to Cloudinary
// @route   POST /api/admin/uploads/images
// @access  Private/Admin
router.post("/uploads/images", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No images provided" })
    }

    const uploads = await Promise.all(
      req.files.map((file) =>
        uploadBuffer(file.buffer, {
          folder: "healery/products",
          transformation: [{ quality: "auto:good", fetch_format: "auto" }],
        }),
      ),
    )

    res.status(201).json({ success: true, data: { images: uploads } })
  } catch (error) {
    console.error("Upload images error:", error)
    res.status(500).json({ success: false, message: "Server error uploading images" })
  }
})

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
router.get("/orders", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find()
      .populate("user", "firstName lastName email")
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Order.countDocuments()

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
        },
      },
    })
  } catch (error) {
    console.error("Get orders error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching orders",
    })
  }
})

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
router.put("/orders/:id/status", async (req, res) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body

    const updateData = {}
    if (orderStatus) updateData.orderStatus = orderStatus
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (trackingNumber) updateData.trackingNumber = trackingNumber

    if (orderStatus === "Delivered") {
      updateData.deliveredAt = new Date()
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate(
      "user",
      "firstName lastName email",
    )

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: {
        order,
      },
    })
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating order status",
    })
  }
})

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private/Admin
router.post("/categories", validateCategory, async (req, res) => {
  try {
    const category = await Category.create(req.body)

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: {
        category,
      },
    })
  } catch (error) {
    console.error("Create category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error creating category",
    })
  }
})

module.exports = router
 
