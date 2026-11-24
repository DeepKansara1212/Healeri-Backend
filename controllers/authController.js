const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/userModel")
const https = require("https")
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

const verifyGoogleIdToken = (credential) =>
  new Promise((resolve, reject) => {
    const url = new URL("https://oauth2.googleapis.com/tokeninfo")
    url.searchParams.set("id_token", credential)

    const request = https.get(url, (response) => {
      let body = ""
      response.setEncoding("utf8")
      response.on("data", (chunk) => {
        body += chunk
      })
      response.on("end", () => {
        try {
          resolve({
            statusCode: response.statusCode,
            identity: JSON.parse(body),
          })
        } catch (error) {
          reject(new Error("Google returned an invalid token verification response"))
        }
      })
    })

    request.setTimeout(8000, () => request.destroy(new Error("Google token verification timed out")))
    request.on("error", reject)
  })

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
    })

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    })
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if user exists and get password
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      })
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Generate token
    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
    })
  }
}

// @desc    Sign in or register with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const credential = req.body?.credential

  if (!clientId) {
    return res.status(503).json({
      success: false,
      message: "Google sign-in is not configured on the server",
    })
  }
  if (!credential || typeof credential !== "string") {
    return res.status(400).json({
      success: false,
      message: "Google credential is required",
    })
  }

  try {
    let verification
    try {
      verification = await verifyGoogleIdToken(credential)
    } catch (error) {
      console.error("Google token verification request failed:", error.message)
      return res.status(502).json({
        success: false,
        message: "Google sign-in could not be verified right now",
      })
    }

    if (verification.statusCode !== 200) {
      const isProviderUnavailable = verification.statusCode >= 500 || verification.statusCode === 429
      return res.status(isProviderUnavailable ? 503 : 401).json({
        success: false,
        message:
          isProviderUnavailable
            ? "Google sign-in could not be verified right now"
            : "Google sign-in credential is invalid or expired",
      })
    }

    const identity = verification.identity
    if (
      identity.aud !== clientId ||
      String(identity.email_verified) !== "true" ||
      !identity.email
    ) {
      return res.status(401).json({
        success: false,
        message: "Google account could not be verified",
      })
    }

    const email = identity.email.trim().toLowerCase()
    let user = await User.findOne({ email })

    if (!user) {
      const nameParts = String(identity.name || "").trim().split(/\s+/)
      const firstName = String(identity.given_name || nameParts.shift() || "Google").slice(0, 50)
      const lastName = String(identity.family_name || nameParts.join(" ") || "User").slice(0, 50)

      try {
        user = await User.create({
          firstName,
          lastName,
          email,
          password: crypto.randomBytes(32).toString("hex"),
        })
      } catch (error) {
        if (error.code !== 11000) throw error
        user = await User.findOne({ email })
        if (!user) throw error
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      })
    }

    return res.json({
      success: true,
      message: "Google sign-in successful",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
        token: generateToken(user._id),
      },
    })
  } catch (error) {
    console.error("Google sign-in error:", error.message)
    return res.status(500).json({
      success: false,
      message: "Google sign-in failed on the server",
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist")

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          wishlist: user.wishlist,
          createdAt: user.createdAt,
        },
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error fetching profile",
    })
  }
}

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address } = req.body

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        address,
      },
      { new: true, runValidators: true },
    )

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
    })
  }
}

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Get user with password
    const user = await User.findById(req.user.id).select("+password")

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Update password
    user.password = newPassword
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

// @desc    Add/Remove product from wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params
    const user = await User.findById(req.user.id)

    const isInWishlist = user.wishlist.includes(productId)

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter((id) => id.toString() !== productId)
    } else {
      // Add to wishlist
      user.wishlist.push(productId)
    }

    await user.save()

    res.json({
      success: true,
      message: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
      data: {
        wishlist: user.wishlist,
        action: isInWishlist ? "removed" : "added",
      },
    })
  } catch (error) {
    console.error("Toggle wishlist error:", error)
    res.status(500).json({
      success: false,
      message: "Server error updating wishlist",
    })
  }
}

// @desc    Get user wishlist
// @route   GET /api/auth/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "wishlist",
      populate: {
        path: "category",
        select: "name",
      },
    })

    res.json({
      success: true,
      data: {
        wishlist: user.wishlist,
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

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If your email is registered, you'll receive password reset instructions",
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail(user.email, resetUrl);

    if (!emailResult.success) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent",
      });
    }

    res.status(200).json({
      success: true,
      message: "If your email is registered, you'll receive password reset instructions",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset request",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

// Add these to the module.exports
module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getUserProfile,
  updateUserProfile,
  changePassword,
  toggleWishlist,
  getWishlist,
  forgotPassword,
  resetPassword,
};
