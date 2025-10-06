# 📚 Bookverse Marketplace

> Sàn thương mại điện tử chuyên về sách - Kết nối cộng đồng người yêu sách

## 🎯 Tổng quan dự án

Bookverse Marketplace là nền tảng thương mại điện tử chuyên biệt cho sách, cho phép người bán đăng tải, quản lý và kinh doanh sách của họ; người mua có thể tìm kiếm, đặt hàng, thanh toán và đánh giá sản phẩm.

## ✨ Tính năng chính

### 👤 Người dùng (User)
- Đăng ký/đăng nhập tài khoản
- Tìm kiếm và duyệt sản phẩm
- Xem chi tiết sách, đánh giá
- Thêm vào giỏ hàng, thanh toán
- Theo dõi đơn hàng
- Quản lý hồ sơ cá nhân

### 🏪 Người bán (Seller)
- Đăng ký tài khoản người bán
- Quản lý sản phẩm (thêm/sửa/xóa)
- Quản lý đơn hàng
- Thống kê doanh thu
- Quản lý thông tin cửa hàng

### 👨‍💼 Quản trị viên (Admin)
- Quản lý người dùng và người bán
- Duyệt tài khoản người bán
- Kiểm duyệt sản phẩm
- Thống kê hệ thống
- Quản lý danh mục

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **PHP** - Server-side scripting
- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript** - Client-side scripting
- **Responsive Design** - Mobile-friendly

### Tools & Services
- **Git** - Version control
- **Postman** - API testing
- **MongoDB Compass** - Database GUI
- **VS Code** - Development environment

## 🚀 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js v16+
- MongoDB v5+
- PHP v8+
- Git

### 1. Clone repository
```bash
git clone https://github.com/your-username/bookverse-marketplace.git
cd bookverse-marketplace
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
```

### 3. Cấu hình môi trường
```bash
# Copy file cấu hình
cp env.example .env

# Chỉnh sửa file .env với thông tin của bạn
```

### 4. Khởi động MongoDB
```bash
mongod
```

### 5. Chạy Backend
```bash
npm run dev
```

### 6. Chạy Frontend
```bash
cd frontend
php -S localhost:8000
```

## 📁 Cấu trúc dự án

```
Bookverse-Marketplace/
├── 📁 backend/              # Node.js Backend
│   ├── 📁 config/           # Database configuration
│   ├── 📁 middlewares/      # Custom middlewares
│   ├── 📁 models/           # Database models
│   ├── 📁 routes/           # API routes
│   ├── 📄 server.js         # Main server file
│   └── 📄 package.json      # Dependencies
├── 📁 frontend/             # PHP Frontend
│   ├── 📁 assets/           # CSS, JS, Images
│   ├── 📁 user/             # User interface
│   ├── 📁 seller/           # Seller interface
│   ├── 📁 admin/            # Admin interface
│   └── 📄 index.php         # Homepage
├── 📁 database/             # Database files
├── 📁 docs/                 # Documentation
└── 📄 README.md             # Project documentation
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm mới (Seller)
- `PUT /api/products/:id` - Cập nhật sản phẩm
- `DELETE /api/products/:id` - Xóa sản phẩm

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng mới
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng

### Admin
- `GET /api/admin/dashboard` - Dashboard thống kê
- `GET /api/admin/users` - Quản lý người dùng
- `GET /api/admin/products` - Quản lý sản phẩm
- `GET /api/admin/orders` - Quản lý đơn hàng

## 🧪 Testing

### Chạy tests
```bash
cd backend
npm test
```

### Test coverage
```bash
npm run test:coverage
```

## 📊 Monitoring & Logs

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Logs
- Backend logs được ghi vào console
- Sử dụng Morgan middleware cho HTTP logging

## 🔒 Security

- JWT authentication
- Password hashing với bcrypt
- Input validation
- CORS configuration
- Helmet security headers
- Rate limiting

## 🚀 Deployment

### Production Environment
1. Cấu hình environment variables
2. Setup MongoDB production
3. Deploy backend (Node.js)
4. Deploy frontend (PHP)
5. Setup domain và SSL

### Docker (Coming Soon)
```bash
docker-compose up -d
```

## 📈 Performance

- Database indexing
- API response caching
- Image optimization
- Lazy loading
- Code splitting

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

- **Email**: support@bookverse.vn
- **Website**: https://bookverse.vn
- **GitHub**: https://github.com/bookverse

## 🙏 Acknowledgments

- Express.js community
- MongoDB team
- PHP community
- Open source contributors

---

**Made with ❤️ by Bookverse Development Team**


