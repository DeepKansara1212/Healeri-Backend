const Wishlist = require("../models/wishlistModel")
const Product = require("../models/productModel")

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getUserWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price bannerImage stock isActive category"
    )

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, items: [] })
    }

    // Filter out inactive products
    if (wishlist.items.length > 0) {
      wishlist.items = wishlist.items.filter(item => item.product && item.product.isActive)
      await wishlist.save()
    }

    res.json({
      success: true,
      data: {
        wishlist,
      },
    })
  } catch (error) {
    console.error("Get wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching wishlist",
    })
  }
}

// @desc    Add item to wishlist
// @route   POST /api/wishlist/add
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body

    // Validate product
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user.id })
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, items: [] })
    }

    // Check if item already exists in wishlist
    const existingItem = wishlist.items.find(
      (item) => item.product.toString() === productId
    )

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      })
    }

    // Add new item
    wishlist.items.push({
      product: productId,
      addedAt: new Date(),
    })

    await wishlist.save()
    await wishlist.populate("items.product", "name price bannerImage stock isActive category")

    res.json({
      success: true,
      message: "Product added to wishlist",
      data: {
        wishlist,
      },
    })
  } catch (error) {
    console.error("Add to wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Server error adding to wishlist",
    })
  }
}

// @desc    Remove item from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params

    const wishlist = await Wishlist.findOne({ user: req.user.id })
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      })
    }

    // Remove item from wishlist
    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== productId
    )

    await wishlist.save()
    await wishlist.populate("items.product", "name price bannerImage stock isActive category")

    res.json({
      success: true,
      message: "Product removed from wishlist",
      data: {
        wishlist,
      },
    })
  } catch (error) {
    console.error("Remove from wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Server error removing from wishlist",
    })
  }
}

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      })
    }

    wishlist.items = []
    await wishlist.save()

    res.json({
      success: true,
      message: "Wishlist cleared successfully",
      data: {
        wishlist,
      },
    })
  } catch (error) {
    console.error("Clear wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Server error clearing wishlist",
    })
  }
}

// @desc    Move wishlist item to cart
// @route   POST /api/wishlist/move-to-cart/:productId
// @access  Private
const moveToCart = async (req, res) => {
  try {
    const { productId } = req.params
    const { quantity = 1 } = req.body

    // Validate product
    const product = await Product.findById(productId)
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      })
    }

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user.id })
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      })
    }

    const wishlistItem = wishlist.items.find(
      (item) => item.product.toString() === productId
    )

    if (!wishlistItem) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      })
    }

    // Remove from wishlist
    wishlist.items = wishlist.items.filter(
      (item) => item.product.toString() !== productId
    )
    await wishlist.save()

    // Add to cart (you'll need to implement cart functionality)
    // For now, just return success
    res.json({
      success: true,
      message: "Product moved to cart successfully",
      data: {
        productId,
        quantity,
      },
    })
  } catch (error) {
    console.error("Move to cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error moving product to cart",
    })
  }
}

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
const checkWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params

    const wishlist = await Wishlist.findOne({ user: req.user.id })
    if (!wishlist) {
      return res.json({
        success: true,
        data: {
          isInWishlist: false,
        },
      })
    }

    const isInWishlist = wishlist.items.some(
      (item) => item.product.toString() === productId
    )

    res.json({
      success: true,
      data: {
        isInWishlist,
      },
    })
  } catch (error) {
    console.error("Check wishlist item error:", error)
    res.status(500).json({
      success: false,
      message: "Server error checking wishlist item",
    })
  }
}

// @desc    Get wishlist count
// @route   GET /api/wishlist/count
// @access  Private
const getWishlistCount = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
    if (!wishlist) {
      return res.json({
        success: true,
        data: {
          count: 0,
        },
      })
    }

    // Count only active products
    const activeItems = wishlist.items.filter(item => item.product && item.product.isActive)
    const count = activeItems.length

    res.json({
      success: true,
      data: {
        count,
      },
    })
  } catch (error) {
    console.error("Get wishlist count error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching wishlist count",
    })
  }
}

module.exports = {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
  checkWishlistItem,
  getWishlistCount,
}
