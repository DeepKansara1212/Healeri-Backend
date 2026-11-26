const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const mongodbDnsServers = (process.env.MONGODB_DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean)

if (mongodbDnsServers.length > 0) {
  require("dns").setServers(mongodbDnsServers)
}

// Import webhook dependencies
const razorpayHelpers = require("./utils/razorpayHelpers")
const Order = require("./models/orderModel")

const app = express()

// --- Razorpay Webhook route registered before JSON body parser ---
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"]
    const body = req.body

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook signature",
      })
    }

    // Verify webhook signature
    const isValidSignature = razorpayHelpers.verifyWebhookSignature(body, signature)
    if (!isValidSignature) {
      console.error("Invalid webhook signature received")
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      })
    }

    // Parse body - handle both Buffer and string
    const bodyString = Buffer.isBuffer(body) ? body.toString("utf8") : body
    let event
    try {
      event = JSON.parse(bodyString)
    } catch (parseError) {
      console.error("Failed to parse webhook body:", parseError)
      return res.status(400).json({
        success: false,
        message: "Invalid webhook body format",
      })
    }

    // Extract payment entity
    if (!event.payload || !event.payload.payment || !event.payload.payment.entity) {
      console.error("Invalid webhook event structure:", event)
      return res.status(400).json({
        success: false,
        message: "Invalid webhook event structure",
      })
    }

    const paymentEntity = event.payload.payment.entity 

    // Find order by Razorpay order ID
    const order = await Order.findOne({ razorpayOrderId: paymentEntity.order_id })
    if (!order) {
      console.log("Order not found for webhook:", paymentEntity.order_id)
      return res.status(200).json({ success: true }) // Return success to avoid retries
    }

    // Handle different webhook events
    switch (event.event) {
      case "payment.captured":
        // Only update if not already paid (avoid duplicate processing)
        if (order.paymentStatus !== "Paid") {
          order.paymentStatus = "Paid"
          order.orderStatus = "Processing"
          order.razorpayPaymentId = paymentEntity.id
          await order.save()
          // ... Auto-create ShipRocket shipment logic can go here if needed ...
        }
        break
      case "payment.failed":
        if (order.paymentStatus !== "Failed") {
          order.paymentStatus = "Failed"
          await order.save()
        }
        break
      case "payment.refunded":
        order.paymentStatus = "Refunded"
        order.orderStatus = "Cancelled"
        await order.save()
        break
      case "order.paid":
        if (order.paymentStatus !== "Paid") {
          order.paymentStatus = "Paid"
          order.orderStatus = "Processing"
          await order.save()
        }
        break
      default:
        console.log("Unhandled webhook event:", event.event)
    }
    res.status(200).json({ success: true, message: "Webhook processed successfully" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    // Return 200 to prevent Razorpay from retrying
    // Log the error for manual investigation
    res.status(200).json({
      success: false,
      message: "Webhook processing failed but acknowledged",
      error: error.message,
    })
  }
})

// Security middleware
app.use(helmet())

// CORS configuration
const developmentOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
      ]

const configuredOrigins = [
  ...(process.env.FRONTEND_URL || "").split(","),
  ...(process.env.CORS_ORIGINS || "").split(","),
]
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => new URL(origin).origin)

const allowedOrigins = new Set([...developmentOrigins, ...configuredOrigins])

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true)
      return callback(new Error(`Origin not allowed by CORS: ${origin}`))
    },
    credentials: true,
  }),
)

// Body parsing middleware -- after webhook route!
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Import routes
const authRoutes = require("./routes/authRoutes")
const productRoutes = require("./routes/productRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const cartRoutes = require("./routes/cartRoutes")
const orderRoutes = require("./routes/orderRoutes")
const reviewRoutes = require("./routes/reviewRoutes")
const userRoutes = require("./routes/userRoutes")
const wishlistRoutes = require("./routes/wishlistRoutes") 
const adminRoutes = require("./routes/adminRoutes")
const inquiryRoutes = require("./routes/inquiryRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const shippingRoutes = require("./routes/shippingRoutes")
const errorMiddleware = require("./middleware/errorMiddleware")

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/users", userRoutes)
app.use("/api/wishlist", wishlistRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/inquiries", inquiryRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/shipping", shippingRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Healery API is running successfully",
    timestamp: new Date().toISOString(),
  })
})

// Error handling middleware (must be last)
app.use(errorMiddleware)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  })
})

const PORT = process.env.PORT || 5000
// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📱 API URL: http://localhost:${PORT}/api`)
    })
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  })
// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err)
  process.exit(1)
})
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err)
  process.exit(1)
})
