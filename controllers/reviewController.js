const Review = require("../models/reviewModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query

    // Check if product exists
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    const skip = (page - 1) * limit
    const sortOptions = {}
    sortOptions[sort] = order === "desc" ? -1 : 1

    const reviews = await Review.find({
      product: productId,
      isActive: true,
    })
      .populate("user", "firstName lastName")
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Review.countDocuments({
      product: productId,
      isActive: true,
    })

    const totalPages = Math.ceil(total / limit)

    // Calculate average rating
    const ratingStats = await Review.aggregate([
      { $match: { product: product._id, isActive: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ])

    const stats = ratingStats.length > 0 ? ratingStats[0] : {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: [],
    }

    // Calculate rating distribution
    const distribution = {}
    for (let i = 1; i <= 5; i++) {
      distribution[i] = stats.ratingDistribution.filter(r => r === i).length
    }

    res.json({
      success: true,
      data: {
        reviews,
        stats: {
          averageRating: Math.round(stats.averageRating * 10) / 10,
          totalReviews: stats.totalReviews,
          distribution,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get product reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching reviews",
    })
  }
}

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body

    // Validate product
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user.id,
      "items.product": productId,
      status: { $in: ["delivered", "completed"] },
    })

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased",
      })
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId,
    })

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      })
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      })
    }

    const review = await Review.create({
      user: req.user.id,
      product: productId,
      rating,
      title,
      comment,
    })

    await review.populate("user", "firstName lastName")

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: {
        review,
      },
    })
  } catch (error) {
    console.error("Create review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error creating review",
    })
  }
}

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { rating, title, comment } = req.body

    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this review",
      })
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      })
    }

    // Update fields
    if (rating !== undefined) review.rating = rating
    if (title !== undefined) review.title = title
    if (comment !== undefined) review.comment = comment

    await review.save()
    await review.populate("user", "firstName lastName")

    res.json({
      success: true,
      message: "Review updated successfully",
      data: {
        review,
      },
    })
  } catch (error) {
    console.error("Update review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating review",
    })
  }
}

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      })
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review",
      })
    }

    await Review.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Review deleted successfully",
    })
  } catch (error) {
    console.error("Delete review error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting review",
    })
  }
}

// @desc    Get user reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const reviews = await Review.find({ user: req.user.id })
      .populate("product", "name bannerImage")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Review.countDocuments({ user: req.user.id })
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get my reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching reviews",
    })
  }
}

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, productId, rating, sort = "createdAt", order = "desc" } = req.query
    const skip = (page - 1) * limit

    const filter = { isActive: true }
    if (productId) filter.product = productId
    if (rating) filter.rating = parseInt(rating)

    const sortOptions = {}
    sortOptions[sort] = order === "desc" ? -1 : 1

    const reviews = await Review.find(filter)
      .populate("user", "firstName lastName email")
      .populate("product", "name bannerImage")
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Review.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalReviews: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get all reviews error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching reviews",
    })
  }
}

// @desc    Get review statistics (Admin only)
// @route   GET /api/reviews/stats
// @access  Private/Admin
const getReviewStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments({ isActive: true })
    const averageRating = await Review.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } },
    ])

    const ratingDistribution = await Review.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])

    const distribution = {}
    for (let i = 1; i <= 5; i++) {
      const ratingData = ratingDistribution.find(r => r._id === i)
      distribution[i] = ratingData ? ratingData.count : 0
    }

    res.json({
      success: true,
      data: {
        stats: {
          totalReviews,
          averageRating: averageRating.length > 0 ? Math.round(averageRating[0].avgRating * 10) / 10 : 0,
          distribution,
        },
      },
    })
  } catch (error) {
    console.error("Get review stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching review statistics",
    })
  }
}

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getAllReviews,
  getReviewStats,
}
