const User = require("../models/userModel")
const bcrypt = require("bcryptjs")

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")

    // Get user's order statistics
    const Order = require("../models/orderModel")
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Pending"] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Processing"] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Shipped"] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Delivered"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$orderStatus", "Cancelled"] }, 1, 0] }
          }
        }
      }
    ])

    const stats = orderStats.length > 0 ? orderStats[0] : {
      totalOrders: 0,
      totalSpent: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0
    }

    res.json({
      success: true,
      data: {
        user,
        orderStats: stats,
      },
    })
  } catch (error) {
    console.error("Get user profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching user profile",
    })
  }
}

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if email is being changed and if it conflicts with existing user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        })
      }
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName
    if (lastName !== undefined) user.lastName = lastName
    if (email !== undefined) user.email = email
    if (phone !== undefined) user.phone = phone
    if (address !== undefined) user.address = address

    await user.save()

    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userResponse,
      },
    })
  } catch (error) {
    console.error("Update user profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating user profile",
    })
  }
}

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.id).select("+password")
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)

    await user.save()

    res.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    })
  }
}

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, sort = "createdAt", order = "desc" } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (role) filter.role = role
    if (isActive !== undefined) filter.isActive = isActive === "true"

    const sortOptions = {}
    sortOptions[sort] = order === "desc" ? -1 : 1

    const users = await User.find(filter)
      .select("-password")
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)

    const total = await User.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get all users error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    })
  }
}

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      data: {
        user,
      },
    })
  } catch (error) {
    console.error("Get user by ID error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching user",
    })
  }
}

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, role, isActive } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if email is being changed and if it conflicts with existing user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        })
      }
    }

    // Update fields
    if (firstName !== undefined) user.firstName = firstName
    if (lastName !== undefined) user.lastName = lastName
    if (email !== undefined) user.email = email
    if (phone !== undefined) user.phone = phone
    if (address !== undefined) user.address = address
    if (role !== undefined) user.role = role
    if (isActive !== undefined) user.isActive = isActive

    await user.save()

    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        user: userResponse,
      },
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating user",
    })
  }
}

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      })
    }

    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error deleting user",
    })
  }
}

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const adminUsers = await User.countDocuments({ role: "admin" })
    const customerUsers = await User.countDocuments({ role: "customer" })

    // Get users registered in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    })

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          adminUsers,
          customerUsers,
          newUsers,
        },
      },
    })
  } catch (error) {
    console.error("Get user stats error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching user statistics",
    })
  }
}

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      })
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken()
    await user.save()

    // TODO: Send email with reset token
    // For now, just return the token (in production, send via email)
    res.json({
      success: true,
      message: "Password reset email sent",
      data: {
        resetToken: resetToken, // Remove this in production
      },
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error processing forgot password",
    })
  }
}

// @desc    Reset password
// @route   PUT /api/users/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      })
    }

    // Set new password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    res.json({
      success: true,
      message: "Password reset successful",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
    })
  }
}

// @desc    Get user's recent orders with tracking
// @route   GET /api/users/profile/orders
// @access  Private
const getUserProfileOrders = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query
    const skip = (page - 1) * limit

    const Order = require("../models/orderModel")
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name bannerImage")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select("-paymentResult")

    const total = await Order.countDocuments({ user: req.user.id })

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalOrders: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      },
    })
  } catch (error) {
    console.error("Get user profile orders error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching user orders",
    })
  }
}

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  forgotPassword,
  resetPassword,
  getUserProfileOrders,
}
