const Product = require("../models/productModel")
const { Category } = require("../models/categoryModel")

// @desc    Get all products with filtering, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Build filter object
    const filter = { isActive: true }

    // Category filter
    if (req.query.category) {
      const category = await Category.findOne({ name: new RegExp(req.query.category, "i") })
      if (category) {
        filter.category = category._id
      }
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {}
      if (req.query.minPrice) filter.price.$gte = Number.parseFloat(req.query.minPrice)
      if (req.query.maxPrice) filter.price.$lte = Number.parseFloat(req.query.maxPrice)
    }

    // Search filter
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
        { tags: { $in: [new RegExp(req.query.search, "i")] } },
      ]
    }

    // In stock filter
    if (req.query.inStock === "true") {
      filter.stock = { $gt: 0 }
    }

    // Featured filter
    if (req.query.featured === "true") {
      filter.isFeatured = true
    }

    // Build sort object
    const sort = {}
    switch (req.query.sort) {
      case "price_asc":
        sort.price = 1
        break
      case "price_desc":
        sort.price = -1
        break
      case "name_asc":
        sort.name = 1
        break
      case "name_desc":
        sort.name = -1
        break
      case "rating":
        sort.rating = -1
        break
      case "newest":
        sort.createdAt = -1
        break
      default:
        sort.createdAt = -1
    }

    // Execute query
    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)

    // Get total count for pagination
    const total = await Product.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get products error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching products",
    })
  }
}

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category", "name").populate("subCategory", "name")

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    res.json({
      success: true,
      data: {
        product,
      },
    })
  } catch (error) {
    console.error("Get product error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching product",
    })
  }
}

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 8

    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(limit)

    res.json({
      success: true,
      data: {
        products,
      },
    })
  } catch (error) {
    console.error("Get featured products error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching featured products",
    })
  }
}

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    const products = await Product.find({
      category: req.params.categoryId,
      isActive: true,
    })
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments({
      category: req.params.categoryId,
      isActive: true,
    })

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
        },
      },
    })
  } catch (error) {
    console.error("Get products by category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching products by category",
    })
  }
}

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      })
    }

    const searchFilter = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    }

    const products = await Product.find(searchFilter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .sort({ rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Product.countDocuments(searchFilter)

    res.json({
      success: true,
      data: {
        products,
        searchQuery: q,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
        },
      },
    })
  } catch (error) {
    console.error("Search products error:", error)
    res.status(500).json({
      success: false,
      message: "Server error searching products",
    })
  }
}

module.exports = {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
}
