const Razorpay = require("razorpay")

// Validate environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Razorpay configuration error: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET")
  throw new Error("Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.")
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

module.exports = razorpay 
