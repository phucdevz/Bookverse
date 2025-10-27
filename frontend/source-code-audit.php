<?php
/**
 * Source Code Audit and Cleanup for Bookverse
 * Kiểm tra và clean up toàn bộ source code
 */

echo "<h1>🧹 BOOKVERSE SOURCE CODE AUDIT & CLEANUP</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 2rem; background: #f5f5f5; }
    .audit-section { background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .error { color: #ef4444; }
    .success { color: #10b981; }
    .warning { color: #f59e0b; }
    .info { color: #3b82f6; }
    .cleanup-item { margin: 0.5rem 0; padding: 0.5rem; background: #f8fafc; border-radius: 4px; border-left: 4px solid #3b82f6; }
    .cleanup-success { border-left-color: #10b981; background: #dcfce7; }
    .cleanup-warning { border-left-color: #f59e0b; background: #fef3c7; }
    .cleanup-error { border-left-color: #ef4444; background: #fef2f2; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
    th { background: #f9fafb; }
    .status-ok { background: #dcfce7; }
    .status-warning { background: #fef3c7; }
    .status-error { background: #fef2f2; }
    pre { background: #f8fafc; padding: 1rem; border-radius: 4px; overflow-x: auto; }
</style>";

// 1. Kiểm tra các file test và debug
echo "<div class='audit-section'>";
echo "<h2>🔍 1. Kiểm tra file test và debug</h2>";

$testFiles = [
    'test-paths.php' => 'Test paths script',
    'test-redirects.php' => 'Test redirects script', 
    'test-navigation.php' => 'Test navigation script',
    'debug-navigation.php' => 'Debug navigation script',
    'final-redirect-test.php' => 'Final redirect test',
    'final-navigation-check.php' => 'Final navigation check',
    'redirect-summary.php' => 'Redirect summary',
    'source-code-audit.php' => 'This audit script',
    'audit-pages.php' => 'Pages audit script',
    'audit-redirects.php' => 'Redirects audit script',
    'fix-pages.php' => 'Fix pages script',
    'pages/products/test.php' => 'Products test page',
    'pages/seller/test-dashboard.php' => 'Seller test dashboard',
    'test-products-nav.php' => 'Products navigation test',
    'test-real-navigation.php' => 'Real navigation test'
];

$testFilesFound = [];
foreach ($testFiles as $file => $description) {
    if (file_exists($file)) {
        $testFilesFound[] = $file;
        echo "<div class='cleanup-item cleanup-warning'>";
        echo "<strong>⚠️ Test file:</strong> $file - $description";
        echo "</div>";
    }
}

if (empty($testFilesFound)) {
    echo "<p class='success'>✅ Không có file test nào</p>";
} else {
    echo "<p class='warning'>⚠️ Tìm thấy " . count($testFilesFound) . " file test cần xóa</p>";
}

echo "</div>";

// 2. Kiểm tra file không cần thiết
echo "<div class='audit-section'>";
echo "<h2>🗑️ 2. Kiểm tra file không cần thiết</h2>";

$unnecessaryFiles = [
    'auth-demo.html' => 'Auth demo HTML file',
    'logo-showcase.html' => 'Logo showcase HTML file',
    'offline.html' => 'Offline HTML file',
    'sw.js' => 'Service worker (nếu không dùng PWA)',
    'test-paths.php' => 'Test paths script',
    'test-redirects.php' => 'Test redirects script',
    'test-navigation.php' => 'Test navigation script',
    'debug-navigation.php' => 'Debug navigation script',
    'final-redirect-test.php' => 'Final redirect test',
    'final-navigation-check.php' => 'Final navigation check',
    'redirect-summary.php' => 'Redirect summary',
    'source-code-audit.php' => 'This audit script',
    'audit-pages.php' => 'Pages audit script',
    'audit-redirects.php' => 'Redirects audit script',
    'fix-pages.php' => 'Fix pages script',
    'pages/products/test.php' => 'Products test page',
    'pages/seller/test-dashboard.php' => 'Seller test dashboard',
    'test-products-nav.php' => 'Products navigation test',
    'test-real-navigation.php' => 'Real navigation test'
];

$unnecessaryFilesFound = [];
foreach ($unnecessaryFiles as $file => $description) {
    if (file_exists($file)) {
        $unnecessaryFilesFound[] = $file;
        echo "<div class='cleanup-item cleanup-warning'>";
        echo "<strong>🗑️ Unnecessary:</strong> $file - $description";
        echo "</div>";
    }
}

if (empty($unnecessaryFilesFound)) {
    echo "<p class='success'>✅ Không có file không cần thiết</p>";
} else {
    echo "<p class='warning'>⚠️ Tìm thấy " . count($unnecessaryFilesFound) . " file không cần thiết</p>";
}

echo "</div>";

// 3. Kiểm tra file JavaScript debug
echo "<div class='audit-section'>";
echo "<h2>🔧 3. Kiểm tra JavaScript debug files</h2>";

$jsDebugFiles = [
    'assets/js/pages/products-debug.js' => 'Products debug JS',
    'assets/js/pages/products-list-simple.js' => 'Products list simple JS'
];

$jsDebugFilesFound = [];
foreach ($jsDebugFiles as $file => $description) {
    if (file_exists($file)) {
        $jsDebugFilesFound[] = $file;
        echo "<div class='cleanup-item cleanup-warning'>";
        echo "<strong>🔧 Debug JS:</strong> $file - $description";
        echo "</div>";
    }
}

if (empty($jsDebugFilesFound)) {
    echo "<p class='success'>✅ Không có JavaScript debug files</p>";
} else {
    echo "<p class='warning'>⚠️ Tìm thấy " . count($jsDebugFilesFound) . " JavaScript debug files</p>";
}

echo "</div>";

// 4. Kiểm tra file CSS không dùng
echo "<div class='audit-section'>";
echo "<h2>🎨 4. Kiểm tra CSS files</h2>";

$cssFiles = [
    'assets/css/main.css' => 'Main CSS',
    'assets/css/responsive.css' => 'Responsive CSS',
    'assets/css/logo.css' => 'Logo CSS',
    'assets/css/auth.css' => 'Auth CSS',
    'assets/css/account.css' => 'Account CSS',
    'assets/css/seller.css' => 'Seller CSS',
    'assets/css/admin.css' => 'Admin CSS',
    'assets/css/cart.css' => 'Cart CSS',
    'assets/css/checkout.css' => 'Checkout CSS',
    'assets/css/product-detail.css' => 'Product detail CSS',
    'assets/css/products.css' => 'Products CSS',
    'assets/css/about.css' => 'About CSS',
    'assets/css/wallet.css' => 'Wallet CSS',
    'assets/css/bank-account.css' => 'Bank account CSS',
    'assets/css/demo.css' => 'Demo CSS'
];

$cssFilesFound = [];
foreach ($cssFiles as $file => $description) {
    if (file_exists($file)) {
        $cssFilesFound[] = $file;
        echo "<div class='cleanup-item cleanup-success'>";
        echo "<strong>✅ CSS:</strong> $file - $description";
        echo "</div>";
    }
}

echo "<p class='info'>📊 Tìm thấy " . count($cssFilesFound) . " CSS files</p>";

echo "</div>";

// 5. Kiểm tra file JavaScript
echo "<div class='audit-section'>";
echo "<h2>⚡ 5. Kiểm tra JavaScript files</h2>";

$jsFiles = [
    'assets/js/main.js' => 'Main JS',
    'assets/js/api.js' => 'API JS',
    'assets/js/auth.js' => 'Auth JS',
    'assets/js/admin-auth.js' => 'Admin auth JS',
    'assets/js/seller.js' => 'Seller JS',
    'assets/js/admin.js' => 'Admin JS',
    'assets/js/cart.js' => 'Cart JS',
    'assets/js/checkout.js' => 'Checkout JS',
    'assets/js/product.js' => 'Product JS',
    'assets/js/products.js' => 'Products JS',
    'assets/js/pages/profile.js' => 'Profile JS',
    'assets/js/pages/orders.js' => 'Orders JS',
    'assets/js/pages/wishlist.js' => 'Wishlist JS',
    'assets/js/pages/wallet.js' => 'Wallet JS',
    'assets/js/pages/bank-account.js' => 'Bank account JS',
    'assets/js/pages/products-list.js' => 'Products list JS',
    'assets/js/overflow-fix.js' => 'Overflow fix JS'
];

$jsFilesFound = [];
foreach ($jsFiles as $file => $description) {
    if (file_exists($file)) {
        $jsFilesFound[] = $file;
        echo "<div class='cleanup-item cleanup-success'>";
        echo "<strong>✅ JS:</strong> $file - $description";
        echo "</div>";
    }
}

echo "<p class='info'>📊 Tìm thấy " . count($jsFilesFound) . " JavaScript files</p>";

echo "</div>";

// 6. Kiểm tra file PHP chính
echo "<div class='audit-section'>";
echo "<h2>📄 6. Kiểm tra PHP files chính</h2>";

$phpFiles = [
    'index.php' => 'Homepage',
    'about.php' => 'About page',
    'demo.php' => 'Demo page',
    'includes/header.php' => 'Header include',
    'includes/footer.php' => 'Footer include',
    'includes/navigation-simple.php' => 'Navigation include',
    'includes/auth-header.php' => 'Auth header include',
    'includes/auth-footer.php' => 'Auth footer include',
    'pages/auth/login.php' => 'Login page',
    'pages/auth/register.php' => 'Register page',
    'pages/auth/forgot.php' => 'Forgot password page',
    'pages/auth/reset.php' => 'Reset password page',
    'pages/auth/seller-register.php' => 'Seller register page',
    'pages/admin/login.php' => 'Admin login page',
    'pages/admin/dashboard.php' => 'Admin dashboard',
    'pages/products/list.php' => 'Products list page',
    'pages/products/detail.php' => 'Product detail page',
    'pages/cart/cart.php' => 'Cart page',
    'pages/checkout/checkout.php' => 'Checkout page',
    'pages/checkout/success.php' => 'Checkout success page',
    'pages/account/profile.php' => 'User profile page',
    'pages/account/orders.php' => 'User orders page',
    'pages/account/wishlist.php' => 'User wishlist page',
    'pages/account/wallet.php' => 'User wallet page',
    'pages/seller/dashboard.php' => 'Seller dashboard',
    'pages/seller/products.php' => 'Seller products page',
    'pages/seller/orders.php' => 'Seller orders page',
    'pages/seller/bank-account.php' => 'Seller bank account page'
];

$phpFilesFound = [];
foreach ($phpFiles as $file => $description) {
    if (file_exists($file)) {
        $phpFilesFound[] = $file;
        echo "<div class='cleanup-item cleanup-success'>";
        echo "<strong>✅ PHP:</strong> $file - $description";
        echo "</div>";
    }
}

echo "<p class='info'>📊 Tìm thấy " . count($phpFilesFound) . " PHP files chính</p>";

echo "</div>";

// 7. Tổng kết và đề xuất cleanup
echo "<div class='audit-section'>";
echo "<h2>📊 7. Tổng kết và đề xuất cleanup</h2>";

$totalTestFiles = count($testFilesFound);
$totalUnnecessaryFiles = count($unnecessaryFilesFound);
$totalDebugFiles = count($jsDebugFilesFound);

echo "<table>";
echo "<tr><th>Loại file</th><th>Số lượng</th><th>Trạng thái</th></tr>";
echo "<tr class='status-ok'><td>✅ PHP files chính</td><td>" . count($phpFilesFound) . "</td><td>OK - Cần giữ</td></tr>";
echo "<tr class='status-ok'><td>✅ CSS files</td><td>" . count($cssFilesFound) . "</td><td>OK - Cần giữ</td></tr>";
echo "<tr class='status-ok'><td>✅ JavaScript files</td><td>" . count($jsFilesFound) . "</td><td>OK - Cần giữ</td></tr>";

if ($totalTestFiles > 0) {
    echo "<tr class='status-warning'><td>⚠️ Test files</td><td>$totalTestFiles</td><td>Nên xóa</td></tr>";
}

if ($totalUnnecessaryFiles > 0) {
    echo "<tr class='status-warning'><td>⚠️ Unnecessary files</td><td>$totalUnnecessaryFiles</td><td>Nên xóa</td></tr>";
}

if ($totalDebugFiles > 0) {
    echo "<tr class='status-warning'><td>⚠️ Debug files</td><td>$totalDebugFiles</td><td>Nên xóa</td></tr>";
}

echo "</table>";

if ($totalTestFiles > 0 || $totalUnnecessaryFiles > 0 || $totalDebugFiles > 0) {
    echo "<div class='cleanup-item cleanup-warning'>";
    echo "<h3>🧹 Đề xuất cleanup:</h3>";
    echo "<p>Có " . ($totalTestFiles + $totalUnnecessaryFiles + $totalDebugFiles) . " file cần xóa để clean up source code</p>";
    echo "<ul>";
    if ($totalTestFiles > 0) echo "<li>Xóa $totalTestFiles test files</li>";
    if ($totalUnnecessaryFiles > 0) echo "<li>Xóa $totalUnnecessaryFiles unnecessary files</li>";
    if ($totalDebugFiles > 0) echo "<li>Xóa $totalDebugFiles debug files</li>";
    echo "</ul>";
    echo "</div>";
} else {
    echo "<div class='cleanup-item cleanup-success'>";
    echo "<h3>✅ Source code đã sạch sẽ!</h3>";
    echo "<p>Không có file nào cần xóa</p>";
    echo "</div>";
}

echo "</div>";
?>
