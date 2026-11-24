const axios = require("axios")

class ShipRocketService {
  constructor() {
    this.baseURL = process.env.SHIPROCKET_API_URL || "https://apiv2.shiprocket.in/v1/external"
    this.token = null
    this.tokenExpiry = null
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      })

      this.token = response.data.token
      // Token expires in 10 days, refresh before that
      this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000

      return this.token
    } catch (error) {
      console.error("ShipRocket authentication failed:", error.response?.data || error.message)
      throw new Error("Failed to authenticate with ShipRocket")
    }
  }

  async getAuthHeaders() {
    // Check if token is expired or doesn't exist
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate()
    }

    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  async createOrder(orderData) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.post(`${this.baseURL}/orders/create/adhoc`, orderData, { headers })
      return response.data
    } catch (error) {
      console.error("ShipRocket order creation failed:", error.response?.data || error.message)
      throw new Error("Failed to create ShipRocket order")
    }
  }

  async trackShipment(shipmentId) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.get(`${this.baseURL}/courier/track/shipment/${shipmentId}`, { headers })
      return response.data
    } catch (error) {
      console.error("ShipRocket tracking failed:", error.response?.data || error.message)
      throw new Error("Failed to track shipment")
    }
  }

  async getServiceability(pickupPostcode, deliveryPostcode, weight, cod = 0) {
    try {
      const headers = await this.getAuthHeaders()
      const response = await axios.get(`${this.baseURL}/courier/serviceability/`, {
        headers,
        params: {
          pickup_postcode: pickupPostcode,
          delivery_postcode: deliveryPostcode,
          weight: weight,
          cod: cod,
        },
      })
      return response.data
    } catch (error) {
      console.error("ShipRocket serviceability check failed:", error.response?.data || error.message)
      throw new Error("Failed to check serviceability")
    }
  }
}

module.exports = new ShipRocketService()
