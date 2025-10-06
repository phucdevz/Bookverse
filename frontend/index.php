<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bookverse - Sàn thương mại điện tử sách</title>
    <meta name="description" content="Bookverse - Nền tảng mua bán sách trực tuyến hàng đầu Việt Nam">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/responsive.css">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <!-- Logo -->
                <div class="logo">
                    <a href="index.php">
                        <img src="assets/images/logo.png" alt="Bookverse" class="logo-img">
                        <span class="logo-text">Bookverse</span>
                    </a>
                </div>

                <!-- Search Bar -->
                <div class="search-bar">
                    <form class="search-form" action="search.php" method="GET">
                        <input type="text" name="q" placeholder="Tìm kiếm sách, tác giả, nhà xuất bản..." class="search-input">
                        <button type="submit" class="search-btn">
                            <i class="search-icon">🔍</i>
                        </button>
                    </form>
                </div>

                <!-- Navigation -->
                <nav class="nav">
                    <ul class="nav-list">
                        <li class="nav-item">
                            <a href="index.php" class="nav-link active">Trang chủ</a>
                        </li>
                        <li class="nav-item">
                            <a href="categories.php" class="nav-link">Danh mục</a>
                        </li>
                        <li class="nav-item">
                            <a href="sellers.php" class="nav-link">Người bán</a>
                        </li>
                        <li class="nav-item">
                            <a href="about.php" class="nav-link">Giới thiệu</a>
                        </li>
                    </ul>
                </nav>

                <!-- User Actions -->
                <div class="user-actions">
                    <a href="cart.php" class="cart-btn">
                        <i class="cart-icon">🛒</i>
                        <span class="cart-count">0</span>
                    </a>
                    <div class="user-menu">
                        <button class="user-btn" id="userBtn">
                            <i class="user-icon">👤</i>
                            <span>Tài khoản</span>
                        </button>
                        <div class="user-dropdown" id="userDropdown">
                            <a href="login.php" class="dropdown-link">Đăng nhập</a>
                            <a href="register.php" class="dropdown-link">Đăng ký</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="main">
        <!-- Hero Section -->
        <section class="hero">
            <div class="container">
                <div class="hero-content">
                    <h1 class="hero-title">Khám phá thế giới sách vô tận</h1>
                    <p class="hero-subtitle">Tìm kiếm, mua bán và chia sẻ niềm đam mê đọc sách cùng Bookverse</p>
                    <div class="hero-actions">
                        <a href="categories.php" class="btn btn-primary">Khám phá ngay</a>
                        <a href="register.php" class="btn btn-secondary">Bắt đầu bán sách</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured Categories -->
        <section class="featured-categories">
            <div class="container">
                <h2 class="section-title">Danh mục nổi bật</h2>
                <div class="categories-grid" id="categoriesGrid">
                    <!-- Categories will be loaded here -->
                </div>
            </div>
        </section>

        <!-- Featured Products -->
        <section class="featured-products">
            <div class="container">
                <h2 class="section-title">Sách nổi bật</h2>
                <div class="products-grid" id="productsGrid">
                    <!-- Products will be loaded here -->
                </div>
                <div class="section-actions">
                    <a href="products.php" class="btn btn-outline">Xem tất cả sách</a>
                </div>
            </div>
        </section>

        <!-- Top Sellers -->
        <section class="top-sellers">
            <div class="container">
                <h2 class="section-title">Người bán hàng đầu</h2>
                <div class="sellers-grid" id="sellersGrid">
                    <!-- Sellers will be loaded here -->
                </div>
                <div class="section-actions">
                    <a href="sellers.php" class="btn btn-outline">Xem tất cả người bán</a>
                </div>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3 class="footer-title">Bookverse</h3>
                    <p class="footer-text">Nền tảng mua bán sách trực tuyến hàng đầu Việt Nam</p>
                    <div class="social-links">
                        <a href="#" class="social-link">Facebook</a>
                        <a href="#" class="social-link">Instagram</a>
                        <a href="#" class="social-link">Twitter</a>
                    </div>
                </div>
                <div class="footer-section">
                    <h4 class="footer-subtitle">Liên kết nhanh</h4>
                    <ul class="footer-links">
                        <li><a href="about.php">Giới thiệu</a></li>
                        <li><a href="contact.php">Liên hệ</a></li>
                        <li><a href="help.php">Trợ giúp</a></li>
                        <li><a href="terms.php">Điều khoản</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4 class="footer-subtitle">Dành cho người bán</h4>
                    <ul class="footer-links">
                        <li><a href="seller-register.php">Đăng ký bán sách</a></li>
                        <li><a href="seller-guide.php">Hướng dẫn bán hàng</a></li>
                        <li><a href="seller-support.php">Hỗ trợ người bán</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4 class="footer-subtitle">Liên hệ</h4>
                    <div class="contact-info">
                        <p>📧 Email: support@bookverse.vn</p>
                        <p>📞 Hotline: 1900 1234</p>
                        <p>📍 Địa chỉ: Hà Nội, Việt Nam</p>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Bookverse. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="assets/js/main.js"></script>
    <script src="assets/js/api.js"></script>
</body>
</html>


