# 📚 Bookverse API Documentation

## 🚀 Base URL
```
http://localhost:5000/api
```

## 🔐 Authentication
API sử dụng JWT Bearer Token authentication. Thêm header sau vào tất cả requests:
```
Authorization: Bearer <your_jwt_token>
```

---

## 👤 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "0123456789",
    "address": "Ho Chi Minh City"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "0123456789",
        "address": {
          "city": "Ho Chi Minh City",
          "country": "Vietnam"
        }
      }
    },
    "token": "jwt_token_here"
  }
}
```

### 2. Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

### 3. Get Current User
**GET** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user",
      "profile": {...}
    }
  }
}
```

### 4. Refresh Token
**POST** `/auth/refresh`
- **Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "new_jwt_token"
  }
}
```

### 5. Change Password
**POST** `/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

### 6. Forgot Password
**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "test@example.com"
}
```

### 7. Reset Password
**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "email": "test@example.com",
  "otp": "123456",
  "newPassword": "NewPassword123"
}
```

---

## 📖 Product Endpoints

### 1. Get All Products
**GET** `/products`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `category` (optional): Category ID
- `search` (optional): Search term
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `condition` (optional): Product condition
- `language` (optional): Book language
- `seller` (optional): Seller ID
- `featured` (optional): Featured products (true/false)
- `sort` (optional): Sort field (createdAt, price, rating, etc.)
- `order` (optional): Sort order (asc/desc)

**Example:**
```
GET /products?page=1&limit=10&category=category_id&search=harry&minPrice=100000&maxPrice=500000&sort=price&order=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "title": "Harry Potter and the Philosopher's Stone",
        "author": "J.K. Rowling",
        "price": 180000,
        "originalPrice": 220000,
        "images": [...],
        "rating": {
          "average": 4.9,
          "count": 203
        },
        "category": {
          "_id": "category_id",
          "name": "Thiếu nhi",
          "slug": "thieu-nhi"
        },
        "seller": {
          "_id": "seller_id",
          "username": "bookworld",
          "sellerProfile": {
            "businessName": "Book World"
          }
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 2. Get Product by ID
**GET** `/products/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "product": {
      "_id": "product_id",
      "title": "Product Title",
      "description": "Product description...",
      "author": "Author Name",
      "price": 150000,
      "stock": 25,
      "condition": "new",
      "language": "Vietnamese",
      "publisher": "NXB Trẻ",
      "publishYear": 2020,
      "pages": 320,
      "isbn": "9786041001234",
      "tags": ["fiction", "adventure"],
      "rating": {
        "average": 4.5,
        "count": 128
      },
      "views": 1500,
      "sales": 45,
      "category": {...},
      "seller": {...},
      "reviews": [...]
    }
  }
}
```

### 3. Create Product (Seller)
**POST** `/products`
- **Headers:** `Authorization: Bearer <seller_token>`

**Request Body:**
```json
{
  "title": "New Book Title",
  "description": "Book description here...",
  "author": "Author Name",
  "price": 150000,
  "originalPrice": 200000,
  "category": "category_id",
  "stock": 50,
  "condition": "new",
  "language": "Vietnamese",
  "publisher": "NXB Trẻ",
  "publishYear": 2024,
  "pages": 300,
  "isbn": "9786041001234",
  "tags": ["fiction", "adventure"],
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Book cover",
      "isPrimary": true
    }
  ]
}
```

### 4. Update Product (Seller/Owner)
**PUT** `/products/:id`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as create product

### 5. Delete Product (Seller/Owner)
**DELETE** `/products/:id`
- **Headers:** `Authorization: Bearer <token>`

### 6. Get Seller's Products
**GET** `/products/seller/my-products`
- **Headers:** `Authorization: Bearer <seller_token>`

**Query Parameters:**
- `page`, `limit`, `status`, `isActive`, `sort`, `order`

### 7. Get Categories
**GET** `/products/categories`

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "category_id",
        "name": "Văn học",
        "slug": "van-hoc",
        "description": "Tiểu thuyết, truyện ngắn, thơ ca",
        "isActive": true,
        "isFeatured": true,
        "productCount": 150
      }
    ]
  }
}
```

### 8. Get Featured Products
**GET** `/products/featured`

**Query Parameters:**
- `limit` (optional): Number of featured products (default: 8)

---

## 🛒 Order Endpoints

### 1. Create Order
**POST** `/orders`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "product": "product_id",
      "quantity": 2
    },
    {
      "product": "another_product_id", 
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "0123456789",
    "email": "john@example.com",
    "street": "123 Main Street",
    "city": "Ho Chi Minh City",
    "state": "Ho Chi Minh",
    "zipCode": "700000",
    "country": "Vietnam"
  },
  "payment": {
    "method": "cod"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "_id": "order_id",
      "orderNumber": "BV12345678",
      "customer": "customer_id",
      "items": [...],
      "shippingAddress": {...},
      "payment": {
        "method": "cod",
        "status": "pending"
      },
      "status": "pending",
      "subtotal": 300000,
      "shipping": {
        "cost": 30000,
        "method": "standard"
      },
      "tax": {
        "rate": 0.1,
        "amount": 30000
      },
      "total": 360000
    }
  }
}
```

### 2. Get User's Orders
**GET** `/orders`
- **Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit`, `status`, `paymentStatus`, `sort`, `order`

### 3. Get Order by ID
**GET** `/orders/:id`
- **Headers:** `Authorization: Bearer <token>`

### 4. Update Order Status
**PUT** `/orders/:id/status`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "confirmed",
  "note": "Order confirmed by seller"
}
```

**Valid Status Values:**
- `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`

### 5. Get Seller's Orders
**GET** `/orders/seller/my-orders`
- **Headers:** `Authorization: Bearer <seller_token>`

### 6. Add Tracking Information
**POST** `/orders/:id/tracking`
- **Headers:** `Authorization: Bearer <seller_token>`

**Request Body:**
```json
{
  "trackingNumber": "VN123456789",
  "carrier": "Vietnam Post",
  "estimatedDelivery": "2024-11-05T00:00:00.000Z"
}
```

---

## 👥 User Management Endpoints

### 1. Get User Profile
**GET** `/users/profile`
- **Headers:** `Authorization: Bearer <token>`

### 2. Update User Profile
**PUT** `/users/profile`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0123456789",
  "birthDate": "1990-01-01",
  "gender": "male",
  "bio": "Book lover",
  "address": {
    "street": "123 Main Street",
    "city": "Ho Chi Minh City",
    "state": "Ho Chi Minh",
    "zipCode": "700000",
    "country": "Vietnam"
  }
}
```

### 3. Get User Stats
**GET** `/users/stats`
- **Headers:** `Authorization: Bearer <token>`

### 4. Upload Avatar
**POST** `/users/avatar`
- **Headers:** `Authorization: Bearer <token>`

### 5. Update User Preferences
**PUT** `/users/preferences`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "emailNotifications": true,
  "smsNotifications": false,
  "marketingEmails": true,
  "theme": "light",
  "language": "vi"
}
```

---

## ⭐ Review Endpoints

### 1. Create Review
**POST** `/reviews`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "product": "product_id",
  "order": "order_id",
  "rating": 5,
  "title": "Excellent book!",
  "comment": "This book is amazing. Highly recommended!",
  "images": [
    {
      "url": "https://example.com/review-image.jpg",
      "alt": "Review image"
    }
  ],
  "detailedRatings": {
    "quality": 5,
    "value": 4,
    "shipping": 5,
    "communication": 5
  },
  "isAnonymous": false
}
```

### 2. Get Product Reviews
**GET** `/reviews/product/:productId`

**Query Parameters:**
- `page`, `limit`

### 3. Update Review
**PUT** `/reviews/:id`
- **Headers:** `Authorization: Bearer <token>`

### 4. Delete Review
**DELETE** `/reviews/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## 💰 Payment Endpoints

### 1. Get Payment History
**GET** `/payments/history`
- **Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit`, `type`, `status`

### 2. Get Wallet Balance
**GET** `/payments/balance`
- **Headers:** `Authorization: Bearer <token>`

### 3. Deposit to Wallet
**POST** `/payments/deposit`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "amount": 1000000,
  "method": "bank_transfer",
  "description": "Nạp tiền vào ví"
}
```

### 4. Add Bank Account (Seller)
**POST** `/payments/bank-account`
- **Headers:** `Authorization: Bearer <seller_token>`

**Request Body:**
```json
{
  "bankName": "Vietcombank",
  "accountNumber": "1234567890",
  "accountHolder": "John Doe",
  "branch": "Chi nhánh HCM"
}
```

### 5. Get Bank Account Info (Seller)
**GET** `/payments/bank-account`
- **Headers:** `Authorization: Bearer <seller_token>`

### 6. Get Seller Payment History
**GET** `/payments/seller/payments`
- **Headers:** `Authorization: Bearer <seller_token>`

---

## 🔧 Admin Endpoints

### 1. Get Dashboard Stats
**GET** `/admin/dashboard`
- **Headers:** `Authorization: Bearer <admin_token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalSellers": 25,
      "totalProducts": 500,
      "totalOrders": 1200,
      "pendingOrders": 15,
      "totalRevenue": 50000000
    },
    "recentUsers": [...],
    "recentOrders": [...]
  }
}
```

### 2. Get All Users
**GET** `/admin/users`
- **Headers:** `Authorization: Bearer <admin_token>`

**Query Parameters:**
- `page`, `limit`, `role`, `search`, `sort`, `order`

### 3. Update User Status
**PUT** `/admin/users/:id/status`
- **Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "isActive": false
}
```

### 4. Get Pending Sellers
**GET** `/admin/sellers/pending`
- **Headers:** `Authorization: Bearer <admin_token>`

### 5. Approve/Reject Seller
**PUT** `/admin/sellers/:id/approve`
- **Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "approved": true,
  "note": "Seller application approved"
}
```

### 6. Get All Products (Admin)
**GET** `/admin/products`
- **Headers:** `Authorization: Bearer <admin_token>`

### 7. Update Product Status (Admin)
**PUT** `/admin/products/:id/status`
- **Headers:** `Authorization: Bearer <admin_token>`

**Request Body:**
```json
{
  "status": "approved",
  "note": "Product approved"
}
```

### 8. Get All Orders (Admin)
**GET** `/admin/orders`
- **Headers:** `Authorization: Bearer <admin_token>`

### 9. Category Management (Admin)
**GET** `/admin/categories`
**POST** `/admin/categories`
**PUT** `/admin/categories/:id`
**DELETE** `/admin/categories/:id`
- **Headers:** `Authorization: Bearer <admin_token>`

---

## 🚨 Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Product not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 🧪 Test Data

### Test Users
```json
// Admin
{
  "email": "admin@bookverse.vn",
  "password": "admin123"
}

// Regular User
{
  "email": "nguyenvana@example.com", 
  "password": "password123"
}

// Seller
{
  "email": "sachhaystore@example.com",
  "password": "password123"
}
```

### Sample Product Data
```json
{
  "title": "Đắc Nhân Tâm",
  "description": "Cuốn sách kinh điển về nghệ thuật giao tiếp và ứng xử trong cuộc sống",
  "author": "Dale Carnegie",
  "price": 89000,
  "originalPrice": 120000,
  "stock": 50,
  "condition": "new",
  "language": "Vietnamese",
  "publisher": "NXB Trẻ",
  "publishYear": 2020,
  "pages": 320,
  "isbn": "9786041001234",
  "tags": ["self-help", "giao-tiep", "thanh-cong"]
}
```

---

## 📝 Testing Tips

1. **Start with Authentication:** Register/login first to get JWT token
2. **Use Postman/Insomnia:** Import this documentation for easy testing
3. **Test Roles:** Test with different user roles (user, seller, admin)
4. **Check Pagination:** Test pagination with different page/limit values
5. **Validate Errors:** Test error cases with invalid data
6. **File Uploads:** Test image uploads for products and reviews
7. **Order Flow:** Test complete order flow from creation to delivery

---

## 🔗 Health Check

**GET** `/health`

**Response:**
```json
{
  "success": true,
  "message": "Bookverse API is running!",
  "timestamp": "2024-10-27T15:30:00.000Z",
  "version": "1.0.0"
}
```
