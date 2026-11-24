const mongoose = require("mongoose")

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    product: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    message: { type: String, trim: true },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
    meta: { type: Object },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Inquiry", inquirySchema)


