<?php
/**
 * Simple Navigation System for Bookverse
 */

// Determine current page context
$currentPath = $_SERVER['REQUEST_URI'];
$isAuthPage = strpos($currentPath, '/auth/') !== false;
$isSellerPage = strpos($currentPath, '/seller/') !== false;
$isAdminPage = strpos($currentPath, '/admin/') !== false;
$isAccountPage = strpos($currentPath, '/account/') !== false;
$isProductsPage = strpos($currentPath, '/products/') !== false;
$isPublicPage = !$isAuthPage && !$isSellerPage && !$isAdminPage && !$isAccountPage && !$isProductsPage;

// Determine navigation type
$navType = 'public';
if ($isSellerPage) $navType = 'seller';
if ($isAdminPage) $navType = 'admin';
if ($isAccountPage) $navType = 'account';
if ($isAuthPage) $navType = 'auth';
if ($isProductsPage) $navType = 'public'; // Products pages use public navigation
?>

<!-- Simple Navigation Header -->
<header class="header">
    <div class="container">
        <div class="header-content">
            <!-- Logo -->
            <div class="logo">
                <a href="<?php echo $navType === 'seller' || $navType === 'admin' || $navType === 'account' ? '../index.php' : ($isProductsPage ? '../../index.php' : 'index.php'); ?>" aria-label="Bookverse - Trang chủ">
                    <img src="<?php echo $navType === 'seller' || $navType === 'admin' || $navType === 'account' ? '../' : ($isProductsPage ? '../../' : ''); ?>assets/images/logo-text.svg" 
                         alt="Bookverse Logo" class="logo-img" width="150" height="33">
                </a>
            </div>

            <!-- Navigation -->
            <nav class="nav" role="navigation" aria-label="Menu chính">
                <ul class="nav-list">
                    <?php if ($navType === 'public'): ?>
                        <li class="nav-item">
                            <a href="<?php echo $isPublicPage ? 'index.php' : ($isProductsPage ? '../../index.php' : '../index.php'); ?>" class="nav-link">Trang chủ</a>
                        </li>
                        <li class="nav-item">
                            <a href="<?php echo $isPublicPage ? 'pages/products/list.php' : ($isProductsPage ? 'list.php' : '../products/list.php'); ?>" class="nav-link">Sản phẩm</a>
                        </li>
                        <li class="nav-item">
                            <a href="<?php echo $isPublicPage ? 'about.php' : ($isProductsPage ? '../../about.php' : '../about.php'); ?>" class="nav-link">Giới thiệu</a>
                        </li>
                    <?php elseif ($navType === 'seller'): ?>
                        <li class="nav-item">
                            <a href="dashboard.php" class="nav-link">Dashboard</a>
                        </li>
                        <li class="nav-item">
                            <a href="products.php" class="nav-link">Sản phẩm</a>
                        </li>
                        <li class="nav-item">
                            <a href="orders.php" class="nav-link">Đơn hàng</a>
                        </li>
                        <li class="nav-item">
                            <a href="bank-account.php" class="nav-link">Tài khoản</a>
                        </li>
                    <?php elseif ($navType === 'admin'): ?>
                        <li class="nav-item">
                            <a href="dashboard.php" class="nav-link">Dashboard</a>
                        </li>
                        <li class="nav-item">
                            <a href="users.php" class="nav-link">Người dùng</a>
                        </li>
                        <li class="nav-item">
                            <a href="products.php" class="nav-link">Sản phẩm</a>
                        </li>
                        <li class="nav-item">
                            <a href="orders.php" class="nav-link">Đơn hàng</a>
                        </li>
                        <li class="nav-item">
                            <a href="payments.php" class="nav-link">Thanh toán</a>
                        </li>
                    <?php elseif ($navType === 'account'): ?>
                        <li class="nav-item">
                            <a href="profile.php" class="nav-link">Hồ sơ</a>
                        </li>
                        <li class="nav-item">
                            <a href="orders.php" class="nav-link">Đơn hàng</a>
                        </li>
                        <li class="nav-item">
                            <a href="wishlist.php" class="nav-link">Yêu thích</a>
                        </li>
                        <li class="nav-item">
                            <a href="wallet.php" class="nav-link">Ví điện tử</a>
                        </li>
                    <?php elseif ($navType === 'auth'): ?>
                        <li class="nav-item">
                            <a href="../index.php" class="nav-link">Trang chủ</a>
                        </li>
                    <?php endif; ?>
                </ul>
            </nav>

            <!-- User Actions -->
            <div class="user-actions">
                <?php if ($navType === 'public' || $navType === 'account'): ?>
                <a href="<?php echo $isPublicPage ? 'pages/cart/cart.php' : ($isProductsPage ? '../../cart/cart.php' : '../cart/cart.php'); ?>" class="cart-btn" aria-label="Giỏ hàng">
                    <span class="cart-icon">🛒</span>
                    <span class="cart-count" aria-live="polite">0</span>
                </a>
                <?php endif; ?>

                <div class="user-menu">
                    <button class="user-btn" id="userBtn" aria-label="Menu tài khoản" aria-expanded="false">
                        <span class="user-icon">👤</span>
                        <span><?php echo $navType === 'seller' ? 'Seller' : ($navType === 'admin' ? 'Admin' : 'Tài khoản'); ?></span>
                    </button>
                    <div class="user-dropdown" id="userDropdown" role="menu" aria-hidden="true">
                        <?php if ($navType === 'public'): ?>
                            <a href="<?php echo $isPublicPage ? 'pages/auth/login.php' : ($isProductsPage ? '../../auth/login.php' : '../auth/login.php'); ?>" class="dropdown-link" role="menuitem">Đăng nhập</a>
                            <a href="<?php echo $isPublicPage ? 'pages/auth/register.php' : ($isProductsPage ? '../../auth/register.php' : '../auth/register.php'); ?>" class="dropdown-link" role="menuitem">Đăng ký</a>
                        <?php elseif ($navType === 'account'): ?>
                            <a href="profile.php" class="dropdown-link" role="menuitem">Hồ sơ</a>
                            <a href="orders.php" class="dropdown-link" role="menuitem">Đơn hàng</a>
                            <a href="wishlist.php" class="dropdown-link" role="menuitem">Yêu thích</a>
                            <a href="wallet.php" class="dropdown-link" role="menuitem">Ví điện tử</a>
                            <a href="../index.php" class="dropdown-link" role="menuitem">Về trang chủ</a>
                            <a href="#" class="dropdown-link" role="menuitem" onclick="logout()">Đăng xuất</a>
                        <?php elseif ($navType === 'seller'): ?>
                            <a href="dashboard.php" class="dropdown-link" role="menuitem">Dashboard</a>
                            <a href="../index.php" class="dropdown-link" role="menuitem">Về trang chủ</a>
                            <a href="#" class="dropdown-link" role="menuitem" onclick="logout()">Đăng xuất</a>
                        <?php elseif ($navType === 'admin'): ?>
                            <a href="dashboard.php" class="dropdown-link" role="menuitem">Dashboard</a>
                            <a href="../index.php" class="dropdown-link" role="menuitem">Về trang chủ</a>
                            <a href="#" class="dropdown-link" role="menuitem" onclick="logout()">Đăng xuất</a>
                        <?php elseif ($navType === 'auth'): ?>
                            <a href="login.php" class="dropdown-link" role="menuitem">Đăng nhập</a>
                            <a href="register.php" class="dropdown-link" role="menuitem">Đăng ký</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</header>

<script>
// User menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isExpanded = userBtn.getAttribute('aria-expanded') === 'true';
            userBtn.setAttribute('aria-expanded', !isExpanded);
            userDropdown.setAttribute('aria-hidden', isExpanded);
            userDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userBtn.setAttribute('aria-expanded', 'false');
            userDropdown.setAttribute('aria-hidden', 'true');
            userDropdown.classList.remove('show');
        });
    }
});

// Logout function
function logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Clear token and redirect
        localStorage.removeItem('token');
        sessionStorage.clear();
        window.location.href = '<?php echo $navType === 'seller' || $navType === 'admin' || $navType === 'account' ? '../index.php' : ($isProductsPage ? '../../index.php' : 'index.php'); ?>';
    }
}
</script>
