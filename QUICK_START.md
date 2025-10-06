# 🚀 BOOKVERSE MARKETPLACE - HƯỚNG DẪN CHẠY NHANH

## ⚡ Bắt đầu trong 5 phút

### 1. Cài đặt MongoDB
```bash
# Windows (với Chocolatey)
choco install mongodb

# macOS (với Homebrew)
brew install mongodb

# Ubuntu/Debian
sudo apt-get install mongodb
```

### 2. Khởi động MongoDB
```bash
# Windows
mongod

# macOS/Linux
sudo mongod
```

### 3. Clone và cài đặt Backend
```bash
cd backend
npm install
```

### 4. Tạo file .env
```bash
# Copy file mẫu
cp env.example .env

# Chỉnh sửa nếu cần (mặc định đã hoạt động)
```

### 5. Chạy Backend
```bash
npm run dev
```

### 6. Tạo dữ liệu mẫu (tùy chọn)
```bash
# Trong terminal khác
npm run seed
```

### 7. Chạy Frontend
```bash
# Trong terminal mới
cd frontend
php -S localhost:8000
```

## 🌐 Truy cập ứng dụng

- **Frontend**: http://localhost:8000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 🔑 Tài khoản test

### Admin
- **Email**: admin@bookverse.vn
- **Password**: admin123

### User
- **Email**: nguyenvana@example.com
- **Password**: password123

### Seller
- **Email**: sachhaystore@example.com
- **Password**: password123

## 🧪 Test API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Đăng nhập
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bookverse.vn","password":"admin123"}'
```

### Lấy danh sách sản phẩm
```bash
curl http://localhost:5000/api/products
```

## 📱 Tính năng đã hoàn thành

### ✅ Backend
- [x] Authentication (JWT)
- [x] User Management
- [x] Product Management
- [x] Order Management
- [x] Admin Dashboard
- [x] Database Models
- [x] API Endpoints
- [x] Middleware & Validation

### ✅ Frontend
- [x] Homepage
- [x] Responsive Design
- [x] API Integration
- [x] Cart Management
- [x] User Interface

### ✅ Database
- [x] MongoDB Setup
- [x] Models & Schemas
- [x] Sample Data
- [x] Indexes

## 🔧 Troubleshooting

### Lỗi MongoDB connection
```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Khởi động lại MongoDB
sudo systemctl restart mongod
```

### Lỗi Port đã được sử dụng
```bash
# Thay đổi port trong .env
PORT=5001
```

### Lỗi CORS
```bash
# Kiểm tra FRONTEND_URL trong .env
FRONTEND_URL=http://localhost:8000
```

## 📊 Monitoring

### Logs
- Backend logs hiển thị trong terminal
- MongoDB logs: `/var/log/mongodb/mongod.log`

### Performance
- Database: MongoDB Compass
- API: Postman collection
- Frontend: Browser DevTools

## 🚀 Next Steps

1. **Tạo tài khoản**: Đăng ký user mới
2. **Khám phá sản phẩm**: Duyệt danh mục sách
3. **Test giỏ hàng**: Thêm sản phẩm vào giỏ
4. **Đặt hàng**: Tạo đơn hàng test
5. **Admin panel**: Quản lý hệ thống

## 📞 Hỗ trợ

- **Documentation**: Xem README.md
- **Issues**: Tạo GitHub issue
- **Email**: support@bookverse.vn

---

**Chúc bạn coding vui vẻ! 🎉**


