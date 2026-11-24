#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Healery Backend Setup')
console.log('========================\n')

// Check if .env file exists
const envPath = path.join(__dirname, '.env')
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...')
  
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/healery

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=30d

# Frontend URL (for password reset links and CORS)
FRONTEND_URL=http://localhost:5173
# Optional additional CORS origins, comma-separated (no URL paths)
CORS_ORIGINS=

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
# Use a Google App Password (requires 2-Step Verification), not your Gmail password.

# Google Sign-In (use the same OAuth Web client ID in the frontend)
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Payment Configuration (if using payment gateways)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Admin Configuration
ADMIN_EMAIL=admin@healery.com
ADMIN_PASSWORD=admin123

# Security
BCRYPT_ROUNDS=12
`
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ .env file created successfully!')
  console.log('⚠️  Please update the .env file with your actual configuration values.\n')
} else {
  console.log('✅ .env file already exists\n')
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules')
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...')
  try {
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ Dependencies installed successfully!\n')
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message)
    process.exit(1)
  }
} else {
  console.log('✅ Dependencies already installed\n')
}

// Check if MongoDB is running
console.log('🔍 Checking MongoDB connection...')
try {
  // Try to connect to MongoDB
  const mongoose = require('mongoose')
  require('dotenv').config()
  
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  
  mongoose.connection.once('open', () => {
    console.log('✅ MongoDB connection successful!')
    mongoose.connection.close()
    
    console.log('\n🎉 Setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Update your .env file with actual configuration values')
    console.log('2. Run "npm run seed" to populate the database with sample data')
    console.log('3. Run "npm run dev" to start the development server')
    console.log('4. The API will be available at http://localhost:5000/api')
    console.log('\n📚 For more information, check the README.md file')
  })
  
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    console.log('\n💡 Make sure MongoDB is running on your system')
    console.log('   - For local MongoDB: Start mongod service')
    console.log('   - For MongoDB Atlas: Update MONGODB_URI in .env file')
    process.exit(1)
  })
  
} catch (error) {
  console.error('❌ Error checking MongoDB:', error.message)
  process.exit(1)
}
