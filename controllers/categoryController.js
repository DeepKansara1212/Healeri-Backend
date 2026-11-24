const { Category } = require("../models/categoryModel")
const Product = require("../models/productModel")

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 })

    res.json({
      success: true,
      data: {
        categories,
      },
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching categories",
    })
  }
}

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)

    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      data: {
        category,
      },
    })
  } catch (error) {
    console.error("Get category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching category",
    })
  }
}

// @desc    Get products by category
// @route   GET /api/categories/:id/products
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 12, sort = "createdAt", order = "desc" } = req.query

    const category = await Category.findById(id)
    if (!category || !category.isActive) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    const skip = (page - 1) * limit
    const sortOptions = {}
    sortOptions[sort] = order === "desc" ? -1 : 1

    const products = await Product.find({
      category: id,
      isActive: true,
    })
      .populate("category", "name")
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Product.countDocuments({
      category: id,
      isActive: true,
    })

    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
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

// @desc    Create category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body

    // Check if category already exists
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    })

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      })
    }

    const category = await Category.create({
      name,
      description,
      image,
    })

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
}

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body

    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Check if name is being changed and if it conflicts with existing category
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        _id: { $ne: req.params.id },
      })

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists",
        })
      }
    }

    // Update fields
    if (name !== undefined) category.name = name
    if (description !== undefined) category.description = description
    if (image !== undefined) category.image = image
    if (isActive !== undefined) category.isActive = isActive

    await category.save()

    res.json({
      success: true,
      message: "Category updated successfully",
      data: {
        category,
      },
    })
  } catch (error) {
    console.error("Update category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating category",
    })
  }
}

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    // Check if category has products
    const productCount = await Product.countDocuments({
      category: req.params.id,
      isActive: true,
    })

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete category with active products",
      })
    }

    await Category.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    console.error("Delete category error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting category",
    })
  }
}

// @desc    Get category statistics (Admin only)
// @route   GET /api/categories/stats
// @access  Private/Admin
const getCategoryStats = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
    const stats = []

    for (const category of categories) {
      const productCount = await Product.countDocuments({
        category: category._id,
        isActive: true,
      })

      stats.push({
        category: {
          id: category._id,
          name: category.name,
        },
        productCount,
      })
    }

    res.json({
      success: true,
      data: {
        stats,
      },
    })
  } catch (error) {
    console.error("Get category stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching category statistics",
    })
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
}
