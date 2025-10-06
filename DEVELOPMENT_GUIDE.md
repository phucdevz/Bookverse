# 🛠️ BOOKVERSE MARKETPLACE - DEVELOPMENT GUIDE

## 📋 Hướng dẫn phát triển dự án

### 🎯 Tổng quan
Hướng dẫn này cung cấp các quy trình, chuẩn coding và best practices cho việc phát triển Bookverse Marketplace.

---

## 🏗️ Cấu trúc dự án

### 📁 Thư mục gốc
```
Bookverse-Marketplace/
├── 📁 frontend/              # PHP + HTML + CSS + JS
│   ├── 📁 user/              # Giao diện người mua
│   ├── 📁 seller/            # Giao diện người bán
│   ├── 📁 admin/             # Dashboard quản trị
│   ├── 📁 shared/            # Header, Footer, Components
│   ├── 📁 assets/            # CSS, JS, Images
│   └── 📄 index.php          # Entry point
├── 📁 backend/               # Node.js (Express)
│   ├── 📄 server.js          # Main server file
│   ├── 📁 routes/            # API routes
│   ├── 📁 controllers/      # Business logic
│   ├── 📁 models/            # Database models
│   ├── 📁 middlewares/       # Custom middlewares
│   ├── 📁 config/            # Configuration files
│   ├── 📁 utils/             # Utility functions
│   └── 📄 package.json       # Dependencies
├── 📁 database/              # Database related
│   ├── 📄 connection.js      # DB connection
│   ├── 📄 schema.js          # Database schema
│   └── 📄 seeds.js           # Sample data
├── 📁 docs/                  # Documentation
├── 📁 tests/                 # Test files
├── 📁 scripts/               # Build & deployment scripts
└── 📄 README.md              # Project documentation
```

---

## 🔧 Development Environment Setup

### 📋 Prerequisites
- **Node.js**: v16+ 
- **MongoDB**: v5+
- **PHP**: v8+
- **Git**: Latest version
- **VS Code**: Recommended IDE

### 🚀 Quick Start
```bash
# 1. Clone repository
git clone [repository-url]
cd Bookverse-Marketplace

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies (if any)
cd ../frontend
# Install PHP dependencies if needed

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Start MongoDB
mongod

# 6. Start backend server
cd backend
npm run dev

# 7. Start frontend server
cd frontend
php -S localhost:8000
```

---

## 📝 Coding Standards

### 🎨 Frontend (PHP/HTML/CSS/JS)

#### PHP Standards
```php
<?php
// Use PSR-12 coding standards
class UserController {
    private $userService;
    
    public function __construct(UserService $userService) {
        $this->userService = $userService;
    }
    
    public function getUser(int $userId): array {
        try {
            return $this->userService->getUserById($userId);
        } catch (Exception $e) {
            error_log($e->getMessage());
            return ['error' => 'User not found'];
        }
    }
}
```

#### HTML Standards
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bookverse - Trang chủ</title>
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <!-- Use semantic HTML -->
    <header>
        <nav class="navbar">
            <!-- Navigation content -->
        </nav>
    </header>
    
    <main>
        <!-- Main content -->
    </main>
    
    <footer>
        <!-- Footer content -->
    </footer>
</body>
</html>
```

#### CSS Standards
```css
/* Use BEM methodology */
.product-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
}

.product-card__image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
}

.product-card__title {
    font-size: 18px;
    font-weight: bold;
    margin: 12px 0 8px 0;
}

.product-card__price {
    color: #e74c3c;
    font-size: 20px;
    font-weight: bold;
}

.product-card--featured {
    border-color: #f39c12;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
```

#### JavaScript Standards
```javascript
// Use ES6+ features
class ProductManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.products = [];
    }
    
    async loadProducts(category = null) {
        try {
            const response = await this.apiClient.get('/api/products', {
                params: { category }
            });
            this.products = response.data;
            return this.products;
        } catch (error) {
            console.error('Error loading products:', error);
            throw error;
        }
    }
    
    addToCart(productId, quantity = 1) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            throw new Error('Product not found');
        }
        
        // Add to cart logic
        this.updateCartUI(product, quantity);
    }
}

// Use modules
export default ProductManager;
```

### 🚀 Backend (Node.js/Express)

#### API Structure
```javascript
// routes/users.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middlewares/auth');

// GET /api/users/profile
router.get('/profile', authMiddleware, UserController.getProfile);

// PUT /api/users/profile
router.put('/profile', authMiddleware, UserController.updateProfile);

module.exports = router;
```

#### Controller Pattern
```javascript
// controllers/UserController.js
const UserService = require('../services/UserService');
const { validationResult } = require('express-validator');

class UserController {
    static async getProfile(req, res) {
        try {
            const userId = req.user.id;
            const user = await UserService.getUserById(userId);
            
            res.json({
                success: true,
                data: user
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
    
    static async updateProfile(req, res) {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array()
                });
            }
            
            const userId = req.user.id;
            const updateData = req.body;
            
            const updatedUser = await UserService.updateUser(userId, updateData);
            
            res.json({
                success: true,
                data: updatedUser
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = UserController;
```

#### Model Pattern
```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'seller', 'admin'],
        default: 'user'
    },
    profile: {
        firstName: String,
        lastName: String,
        phone: String,
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

---

## 🧪 Testing Standards

### 🔬 Unit Testing
```javascript
// tests/controllers/UserController.test.js
const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');

describe('UserController', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });
    
    describe('GET /api/users/profile', () => {
        it('should return user profile when authenticated', async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            
            const response = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);
            
            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('testuser');
        });
    });
});
```

### 🔗 Integration Testing
```javascript
// tests/integration/auth.test.js
describe('Authentication Flow', () => {
    it('should register, login, and access protected route', async () => {
        // Register user
        const registerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(201);
        
        // Login user
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(200);
        
        const token = loginResponse.body.token;
        
        // Access protected route
        const profileResponse = await request(app)
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        
        expect(profileResponse.body.data.username).toBe('testuser');
    });
});
```

---

## 🔒 Security Guidelines

### 🛡️ Authentication & Authorization
```javascript
// middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found.'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.'
        });
    }
};

module.exports = authMiddleware;
```

### 🔐 Input Validation
```javascript
// middlewares/validation.js
const { body, validationResult } = require('express-validator');

const validateUser = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors.array()
            });
        }
        next();
    }
];
```

---

## 📊 Performance Guidelines

### ⚡ Database Optimization
```javascript
// Use indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// Use aggregation for complex queries
const getTopSellers = async () => {
    return await Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: { 
            _id: '$sellerId', 
            totalSales: { $sum: '$total' },
            orderCount: { $sum: 1 }
        }},
        { $sort: { totalSales: -1 } },
        { $limit: 10 }
    ]);
};
```

### 🚀 API Optimization
```javascript
// Use pagination
const getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const products = await Product.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments();
    
    res.json({
        success: true,
        data: products,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
};
```

---

## 🚀 Deployment Guidelines

### 🌐 Environment Configuration
```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
```

### 📦 Build Process
```json
// package.json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "build": "npm run test && npm run lint",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

---

## 📚 Documentation Standards

### 📝 API Documentation
```javascript
/**
 * @route   GET /api/products
 * @desc    Get all products with pagination
 * @access  Public
 * @param   {number} page - Page number (default: 1)
 * @param   {number} limit - Items per page (default: 10)
 * @param   {string} category - Filter by category
 * @param   {string} search - Search term
 * @returns {Object} Products with pagination info
 */
```

### 📖 Code Comments
```javascript
/**
 * Calculate total price including tax and shipping
 * @param {Array} items - Array of cart items
 * @param {number} taxRate - Tax rate (0-1)
 * @param {number} shippingCost - Fixed shipping cost
 * @returns {Object} Total breakdown
 */
const calculateTotal = (items, taxRate = 0.1, shippingCost = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax + shippingCost;
    
    return {
        subtotal,
        tax,
        shipping: shippingCost,
        total
    };
};
```

---

## 🔄 Git Workflow

### 📋 Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/**: New features
- **bugfix/**: Bug fixes
- **hotfix/**: Critical fixes

### 📝 Commit Messages
```
feat: add user authentication system
fix: resolve cart calculation bug
docs: update API documentation
style: format code according to standards
refactor: optimize database queries
test: add unit tests for user service
```

---

## 📞 Support & Resources

### 🆘 Getting Help
- **Documentation**: Check this guide first
- **Issues**: Create GitHub issue
- **Discussions**: Use GitHub discussions
- **Code Review**: Request review for major changes

### 📚 Useful Resources
- **Node.js**: https://nodejs.org/docs/
- **Express**: https://expressjs.com/
- **MongoDB**: https://docs.mongodb.com/
- **Mongoose**: https://mongoosejs.com/docs/
- **PHP**: https://www.php.net/docs.php

---

**Last updated**: $(date)  
**Version**: 1.0  
**Maintainer**: Development Team

