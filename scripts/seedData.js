const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Import models
const User = require("../models/userModel");
const { Category } = require("../models/categoryModel");
const Product = require("../models/productModel");

// Connect to MongoDB
if (!process.env.MONGODB_URI) {
  console.error(
    "❌ MONGODB_URI is not set. Ensure BACKEND/.env exists and has MONGODB_URI."
  );
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB for seeding"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Sample data
const categories = [
  {
    name: "Tablets",
    description: "Tablet form supplements and remedies",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500",
    isActive: true,
  },
  {
    name: "Powder",
    description: "Powdered supplements and mixes",
    image: "https://images.unsplash.com/photo-1604908554007-1c2f4da58c6a?w=500",
    isActive: true,
  },
];

const products = [
  {
    name: "Pure Beetroot Powder 150g, Rich in Natural Antioxidants, Fibre & Minerals, Use in Smoothies, Juices, Cooking & Baking, No Additives or Preservatives, Herbal Powder for Face Pack & Natural Hair Mask - Pack",
    description:
      "Beet Root Powder is a natural supplement that is made from the root of the beet plant. It is a good source of iron and vitamin C.",
    fullDescription:
      "Our Pure Beetroot Powder is meticulously processed from premium quality beetroots to preserve all natural nutrients. This superfood powder is rich in natural antioxidants, dietary fiber, and essential minerals including iron, potassium, and magnesium. Perfect for adding to smoothies, juices, cooking, and baking, this powder enhances your daily nutrition without any additives or preservatives. Beyond consumption, it also serves as an excellent natural ingredient for face packs and hair masks, providing multiple health and beauty benefits.",
    additionalInformation:
      "Net Weight: 150g | Storage: Store in a cool, dry place away from direct sunlight | Shelf Life: 24 months from date of manufacture | Country of Origin: India | Certification: 100% Natural, No Additives, No Preservatives | Usage: Mix 1-2 teaspoons in smoothies, juices, or recipes | Best Before: See packaging",
    price: 300,
    originalPrice: 350,
    bannerImage:
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1758196711/1_we3tkb.jpg",
    images: [
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1758196759/2_e6mkwf.jpg",
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1762498751/2_Beetroot_kgltc8.jpg",
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1758196843/6_utedod.jpg",
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1758196823/5_jzu1lj.jpg",
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1758196804/3_cbkwqb.jpg",
      "https://res.cloudinary.com/dngcngvgs/image/upload/v1758196815/4_lmxjta.jpg",
    ],
    stock: 50,
    isActive: true,
    isFeatured: true,
    rating: 4.5,
  },
  {
    name: "Amla Tablets 33mg, 60 Tablets, Rich In Vitamin C & Antioxidants, Natural & Pure Amalaki Extract Supplement For Enhanced Immunity & Wellness, Supports Skincare & Hair Health, Pack of 1",
    description:
      "Amla Tablets is a natural supplement that is made from the fruit of the amla plant. It is a good source of vitamin C and antioxidants.",
    fullDescription:
      "Amla Tablets are crafted from the finest Amla (Indian Gooseberry) fruits, known as one of nature's richest sources of Vitamin C. These tablets provide powerful antioxidant support, boost immunity, and promote overall health and vitality. Amla is revered in Ayurveda for its numerous health benefits including supporting digestive health, enhancing skin radiance, and promoting hair growth. Our tablets are easy to consume and are perfect for those seeking a convenient way to incorporate Amla's benefits into their daily wellness routine.",
    additionalInformation:
      "Quantity: 60 Tablets | Dosage: 1-2 tablets twice daily with water | Storage: Store in a cool, dry place | Shelf Life: 36 months | Country of Origin: India | Certification: 100% Natural, Ayurvedic | Best Before: See packaging | Ingredients: Pure Amla Extract",
    price: 249,
    originalPrice: 299,
    bannerImage:
      "https://m.media-amazon.com/images/I/51C+CN3+ovL._SX679_.jpg",
    images: [
      "https://m.media-amazon.com/images/I/71yjF2q2+FL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/7174QYo4CwL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71Pw0Q0TZIL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71TwY3PdfxL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71hR772WKEL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71zxf9qm4bL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61ArngCaYrL._SL1500_.jpg",
    ],
    stock: 30,
    isActive: true,
    isFeatured: true,
    rating: 4.8,
    numReviews: 8,
  },
  {
    name: "Ashwagandha Tablets, Natural Support for Stress Relief, Strength & Immune Health, Enhances Vitality & Stamina, Natural Calm Focus, Helps Manage Stress & Endurance ",
    description:
      "Ashwagandha Tablets is a natural supplement that is made from the root of the ashwagandha plant. It is a good source of antioxidants and anti-inflammatory properties.",
    fullDescription:
      "Ashwagandha Tablets are derived from the potent root of the Ashwagandha plant, a powerful adaptogen used for centuries in Ayurvedic medicine. These tablets help manage stress, support adrenal function, and promote overall balance in the body. Known as 'Indian Winter Cherry', Ashwagandha is renowned for its ability to enhance physical endurance, support mental clarity, and promote restful sleep. Our tablets are made from pure, high-quality Ashwagandha root extract, ensuring maximum potency and effectiveness.",
    additionalInformation:
      "Quantity: 60 Tablets | Dosage: 1-2 tablets twice daily with milk or water | Storage: Store in a cool, dry place away from moisture | Shelf Life: 36 months | Country of Origin: India | Certification: 100% Natural, Ayurvedic | Best Before: See packaging | Ingredients: Pure Ashwagandha Root Extract",
    price: 249,
    originalPrice: 299,
    bannerImage:
      "https://m.media-amazon.com/images/I/61iapQZHTqL._SX679_PIbundle-4,TopRight,0,0_AA679SH20_.jpg",
    images: [
      "https://m.media-amazon.com/images/I/717pEjHPGGL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/717jhsXQvdL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71rMhteTHqL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71bvg4tQRHL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/61hEyix8-AL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71VeZH5EWML._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61rc5gTO7hL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/61KQ67na9DL._SL1500_.jpg",
    ],
    stock: 75,
    isActive: true,
    isFeatured: false,
    rating: 4.3,
    numReviews: 15,
  },
  {
    name: "Organic Amla (Amalaki) Powder 150g, Vitamin C & Antioxidant Rich Indian Gooseberry, Ayurvedic for Hair Growth & Skin Glow, Natural Immunity Booster",
    description:
      "Amla Powder is a natural supplement that is made from the fruit of the amla plant. It is a good source of vitamin C and antioxidants.",
    fullDescription:
      "Our Amla Powder is made from premium quality Amla fruits, carefully dried and ground to preserve all natural nutrients. This versatile powder is an excellent source of Vitamin C and antioxidants, making it perfect for boosting immunity and promoting overall health. You can easily incorporate it into your daily routine by adding it to water, juices, smoothies, or using it in various recipes. Amla powder is also beneficial for skin and hair care when used in face packs and hair treatments.",
    additionalInformation:
      "Net Weight: 200g | Storage: Store in a cool, dry place in an airtight container | Shelf Life: 24 months | Country of Origin: India | Certification: 100% Natural, No Additives | Usage: Mix 1 teaspoon in water, juice, or smoothies daily | Best Before: See packaging | Ingredients: 100% Pure Amla Fruit Powder",
    price: 299,
    originalPrice: 399,
    bannerImage:
      "https://m.media-amazon.com/images/I/616RWxmG9gL._SX679_PIbundle-4,TopRight,0,0_AA679SH20_.jpg",
    images: [
      "https://m.media-amazon.com/images/I/81SmwYt4HqL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/715v2tmqmFL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71gffOTIsnL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71rX7p98y6L._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71b5dhuiEqL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/81lLn57+cWL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71-HTqhRS4L._SL1500_.jpg",
    ],
    stock: 40,
    isActive: true,
    isFeatured: true,
    rating: 4.6,
    numReviews: 20,
  },
  {
    name: "Pure Moringa Powder 150g Natural, Rich in Iron, Calcium & Antioxidants, Herbal Supplement for Immunity, Digestion, Skin & Hair Health, No Preservative ",
    description:
      "Moringa Powder is a natural supplement that is made from the root of the moringa plant. It is a good source of antioxidants and anti-inflammatory properties.",
    fullDescription:
      "Moringa Powder is derived from the nutrient-dense leaves of the Moringa Oleifera tree, often called the 'Miracle Tree'. This superfood powder is packed with vitamins, minerals, and antioxidants. It contains significant amounts of Vitamin A, C, E, calcium, potassium, and protein. Moringa powder supports energy levels, promotes healthy digestion, and provides natural anti-inflammatory benefits. It's an excellent addition to smoothies, teas, soups, and various culinary preparations, making it easy to incorporate into your daily wellness routine.",
    additionalInformation:
      "Net Weight: 200g | Storage: Store in a cool, dry place in an airtight container | Shelf Life: 24 months | Country of Origin: India | Certification: 100% Natural, Organic | Usage: Mix 1-2 teaspoons in smoothies, soups, or beverages | Best Before: See packaging | Ingredients: 100% Pure Moringa Leaf Powder",
    price: 299,
    originalPrice: 399,
    bannerImage:
      "https://m.media-amazon.com/images/I/71A9WJebDkL._SX679_.jpg",
    images: [
      "https://m.media-amazon.com/images/I/816HN-9RunL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/81toh8g45PL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/815cSvbXkxL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71wobi4zk0L._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71P0Q772PdL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71MK32dI9AL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/81nXUhUupqL._SL1500_.jpg",
      "https://m.media-amazon.com/images/I/71ZCa9rkVGL._SL1500_.jpg",
    ],
    stock: 25,
    isActive: true,
    isFeatured: false,
    rating: 4.4,
    numReviews: 10,
  },
  {
    name: "Triphala Talets, 60 Tabs, Supports Immune System, Digestion & Colon, Rich in Antioxidants and Bioactives, Trifala Tablets for Eyes, Hair, Balanced Bowel & Gut Health",
    description:
      "Triphala Tablets is a natural supplement that is made from the root of the triphala plant. It is a good source of antioxidants and anti-inflammatory properties.",
    fullDescription:
      "Triphala Tablets are a traditional Ayurvedic formulation combining three powerful fruits: Amla (Indian Gooseberry), Bibhitaki, and Haritaki. This synergistic blend provides comprehensive digestive support, natural detoxification, and antioxidant benefits. Triphala is renowned for promoting healthy digestion, supporting regular bowel movements, and maintaining overall gastrointestinal health. These tablets are easy to consume and are an ideal way to experience the traditional benefits of this time-tested Ayurvedic formula.",
    additionalInformation:
      "Quantity: 60 Tablets | Dosage: 1-2 tablets twice daily with warm water, preferably on an empty stomach | Storage: Store in a cool, dry place | Shelf Life: 36 months | Country of Origin: India | Certification: 100% Natural, Ayurvedic | Best Before: See packaging | Ingredients: Amla, Bibhitaki, Haritaki (Equal Proportions)",
    price: 249,
    originalPrice: 349,
    bannerImage:
      "https://m.media-amazon.com/images/I/61-6SpLZeLL._SX679_.jpg",
    images: [
      "https://m.media-amazon.com/images/I/61-6SpLZeLL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71MZ8IoPQSL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71HMdsadEeL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71MzZmo08FL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71G7bpUPI2L._SX679_.jpg",
      "https://m.media-amazon.com/images/I/71gW9rTWlUL._SX679_.jpg",
      "https://m.media-amazon.com/images/I/81WVg24qaJL._SX679_.jpg",
    ],
    stock: 35,
    isActive: true,
    isFeatured: false,
    rating: 4.7,
    numReviews: 18,
  },
];

// Seed function
async function seedData() {
  try {
    console.log("🌱 Starting database seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log("🗑️  Cleared existing data");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    const adminUser = await User.create({
      firstName: "Admin",
      lastName: "User",
      email: "admin@healery.com",
      password: adminPassword,
      role: "admin",
      isActive: true,
      emailVerified: true,
    });

    console.log("👤 Created admin user");

    // Create sample user
    const userPassword = await bcrypt.hash("user123", 12);
    const sampleUser = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "user@healery.com",
      password: userPassword,
      role: "customer",
      isActive: true,
      emailVerified: true,
    });

    console.log("👤 Created sample user");

    // Create categories
    const createdCategories = await Category.create(categories);
    console.log("📂 Created categories");

    // Create products with Tablets/Powder category references
    const categoryMap = {
      Tablets: createdCategories[0]._id,
      Powder: createdCategories[1]._id,
    };

    // Heuristic: if product name contains "Powder" assign Powder, otherwise Tablets
    const productsWithCategories = products.map((p) => ({
      ...p,
      category: /powder/i.test(p.name)
        ? categoryMap.Powder
        : categoryMap.Tablets,
    }));

    await Product.create(productsWithCategories);
    console.log("🛍️  Created products");

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📋 Sample Data Created:");
    console.log("- Admin User: admin@healery.com / admin123");
    console.log("- Sample User: user@healery.com / user123");
    console.log("- 2 Categories (Tablets, Powder)");
    console.log("- 6 Products");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run seeding
seedData();
