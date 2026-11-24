const Inquiry = require("../models/inquiryModel")
const { sendBulkInquiryEmail } = require("../utils/emailService")

// Create a new bulk order inquiry
const createInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, company, product, quantity, message } = req.body

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      company,
      product,
      quantity,
      message,
      meta: { ip: req.ip, userAgent: req.headers["user-agent"] },
    })

    // Fire-and-forget email notification; don't block response on email result
    sendBulkInquiryEmail({ name, email, phone, company, product, quantity, message }).catch(() => {})

    res.status(201).json({ success: true, data: inquiry })
  } catch (error) {
    next(error)
  }
}

module.exports = { createInquiry }


