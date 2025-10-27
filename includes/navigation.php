<?php
/**
 * Smart Navigation System for Bookverse
 * Determines appropriate navigation based on user role and current page
 */

// Get user info from session/token if available
$user = null;
$userRole = 'guest';
$isLoggedIn = false;

// Check if user is logged in (you can implement this based on your auth system)
if (isset($_SESSION['user'])) {
    $user = $_SESSION['user'];
    $userRole = $user['role'] ?? 'user';
    $isLoggedIn = true;
} elseif (isset($_COOKIE['auth_token'])) {
    // You can decode JWT token here to get user info
    // For now, we'll assume guest
}

// Determine current page context
$currentPath = $_SERVER['REQUEST_URI'];
$currentPage = basename($_SERVER['PHP_SELF'], '.php');

// Navigation configurations
$navigationConfig = [
    'public' => [
        'logo' => 'index.php',
        'nav' => [
            ['url' => 'index.php', 'label' => 'Trang chủ', 'icon' => '🏠'],
            ['url' => 'pages/products/list.php', 'label' => 'Sản phẩm', 'icon' => '📚'],
            ['url' => 'about.php', 'label' => 'Giới thiệu', 'icon' => 'ℹ️']
        ],
        'actions' => [
            'cart' => 'pages/cart/cart.php',
            'user_menu' => [
                ['url' => 'pages/auth/login.php', 'label' => 'Đăng nhập', 'icon' => '🔑'],
                ['url' => 'pages/auth/register.php', 'label' => 'Đăng ký', 'icon' => '👤']
            ]
        ]
    ],
    'user' => [
        'logo' => 'index.php',
        'nav' => [
            ['url' => 'index.php', 'label' => 'Trang chủ', 'icon' => '🏠'],
            ['url' => 'pages/products/list.php', 'label' => 'Sản phẩm', 'icon' => '📚'],
            ['url' => 'pages/account/profile.php', 'label' => 'Tài khoản', 'icon' => '👤']
        ],
        'actions' => [
            'cart' => 'pages/cart/cart.php',
            'user_menu' => [
                ['url' => 'pages/account/profile.php', 'label' => 'Hồ sơ', 'icon' => '👤'],
                ['url' => 'pages/account/orders.php', 'label' => 'Đơn hàng', 'icon' => '📦'],
                ['url' => 'pages/account/wishlist.php', 'label' => 'Yêu thích', 'icon' => '❤️'],
                ['url' => 'pages/account/wallet.php', 'label' => 'Ví điện tử', 'icon' => '💰'],
                ['url' => '#', 'label' => 'Đăng xuất', 'icon' => '🚪', 'action' => 'logout']
            ]
        ]
    ],
    'seller' => [
        'logo' => '../index.php',
        'nav' => [
            ['url' => 'dashboard.php', 'label' => 'Dashboard', 'icon' => '📊'],
            ['url' => 'products.php', 'label' => 'Sản phẩm', 'icon' => '📚'],
            ['url' => 'orders.php', 'label' => 'Đơn hàng', 'icon' => '📦'],
            ['url' => 'bank-account.php', 'label' => 'Tài khoản', 'icon' => '🏦']
        ],
        'actions' => [
            'user_menu' => [
                ['url' => 'dashboard.php', 'label' => 'Dashboard', 'icon' => '📊'],
                ['url' => '../index.php', 'label' => 'Về trang chủ', 'icon' => '🏠'],
                ['url' => '#', 'label' => 'Đăng xuất', 'icon' => '🚪', 'action' => 'logout']
            ]
        ]
    ],
    'admin' => [
        'logo' => '../index.php',
        'nav' => [
            ['url' => 'dashboard.php', 'label' => 'Dashboard', 'icon' => '📊'],
            ['url' => 'users.php', 'label' => 'Người dùng', 'icon' => '👥'],
            ['url' => 'products.php', 'label' => 'Sản phẩm', 'icon' => '📚'],
            ['url' => 'orders.php', 'label' => 'Đơn hàng', 'icon' => '📦'],
            ['url' => 'payments.php', 'label' => 'Thanh toán', 'icon' => '💰']
        ],
        'actions' => [
            'user_menu' => [
                ['url' => 'dashboard.php', 'label' => 'Dashboard', 'icon' => '📊'],
                ['url' => '../index.php', 'label' => 'Về trang chủ', 'icon' => '🏠'],
                ['url' => '#', 'label' => 'Đăng xuất', 'icon' => '🚪', 'action' => 'logout']
            ]
        ]
    ],
    'auth' => [
        'logo' => '../index.php',
        'nav' => [
            ['url' => '../index.php', 'label' => 'Trang chủ', 'icon' => '🏠']
        ],
        'actions' => [
            'user_menu' => [
                ['url' => 'login.php', 'label' => 'Đăng nhập', 'icon' => '🔑'],
                ['url' => 'register.php', 'label' => 'Đăng ký', 'icon' => '👤']
            ]
        ]
    ]
];

// Determine navigation type based on current page and user role
function getNavigationType($currentPath, $userRole, $isLoggedIn) {
    // Check if we're in specific sections
    if (strpos($currentPath, '/auth/') !== false) return 'auth';
    if (strpos($currentPath, '/seller/') !== false) return 'seller';
    if (strpos($currentPath, '/admin/') !== false) return 'admin';
    if (strpos($currentPath, '/account/') !== false) return 'user';
    
    // For public pages, use user role if logged in
    if ($isLoggedIn) {
        return $userRole;
    }
    
    return 'public';
}

// Get current navigation config
$navType = getNavigationType($currentPath, $userRole, $isLoggedIn);
$navConfig = $navigationConfig[$navType] ?? $navigationConfig['public'];

// Helper function to check if current page is active
function isActivePage($url, $currentPath) {
    $currentFile = basename($currentPath);
    $targetFile = basename($url);
    return $currentFile === $targetFile;
}

// Helper function to get relative path
function getRelativePath($url, $currentPath) {
    if (strpos($currentPath, '/pages/') !== false) {
        return '../' . $url;
    }
    return $url;
}
?>

<!-- Smart Navigation Header -->
<header class="header">
    <div class="container">
        <div class="header-content">
            <!-- Logo -->
            <div class="logo">
                <a href="<?php echo $navConfig['logo']; ?>" aria-label="Bookverse - Trang chủ">
                    <img src="<?php echo strpos($currentPath, '/pages/') !== false ? '../' : ''; ?>assets/images/logo-text.svg" 
                         alt="Bookverse Logo" class="logo-img" width="150" height="33">
                </a>
            </div>

            <!-- Navigation -->
            <nav class="nav" role="navigation" aria-label="Menu chính">
                <ul class="nav-list">
                    <?php foreach ($navConfig['nav'] as $item): ?>
                    <li class="nav-item">
                        <a href="<?php echo getRelativePath($item['url'], $currentPath); ?>" 
                           class="nav-link <?php echo isActivePage($item['url'], $currentPath) ? 'active' : ''; ?>"
                           <?php echo isActivePage($item['url'], $currentPath) ? 'aria-current="page"' : ''; ?>>
                            <?php if (isset($item['icon'])): ?>
                                <span class="nav-icon"><?php echo $item['icon']; ?></span>
                            <?php endif; ?>
                            <span><?php echo $item['label']; ?></span>
                        </a>
                    </li>
                    <?php endforeach; ?>
                </ul>
            </nav>

            <!-- User Actions -->
            <div class="user-actions">
                <?php if (isset($navConfig['actions']['cart'])): ?>
                <a href="<?php echo getRelativePath($navConfig['actions']['cart'], $currentPath); ?>" 
                   class="cart-btn" aria-label="Giỏ hàng">
                    <span class="cart-icon">🛒</span>
                    <span class="cart-count" aria-live="polite">0</span>
                </a>
                <?php endif; ?>

                <div class="user-menu">
                    <button class="user-btn" id="userBtn" aria-label="Menu tài khoản" aria-expanded="false">
                        <span class="user-icon">👤</span>
                        <span><?php echo $isLoggedIn ? ucfirst($userRole) : 'Tài khoản'; ?></span>
                    </button>
                    <div class="user-dropdown" id="userDropdown" role="menu" aria-hidden="true">
                        <?php foreach ($navConfig['actions']['user_menu'] as $item): ?>
                        <a href="<?php echo isset($item['action']) ? '#' : getRelativePath($item['url'], $currentPath); ?>" 
                           class="dropdown-link" 
                           role="menuitem"
                           <?php echo isset($item['action']) ? 'onclick="' . $item['action'] . '()"' : ''; ?>>
                            <?php if (isset($item['icon'])): ?>
                                <span class="dropdown-icon"><?php echo $item['icon']; ?></span>
                            <?php endif; ?>
                            <span><?php echo $item['label']; ?></span>
                        </a>
                        <?php endforeach; ?>
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
        window.location.href = '<?php echo $navConfig['logo']; ?>';
    }
}
</script>
