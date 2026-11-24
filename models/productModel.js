const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [500, "Product name cannot exceed 500 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },
    fullDescription: {
      type: String,
      maxlength: [5000, "Full description cannot exceed 5000 characters"],
    },
    additionalInformation: {
      type: String,
      maxlength: [3000, "Additional information cannot exceed 3000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    bannerImage: {
      type: String,
      required: [true, "Banner image is required"],
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    ingredients: [
      {
        type: String,
      },
    ],
    benefits: [
      {
        type: String,
      },
    ],
    usage: [
      {
        type: String,
      },
    ],
    weight: {
      type: String,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, "Rating cannot be negative"],
      max: [5, "Rating cannot exceed 5"],
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    badge: {
      type: String,
      enum: ["Best Seller", "New", "Sale", "Featured", ""],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Index for search functionality
productSchema.index({
  name: "text",
  description: "text",
  "category.name": "text",
})

// Calculate discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100)
  }
  return 0
});

// Check if product is in stock
productSchema.virtual("inStock").get(function () {
  return this.stock > 0
});

module.exports = mongoose.model("Product", productSchema)
