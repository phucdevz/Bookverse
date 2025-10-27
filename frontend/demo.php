<?php 
$pageTitle='Demo Bookverse - Sàn thương mại điện tử sách'; 
$extraCss=['assets/css/main.css', 'assets/css/demo.css']; 
$extraJs=['assets/js/main.js'];
include 'includes/header.php'; 
?>

<main class="demo-main">
    <div class="container">
        <!-- Hero Section -->
        <section class="demo-hero">
            <div class="hero-content">
                <h1>Bookverse Marketplace</h1>
                <p class="hero-subtitle">Sàn thương mại điện tử sách chuyên nghiệp</p>
                <div class="hero-stats">
                    <div class="stat-item">
                        <span class="stat-number">50,000+</span>
                        <span class="stat-label">Người dùng</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">100,000+</span>
                        <span class="stat-label">Sản phẩm</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">5,000+</span>
                        <span class="stat-label">Người bán</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Overview -->
        <section class="features-overview">
            <h2 class="section-title">Tính năng nổi bật</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🛒</div>
                    <h3>Mua sắm thông minh</h3>
                    <p>Tìm kiếm, lọc và so sánh sản phẩm với giao diện trực quan</p>
                    <a href="pages/products/list.php" class="feature-link">Khám phá ngay →</a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💼</div>
                    <h3>Bán hàng dễ dàng</h3>
                    <p>Dashboard quản lý sản phẩm, đơn hàng và thống kê chi tiết</p>
                    <a href="pages/seller/dashboard.php" class="feature-link">Bắt đầu bán →</a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💰</div>
                    <h3>Thanh toán linh hoạt</h3>
                    <p>Hệ thống ví điện tử và thanh toán đa dạng</p>
                    <a href="pages/account/wallet.php" class="feature-link">Quản lý ví →</a>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Quản trị toàn diện</h3>
                    <p>Dashboard admin với thống kê và quản lý hệ thống</p>
                    <a href="pages/admin/dashboard.php" class="feature-link">Xem dashboard →</a>
                </div>
            </div>
        </section>

        <!-- User Journeys -->
        <section class="user-journeys">
            <h2 class="section-title">Trải nghiệm người dùng</h2>
            <div class="journey-tabs">
                <button class="tab-btn active" data-tab="buyer">Người mua</button>
                <button class="tab-btn" data-tab="seller">Người bán</button>
                <button class="tab-btn" data-tab="admin">Quản trị viên</button>
            </div>
            
            <div class="journey-content">
                <!-- Buyer Journey -->
                <div class="journey-panel active" id="buyer-journey">
                    <div class="journey-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h3>Đăng ký tài khoản</h3>
                                <p>Tạo tài khoản người dùng để bắt đầu mua sắm</p>
                                <a href="pages/auth/register.php" class="btn btn-outline">Đăng ký</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h3>Khám phá sản phẩm</h3>
                                <p>Tìm kiếm và lọc sách theo danh mục, giá, đánh giá</p>
                                <a href="pages/products/list.php" class="btn btn-outline">Xem sản phẩm</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h3>Thêm vào giỏ hàng</h3>
                                <p>Chọn sản phẩm yêu thích và thêm vào giỏ hàng</p>
                                <a href="pages/cart/cart.php" class="btn btn-outline">Giỏ hàng</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h3>Thanh toán</h3>
                                <p>Hoàn tất đơn hàng với thông tin giao hàng</p>
                                <a href="pages/checkout/checkout.php" class="btn btn-outline">Thanh toán</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Seller Journey -->
                <div class="journey-panel" id="seller-journey">
                    <div class="journey-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h3>Đăng ký người bán</h3>
                                <p>Tạo tài khoản người bán với thông tin doanh nghiệp</p>
                                <a href="pages/auth/seller-register.php" class="btn btn-outline">Đăng ký bán</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h3>Quản lý sản phẩm</h3>
                                <p>Thêm, chỉnh sửa và quản lý danh mục sách</p>
                                <a href="pages/seller/products.php" class="btn btn-outline">Quản lý sản phẩm</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h3>Theo dõi đơn hàng</h3>
                                <p>Xử lý và theo dõi trạng thái đơn hàng</p>
                                <a href="pages/seller/orders.php" class="btn btn-outline">Đơn hàng</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h3>Thống kê bán hàng</h3>
                                <p>Xem báo cáo doanh thu và hiệu suất bán hàng</p>
                                <a href="pages/seller/dashboard.php" class="btn btn-outline">Dashboard</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Admin Journey -->
                <div class="journey-panel" id="admin-journey">
                    <div class="journey-steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h3>Đăng nhập admin</h3>
                                <p>Truy cập hệ thống quản trị với quyền admin</p>
                                <a href="pages/admin/login.php" class="btn btn-outline">Đăng nhập admin</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h3>Quản lý người dùng</h3>
                                <p>Duyệt đăng ký người bán và quản lý tài khoản</p>
                                <a href="pages/admin/dashboard.php" class="btn btn-outline">Quản lý người dùng</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h3>Xử lý thanh toán</h3>
                                <p>Duyệt nạp tiền và thanh toán cho người bán</p>
                                <a href="pages/admin/dashboard.php" class="btn btn-outline">Quản lý thanh toán</a>
                            </div>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <div class="step-content">
                                <h3>Thống kê hệ thống</h3>
                                <p>Xem báo cáo tổng quan và hiệu suất hệ thống</p>
                                <a href="pages/admin/dashboard.php" class="btn btn-outline">Thống kê</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Technical Features -->
        <section class="technical-features">
            <h2 class="section-title">Tính năng kỹ thuật</h2>
            <div class="tech-grid">
                <div class="tech-card">
                    <div class="tech-icon">🔐</div>
                    <h3>Bảo mật cao</h3>
                    <ul>
                        <li>JWT Authentication</li>
                        <li>Password hashing với bcrypt</li>
                        <li>Role-based access control</li>
                        <li>Rate limiting</li>
                    </ul>
                </div>
                <div class="tech-card">
                    <div class="tech-icon">📱</div>
                    <h3>Responsive Design</h3>
                    <ul>
                        <li>Mobile-first approach</li>
                        <li>Cross-browser compatibility</li>
                        <li>Touch-friendly interface</li>
                        <li>Progressive Web App</li>
                    </ul>
                </div>
                <div class="tech-card">
                    <div class="tech-icon">⚡</div>
                    <h3>Hiệu suất cao</h3>
                    <ul>
                        <li>Lazy loading images</li>
                        <li>API optimization</li>
                        <li>Caching strategies</li>
                        <li>Database indexing</li>
                    </ul>
                </div>
                <div class="tech-card">
                    <div class="tech-icon">🛡️</div>
                    <h3>Hệ thống thanh toán</h3>
                    <ul>
                        <li>Ví điện tử tích hợp</li>
                        <li>Hoa hồng 2% cho admin</li>
                        <li>Thanh toán đa dạng</li>
                        <li>Lịch sử giao dịch</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Quick Access -->
        <section class="quick-access">
            <h2 class="section-title">Truy cập nhanh</h2>
            <div class="access-grid">
                <a href="index.php" class="access-card">
                    <div class="access-icon">🏠</div>
                    <h3>Trang chủ</h3>
                    <p>Khám phá sách nổi bật</p>
                </a>
                <a href="pages/products/list.php" class="access-card">
                    <div class="access-icon">📚</div>
                    <h3>Sản phẩm</h3>
                    <p>Danh mục sách đa dạng</p>
                </a>
                <a href="pages/auth/register.php" class="access-card">
                    <div class="access-icon">👤</div>
                    <h3>Đăng ký</h3>
                    <p>Tạo tài khoản mới</p>
                </a>
                <a href="pages/auth/login.php" class="access-card">
                    <div class="access-icon">🔑</div>
                    <h3>Đăng nhập</h3>
                    <p>Truy cập tài khoản</p>
                </a>
                <a href="pages/seller/dashboard.php" class="access-card">
                    <div class="access-icon">💼</div>
                    <h3>Seller Dashboard</h3>
                    <p>Quản lý cửa hàng</p>
                </a>
                <a href="pages/admin/dashboard.php" class="access-card">
                    <div class="access-icon">⚙️</div>
                    <h3>Admin Dashboard</h3>
                    <p>Quản trị hệ thống</p>
                </a>
            </div>
        </section>
    </div>
</main>

<?php include 'includes/footer.php'; ?>
