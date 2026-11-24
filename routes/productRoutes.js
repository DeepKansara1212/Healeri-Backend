const express = require("express")
const {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getProductsByCategory,
  searchProducts,
} = require("../controllers/productController")

const router = express.Router()

// Public routes
router.get("/", getProducts)
router.get("/featured", getFeaturedProducts)
router.get("/search", searchProducts)
router.get("/category/:categoryId", getProductsByCategory)
router.get("/:id", getProductById)

module.exports = router
