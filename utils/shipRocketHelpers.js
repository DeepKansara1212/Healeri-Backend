const shipRocketService = require("../config/shiprocket")

const shipRocketHelpers = {
  // Create shipping order
  async createShippingOrder(orderData, customerData, productData) {
    try {
      const shipRocketOrder = {
        order_id: orderData.orderNumber,
        order_date: new Date().toISOString().split("T")[0],
        pickup_location: "Primary", // You can configure this
        channel_id: "", // Leave empty for manual orders
        comment: orderData.notes || "Order from Healery",
        billing_customer_name: customerData.firstName + " " + customerData.lastName,
        billing_last_name: customerData.lastName,
        billing_address: customerData.street,
        billing_address_2: "",
        billing_city: customerData.city,
        billing_pincode: customerData.zipCode,
        billing_state: customerData.state,
        billing_country: customerData.country,
        billing_email: customerData.email,
        billing_phone: customerData.phone,
        shipping_is_billing: true,
        shipping_customer_name: customerData.firstName + " " + customerData.lastName,
        shipping_last_name: customerData.lastName,
        shipping_address: customerData.street,
        shipping_address_2: "",
        shipping_city: customerData.city,
        shipping_pincode: customerData.zipCode,
        shipping_state: customerData.state,
        shipping_country: customerData.country,
        shipping_email: customerData.email,
        shipping_phone: customerData.phone,
        order_items: productData.map((item) => ({
          name: item.name,
          sku: item.product || item.id,
          units: item.quantity,
          selling_price: item.price,
          discount: "",
          tax: "",
          hsn: 441122, // Default HSN code, you can customize this
        })),
        payment_method: orderData.paymentMethod === "COD" ? "COD" : "Prepaid",
        shipping_charges: orderData.shippingCost || 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: orderData.discount || 0,
        sub_total: orderData.subtotal,
        length: 10, // Default dimensions, you can customize
        breadth: 10,
        height: 10,
        weight: 0.5, // Default weight in kg
      }

      const result = await shipRocketService.createOrder(shipRocketOrder)
      return result
    } catch (error) {
      console.error("ShipRocket order creation failed:", error)
      throw error
    }
  },

  // Track shipment
  async trackShipment(shipmentId) {
    try {
      const trackingData = await shipRocketService.trackShipment(shipmentId)
      return trackingData
    } catch (error) {
      console.error("Shipment tracking failed:", error)
      throw error
    }
  },

  // Check serviceability
  async checkServiceability(deliveryPincode, weight = 0.5, cod = false) {
    try {
      const pickupPincode = "110001" // Default pickup pincode, configure this
      const serviceability = await shipRocketService.getServiceability(
        pickupPincode,
        deliveryPincode,
        weight,
        cod ? 1 : 0,
      )
      return serviceability
    } catch (error) {
      console.error("Serviceability check failed:", error)
      throw error
    }
  },
}

module.exports = shipRocketHelpers
