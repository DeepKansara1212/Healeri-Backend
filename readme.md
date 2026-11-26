# Healery Backend API

A powerful and comprehensive backend API for the Healery e-commerce platform, built with Node.js, Express, and MongoDB.

## Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Role-based access control (Admin/Customer)
- Password reset functionality
- Profile management

### 🛍️ Product Management
- Product CRUD operations
- Category management
- Product search and filtering
- Image upload support
- Stock management
- Product reviews and ratings

### 🛒 Shopping Cart
- Add/remove items from cart
- Update quantities
- Cart persistence
- Stock validation
- Cart summary

### ❤️ Wishlist
- Add/remove products to wishlist
- Wishlist management
- Move items from wishlist to cart
- Wishlist count

### 📦 Order Management
- Create orders from cart
- Order status tracking
- Payment integration
- Order history
- Admin order management

### ⭐ Reviews & Ratings
- Product reviews
- Rating system
- Review moderation
- Verified purchase badges

### 👥 User Management
- User profiles
- Admin user management
- User statistics
- Account settings

### 📊 Admin Dashboard
- Sales analytics
- User management
- Product management
- Order management
- Review moderation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS
- **Environment**: dotenv

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BACKEND
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/healery
   # Optional DNS resolver override for Node SRV lookup issues (comma-separated)
   MONGODB_DNS_SERVERS=

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
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

   # Google Sign-In (same Web OAuth client ID as VITE_GOOGLE_CLIENT_ID)
   GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

   # Payment Configuration (if using payment gateways)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Admin Configuration
   ADMIN_EMAIL=admin@healery.com
   ADMIN_PASSWORD=admin123

   # Security
   BCRYPT_ROUNDS=12
   ```

   For production, set `FRONTEND_URL` to the frontend's exact origin (scheme
   and hostname, including a non-default port, but no path). Use
   `CORS_ORIGINS` for additional comma-separated frontend origins. Restart or
   redeploy the backend after changing these values. Localhost development
   origins are allowed automatically only when `NODE_ENV` is not `production`.

   If MongoDB Atlas SRV lookup fails in Node but works in Windows DNS tools,
   set `MONGODB_DNS_SERVERS` to one or more reachable DNS resolver IP addresses,
   comma-separated, then restart the backend. Leave it empty when the default
   Node DNS resolver works.

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

5. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `GET /api/products/search` - Search products
- `GET /api/products/featured` - Get featured products

### Admin Uploads
- `POST /api/admin/uploads/images` - Upload 1-5 product images (multipart/form-data, field: `images[]`). Returns array of `{ url, public_id }`.

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `GET /api/categories/:id/products` - Get products by category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove item from cart
- `DELETE /api/cart/clear` - Clear cart
- `GET /api/cart/summary` - Get cart summary

### Wishlist
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/add` - Add item to wishlist
- `DELETE /api/wishlist/remove/:productId` - Remove item from wishlist
- `DELETE /api/wishlist/clear` - Clear wishlist
- `POST /api/wishlist/move-to-cart/:productId` - Move item to cart
- `GET /api/wishlist/check/:productId` - Check if item is in wishlist
- `GET /api/wishlist/count` - Get wishlist count

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/myorders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id/pay` - Update order payment
- `PUT /api/orders/:id/deliver` - Mark order as delivered (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/stats` - Get order statistics (Admin)

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/reviews/my-reviews` - Get user reviews
- `GET /api/reviews` - Get all reviews (Admin)
- `GET /api/reviews/stats` - Get review statistics (Admin)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `POST /api/users/forgot-password` - Forgot password
- `PUT /api/users/reset-password/:token` - Reset password
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)
- `GET /api/users/stats` - Get user statistics (Admin)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/analytics` - Sales analytics

## Database Models

### User
- Basic info (name, email, password)
- Role (customer/admin)
- Profile data
- Account status

### Product
- Product details (name, description, price)
- Images and media
- Category and tags
- Stock and availability
- Reviews and ratings

### Category
- Category name and description
- Category image
- Active status

### Cart
- User reference
- Cart items with quantities
- Total amount

### Wishlist
- User reference
- Wishlist items
- Added date

### Order
- User reference
- Order items
- Shipping address
- Payment information
- Order status
- Total amounts

### Review
- User reference
- Product reference
- Rating and comment
- Review status

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: express-validator for data validation
- **CORS Protection**: Configured CORS for frontend integration
- **Helmet**: Security headers
- **Rate Limiting**: API rate limiting (can be added)
- **Data Sanitization**: Input sanitization

## Error Handling

- Centralized error handling middleware
- Consistent error response format
- Proper HTTP status codes
- Detailed error logging

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true/false,
  "message": "Response message",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (if applicable)
  }
}
```

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

### Code Structure
```
BACKEND/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── server.js        # Main server file
└── package.json
```

## Deployment

1. **Environment Variables**: Set all required environment variables
2. **Database**: Set up MongoDB connection
3. **Dependencies**: Install production dependencies
4. **Process Manager**: Use PM2 or similar for production
5. **Reverse Proxy**: Configure Nginx or Apache
6. **SSL**: Set up SSL certificates for HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
