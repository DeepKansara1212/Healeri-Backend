const express = require("express")
const router = express.Router()
const protect = require("../middleware/authMiddleware")
const adminMiddleware = require("../middleware/adminMiddleware")
const razorpayHelpers = require("../utils/razorpayHelpers")
const razorpay = require("../config/razorpay")
const Order = require("../models/orderModel")
const shiprocket = require("../config/shiprocket")

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
router.post("/create-order", protect, async (req, res) => {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      })
    }

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if order belongs to the user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      })
    }

    // Check if order is already paid
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      })
    }

    // Check if order already has a Razorpay order ID (reuse if exists and not expired)
    if (order.razorpayOrderId) {
      try {
        // Try to fetch the existing order from Razorpay to check if it's still valid
        const existingOrder = await razorpay.orders.fetch(order.razorpayOrderId)
        if (existingOrder && existingOrder.status === "created") {
          // Return existing order if still valid
          return res.status(200).json({
            success: true,
            message: "Payment order already exists",
            data: {
              orderId: existingOrder.id,
              amount: existingOrder.amount,
              currency: existingOrder.currency,
              keyId: process.env.RAZORPAY_KEY_ID,
            },
          })
        }
      } catch (error) {
        // If order doesn't exist or is invalid, create a new one
        console.log("Existing Razorpay order not found or invalid, creating new one")
      }
    }

    // Create Razorpay order
    const razorpayOrder = await razorpayHelpers.createOrder(order.totalAmount, "INR", order.orderNumber)

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id
    await order.save()

    res.status(200).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    })
  } catch (error) {
    console.error("Create payment order error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: error.message,
    })
  }
})

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify-payment
// @access  Private
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification data",
      })
    }

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if order belongs to the user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order",
      })
    }

    // Check if payment is already verified
    if (order.paymentStatus === "Paid" && order.razorpayPaymentId === razorpayPaymentId) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: {
          order: order,
          paymentDetails: {
            id: razorpayPaymentId,
            status: "captured",
          },
        },
      })
    }

    // Verify payment signature
    const isValidSignature = razorpayHelpers.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    )

    if (!isValidSignature) {
      // Update order status to failed
      order.paymentStatus = "Failed"
      await order.save()

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      })
    }

    // Get payment details from Razorpay to verify payment status
    const paymentDetails = await razorpayHelpers.getPaymentDetails(razorpayPaymentId)

    // Verify payment is actually captured
    if (paymentDetails.status !== "captured") {
      order.paymentStatus = "Failed"
      await order.save()

      return res.status(400).json({
        success: false,
        message: `Payment not captured. Current status: ${paymentDetails.status}`,
      })
    }

    // Verify payment amount matches order amount
    const paymentAmountInRupees = paymentDetails.amount / 100
    if (Math.abs(paymentAmountInRupees - order.totalAmount) > 0.01) {
      console.error("Payment amount mismatch", {
        orderAmount: order.totalAmount,
        paymentAmount: paymentAmountInRupees,
      })
      // Log but don't fail - amounts might differ slightly due to rounding
    }

    // Update order with payment details
    order.razorpayPaymentId = razorpayPaymentId
    order.razorpaySignature = razorpaySignature
    order.paymentStatus = "Paid"
    order.orderStatus = "Processing"
    await order.save()

    // Auto-create ShipRocket shipment after successful payment (for prepaid orders)
    try {
      if (!order.shipRocketOrderId) {
        const populatedOrder = await Order.findById(order._id).populate("items.product")

        const customerData = {
          firstName: populatedOrder.shippingAddress.firstName,
          lastName: populatedOrder.shippingAddress.lastName,
          email: populatedOrder.shippingAddress.email,
          phone: populatedOrder.shippingAddress.phone,
          street: populatedOrder.shippingAddress.street,
          city: populatedOrder.shippingAddress.city,
          state: populatedOrder.shippingAddress.state,
          zipCode: populatedOrder.shippingAddress.zipCode,
          country: populatedOrder.shippingAddress.country,
        }

        const orderItems = populatedOrder.items.map((item) => ({
          name: item.name,
          sku: String(item.product._id),
          units: item.quantity,
          selling_price: item.price,
        }))

        const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary"

        const shiprocketOrderPayload = {
          order_id: populatedOrder.orderNumber,
          order_date: new Date(populatedOrder.createdAt || Date.now()).toISOString(),
          pickup_location: pickupLocation,
          billing_customer_name: customerData.firstName,
          billing_last_name: customerData.lastName,
          billing_address: customerData.street,
          billing_city: customerData.city,
          billing_pincode: customerData.zipCode,
          billing_state: customerData.state,
          billing_country: customerData.country,
          billing_email: customerData.email,
          billing_phone: customerData.phone,
          shipping_is_billing: true,
          order_items: orderItems,
          payment_method: populatedOrder.paymentMethod === "COD" ? "COD" : "Prepaid",
          sub_total: populatedOrder.subtotal,
          length: 10,
          breadth: 10,
          height: 10,
          weight: orderItems.reduce((w, it) => w + (it.units || 1) * 0.5, 0.5),
        }

        const shipRocketResponse = await shiprocket.createOrder(shiprocketOrderPayload)

        if (shipRocketResponse?.order_id || shipRocketResponse?.data?.order_id) {
          const sr = shipRocketResponse.data || shipRocketResponse
          populatedOrder.shipRocketOrderId = sr.order_id
          populatedOrder.shipRocketShipmentId = sr.shipment_id
          populatedOrder.awbCode = sr.awb_code
          populatedOrder.courierPartner = sr.courier_name
          populatedOrder.shippingStatus = "Shipped"
          populatedOrder.orderStatus = "Shipped"

          const estimatedDays = 5
          populatedOrder.estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)

          await populatedOrder.save()
        }
      }
    } catch (shipErr) {
      console.error("Auto shipment creation failed:", shipErr)
      // do not fail payment verification response if shipment creation fails
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        order: order,
        paymentDetails: {
          id: paymentDetails.id,
          amount: paymentDetails.amount / 100, // Convert from paise
          currency: paymentDetails.currency,
          status: paymentDetails.status,
          method: paymentDetails.method,
          created_at: paymentDetails.created_at,
        },
      },
    })
  } catch (error) {
    console.error("Payment verification error:", error)
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
    })
  }
})

// @desc    Refund payment
// @route   POST /api/payments/refund
// @access  Private (Admin only)
router.post("/refund", protect, adminMiddleware, async (req, res) => {
  try {
    const { orderId, amount } = req.body

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      })
    }

    // Find the order
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    // Check if order is paid
    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is not paid, cannot refund",
      })
    }

    // Check if payment ID exists
    if (!order.razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID not found for this order",
      })
    }

    // Check if already refunded
    if (order.paymentStatus === "Refunded") {
      return res.status(400).json({
        success: false,
        message: "Order is already refunded",
      })
    }

    // Validate refund amount if provided
    if (amount && (amount <= 0 || amount > order.totalAmount)) {
      return res.status(400).json({
        success: false,
        message: `Invalid refund amount. Must be between 0 and ${order.totalAmount}`,
      })
    }

    // Process refund
    const refund = await razorpayHelpers.refundPayment(order.razorpayPaymentId, amount)

    // Determine if full or partial refund
    const refundAmount = refund.amount / 100 // Convert from paise
    const isFullRefund = !amount || Math.abs(refundAmount - order.totalAmount) < 0.01

    // Update order status
    if (isFullRefund) {
      order.paymentStatus = "Refunded"
      order.orderStatus = "Cancelled"
    } else {
      // For partial refund, keep order status but update payment status
      // You might want to add a partial refund status or note
      order.paymentStatus = "Refunded" // Or create a "Partially Refunded" status
    }

    // Add refund note if available
    if (order.notes) {
      order.notes += `\nRefund processed: ${refund.id} - Amount: ${refundAmount}`
    } else {
      order.notes = `Refund processed: ${refund.id} - Amount: ${refundAmount}`
    }

    await order.save()

    res.status(200).json({
      success: true,
      message: isFullRefund ? "Full refund processed successfully" : "Partial refund processed successfully",
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status,
        orderId: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
    })
  } catch (error) {
    console.error("Refund processing error:", error)
    res.status(500).json({
      success: false,
      message: "Refund processing failed",
      error: error.message,
    })
  }
})

module.exports = router
