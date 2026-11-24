const express = require("express")
const router = express.Router()
const protect = require("../middleware/authMiddleware")
const admin = require("../middleware/adminMiddleware")
const shiprocket = require("../config/shiprocket")
const Order = require("../models/orderModel")

// @desc    Create shipping order
// @route   POST /api/shipping/create-shipment
// @access  Private (Admin or system)
router.post("/create-shipment", protect, async (req, res) => {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" })
    }

    const order = await Order.findById(orderId).populate("items.product")
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    if (order.paymentMethod !== "COD" && order.paymentStatus !== "Paid") {
      return res.status(400).json({ success: false, message: "Order must be paid before creating shipment" })
    }

    if (order.shipRocketOrderId) {
      return res.status(400).json({ success: false, message: "Shipment already created for this order" })
    }

    const customerData = {
      firstName: order.shippingAddress.firstName,
      lastName: order.shippingAddress.lastName,
      email: order.shippingAddress.email,
      phone: order.shippingAddress.phone,
      street: order.shippingAddress.street,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zipCode: order.shippingAddress.zipCode,
      country: order.shippingAddress.country,
    }

    const orderItems = order.items.map((item) => ({
      name: item.name,
      sku: String(item.product._id),
      units: item.quantity,
      selling_price: item.price,
    }))

    const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary"

    const shiprocketOrderPayload = {
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt || Date.now()).toISOString(),
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
      payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: order.subtotal,
      length: 10,
      breadth: 10,
      height: 10,
      weight: orderItems.reduce((w, it) => w + (it.units || 1) * 0.5, 0.5),
    }

    const shipRocketResponse = await shiprocket.createOrder(shiprocketOrderPayload)

    if (shipRocketResponse?.order_id || shipRocketResponse?.data?.order_id) {
      const sr = shipRocketResponse.data || shipRocketResponse
      order.shipRocketOrderId = sr.order_id
      order.shipRocketShipmentId = sr.shipment_id
      order.awbCode = sr.awb_code
      order.courierPartner = sr.courier_name
      order.shippingStatus = "Shipped"
      order.orderStatus = "Shipped"

      const estimatedDays = 5
      order.estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)

      await order.save()
    }

    res.status(200).json({
      success: true,
      message: "Shipment created successfully",
      data: {
        orderId: order._id,
        shipRocketOrderId: order.shipRocketOrderId,
        shipmentId: order.shipRocketShipmentId,
        awbCode: order.awbCode,
        courierPartner: order.courierPartner,
        estimatedDelivery: order.estimatedDelivery,
      },
    })
  } catch (error) {
    console.error("Create shipment error:", error)
    res.status(500).json({ success: false, message: "Failed to create shipment", error: error.message })
  }
})

// @desc    Track shipment
// @route   GET /api/shipping/track/:orderId
// @access  Private
router.get("/track/:orderId", protect, async (req, res) => {
  try {
    const { orderId } = req.params

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" })
    }

    if (req.user.role !== "admin" && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to track this order" })
    }

    if (!order.shipRocketShipmentId) {
      return res.status(400).json({ success: false, message: "No shipment found for this order" })
    }

    const trackingData = await shiprocket.trackShipment(order.shipRocketShipmentId)

    if (trackingData.tracking_data && trackingData.tracking_data.track_status) {
      const latestStatus = trackingData.tracking_data.track_status
      const statusMapping = {
        Shipped: "Shipped",
        "In Transit": "In Transit",
        "Out for Delivery": "Out for Delivery",
        Delivered: "Delivered",
        RTO: "RTO",
        Lost: "Lost",
      }

      if (statusMapping[latestStatus]) {
        order.shippingStatus = statusMapping[latestStatus]
        if (latestStatus === "Delivered") {
          order.orderStatus = "Delivered"
          order.deliveredAt = new Date()
        }
        await order.save()
      }
    }

    res.status(200).json({
      success: true,
      message: "Tracking information retrieved successfully",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        awbCode: order.awbCode,
        courierPartner: order.courierPartner,
        shippingStatus: order.shippingStatus,
        estimatedDelivery: order.estimatedDelivery,
        trackingData: trackingData,
      },
    })
  } catch (error) {
    console.error("Track shipment error:", error)
    res.status(500).json({ success: false, message: "Failed to track shipment", error: error.message })
  }
})

// @desc    Check serviceability
// @route   POST /api/shipping/check-serviceability
// @access  Public
router.post("/check-serviceability", async (req, res) => {
  try {
    const { pincode, weight, cod } = req.body

    if (!pincode) {
      return res.status(400).json({ success: false, message: "Pincode is required" })
    }

    const pickupPostcode = process.env.SHIPROCKET_PICKUP_POSTCODE || process.env.STORE_PINCODE || "110001"
    const serviceabilityData = await shiprocket.getServiceability(pickupPostcode, pincode, weight || 0.5, cod ? 1 : 0)

    res.status(200).json({ success: true, message: "Serviceability checked successfully", data: serviceabilityData })
  } catch (error) {
    console.error("Serviceability check error:", error)
    res.status(500).json({ success: false, message: "Failed to check serviceability", error: error.message })
  }
})

// @desc    Test ShipRocket authentication (Admin only)
// @route   GET /api/shipping/auth-test
// @access  Private (Admin)
router.get("/auth-test", protect, admin, async (req, res) => {
  try {
    const token = await shiprocket.authenticate()
    return res.status(200).json({ success: true, message: "ShipRocket auth successful", tokenPresent: Boolean(token) })
  } catch (error) {
    console.error("ShipRocket auth test failed:", error)
    return res.status(500).json({ success: false, message: "ShipRocket auth failed", error: error.message })
  }
})

// @desc    Get all shipments (Admin only)
// @route   GET /api/shipping/shipments
// @access  Private (Admin)
router.get("/shipments", protect, admin, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const orders = await Order.find({ shipRocketOrderId: { $exists: true } })
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Order.countDocuments({ shipRocketOrderId: { $exists: true } })

    const shipments = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: { name: `${order.user.firstName} ${order.user.lastName}`, email: order.user.email },
      shipRocketOrderId: order.shipRocketOrderId,
      shipmentId: order.shipRocketShipmentId,
      awbCode: order.awbCode,
      courierPartner: order.courierPartner,
      shippingStatus: order.shippingStatus,
      orderStatus: order.orderStatus,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
    }))

    res.status(200).json({
      success: true,
      message: "Shipments retrieved successfully",
      data: {
        shipments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    })
  } catch (error) {
    console.error("Get shipments error:", error)
    res.status(500).json({ success: false, message: "Failed to retrieve shipments", error: error.message })
  }
})

module.exports = router


