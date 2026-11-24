const Cart = require("../models/cartModel")
const Product = require("../models/productModel")

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getUserCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price bannerImage stock isActive"
    )

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] })
    }

    // Filter out inactive products
    if (cart.items.length > 0) {
      cart.items = cart.items.filter(item => item.product && item.product.isActive)
      await cart.save()
    }

    res.json({
      success: true,
      data: {
        cart,
      },
    })
  } catch (error) {
    console.error("Get cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching cart",
    })
  }
}

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body

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

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] })
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    )

    if (existingItemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + quantity
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock for requested quantity",
        })
      }
      cart.items[existingItemIndex].quantity = newQuantity
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      })
    }

    await cart.save()
    await cart.populate("items.product", "name price bannerImage stock isActive")

    res.json({
      success: true,
      message: "Item added to cart",
      data: {
        cart,
      },
    })
  } catch (error) {
    console.error("Add to cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error adding to cart",
    })
  }
}

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      })
    }

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

    // Find cart
    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    )

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      })
    }

    // Update quantity
    cart.items[itemIndex].quantity = quantity
    cart.items[itemIndex].price = product.price

    await cart.save()
    await cart.populate("items.product", "name price bannerImage stock isActive")

    res.json({
      success: true,
      message: "Cart updated successfully",
      data: {
        cart,
      },
    })
  } catch (error) {
    console.error("Update cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating cart",
    })
  }
}

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params

    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    )

    await cart.save()
    await cart.populate("items.product", "name price bannerImage stock isActive")

    res.json({
      success: true,
      message: "Item removed from cart",
      data: {
        cart,
      },
    })
  } catch (error) {
    console.error("Remove from cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error removing from cart",
    })
  }
}

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id })
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      })
    }

    cart.items = []
    await cart.save()

    res.json({
      success: true,
      message: "Cart cleared successfully",
      data: {
        cart,
      },
    })
  } catch (error) {
    console.error("Clear cart error:", error)
    res.status(500).json({
      success: false,
      message: "Server error clearing cart",
    })
  }
}

// @desc    Get cart summary
// @route   GET /api/cart/summary
// @access  Private
const getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name price bannerImage stock isActive"
    )

    if (!cart || cart.items.length === 0) {
      return res.json({
        success: true,
        data: {
          itemCount: 0,
          totalAmount: 0,
          items: [],
        },
      })
    }

    // Filter active products and calculate totals
    const activeItems = cart.items.filter(item => item.product && item.product.isActive)
    const itemCount = activeItems.reduce((total, item) => total + item.quantity, 0)
    const totalAmount = activeItems.reduce((total, item) => total + (item.price * item.quantity), 0)

    res.json({
      success: true,
      data: {
        itemCount,
        totalAmount,
        items: activeItems,
      },
    })
  } catch (error) {
    console.error("Get cart summary error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching cart summary",
    })
  }
}

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
}
