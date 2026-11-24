const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
})

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Online", "Card"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
    },
    notes: {
      type: String,
    },
    trackingNumber: {
      type: String,
    },
    deliveredAt: {
      type: Date,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    shipRocketOrderId: {
      type: String,
    },
    shipRocketShipmentId: {
      type: String,
    },
    courierPartner: {
      type: String,
    },
    awbCode: {
      type: String,
    },
    shippingStatus: {
      type: String,
      enum: ["Not Shipped", "Shipped", "In Transit", "Out for Delivery", "Delivered", "RTO", "Lost"],
      default: "Not Shipped",
    },
    estimatedDelivery: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Generate order number before validation
orderSchema.pre("validate", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = "HL" + Date.now() + Math.floor(Math.random() * 1000)
  }
  next()
})

module.exports = mongoose.model("Order", orderSchema)
