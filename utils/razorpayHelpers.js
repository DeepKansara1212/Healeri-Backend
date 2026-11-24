const crypto = require("crypto")
const razorpay = require("../config/razorpay")

const razorpayHelpers = {
  // Create Razorpay order
  async createOrder(amount, currency = "INR", receipt = null) {
    try {
      // Validate amount
      if (!amount || amount <= 0) {
        throw new Error("Invalid amount. Amount must be greater than 0")
      }

      // Convert to paise with proper rounding to avoid precision issues
      const amountInPaise = Math.round(parseFloat(amount) * 100)
      
      if (amountInPaise < 100) {
        throw new Error("Amount too small. Minimum amount is 1 INR (100 paise)")
      }

      const options = {
        amount: amountInPaise,
        currency,
        receipt: receipt || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payment_capture: 1, // Auto capture payment
        notes: {
          description: `Order payment for ${receipt || "order"}`,
        },
      }

      const order = await razorpay.orders.create(options)
      return order
    } catch (error) {
      console.error("Razorpay order creation failed:", error)
      if (error.error && error.error.description) {
        throw new Error(`Failed to create payment order: ${error.error.description}`)
      }
      throw new Error(`Failed to create payment order: ${error.message || "Unknown error"}`)
    }
  },

  // Verify payment signature
  verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        console.error("Missing required parameters for signature verification")
        return false
      }

      if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay secret key not configured")
        return false
      }

      const body = `${razorpayOrderId}|${razorpayPaymentId}`
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex")

      const isValid = expectedSignature === razorpaySignature
      
      if (!isValid) {
        console.error("Signature verification failed", {
          expected: expectedSignature,
          received: razorpaySignature,
        })
      }

      return isValid
    } catch (error) {
      console.error("Payment signature verification error:", error)
      return false
    }
  },

  // Verify webhook signature
  verifyWebhookSignature(body, signature) {
    try {
      if (!body || !signature) {
        console.error("Missing body or signature for webhook verification")
        return false
      }

      if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
        console.error("Razorpay webhook secret not configured")
        return false
      }

      // Handle both Buffer and string body
      const bodyString = Buffer.isBuffer(body) ? body.toString("utf8") : typeof body === "string" ? body : JSON.stringify(body)
      
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(bodyString)
        .digest("hex")

      const isValid = expectedSignature === signature
      
      if (!isValid) {
        console.error("Webhook signature verification failed", {
          expected: expectedSignature,
          received: signature,
        })
      }

      return isValid
    } catch (error) {
      console.error("Webhook signature verification error:", error)
      return false
    }
  },

  // Get payment details
  async getPaymentDetails(paymentId) {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required")
      }

      const payment = await razorpay.payments.fetch(paymentId)
      
      if (!payment) {
        throw new Error("Payment not found")
      }

      return payment
    } catch (error) {
      console.error("Failed to fetch payment details:", error)
      if (error.error && error.error.description) {
        throw new Error(`Failed to get payment details: ${error.error.description}`)
      }
      throw new Error(`Failed to get payment details: ${error.message || "Unknown error"}`)
    }
  },

  // Refund payment
  async refundPayment(paymentId, amount = null) {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required for refund")
      }

      const refundData = {}
      
      if (amount) {
        // Validate and convert amount to paise
        const amountInPaise = Math.round(parseFloat(amount) * 100)
        if (amountInPaise <= 0) {
          throw new Error("Refund amount must be greater than 0")
        }
        refundData.amount = amountInPaise
      }

      const refund = await razorpay.payments.refund(paymentId, refundData)
      return refund
    } catch (error) {
      console.error("Payment refund failed:", error)
      if (error.error && error.error.description) {
        throw new Error(`Failed to process refund: ${error.error.description}`)
      }
      throw new Error(`Failed to process refund: ${error.message || "Unknown error"}`)
    }
  },
}

module.exports = razorpayHelpers
