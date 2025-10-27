<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? $pageTitle.' - ' : '';?>Bookverse</title>
    
    <!-- Preload Critical Resources -->
    <link rel="preload" href="../../assets/css/main.css" as="style">
    <link rel="preload" href="../../assets/css/auth.css" as="style">
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="../../assets/css/main.css">
    <link rel="stylesheet" href="../../assets/css/responsive.css">
    <link rel="stylesheet" href="../../assets/css/auth.css">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="../../assets/images/favicon.ico">
    
    <!-- Meta Tags -->
    <meta name="description" content="Đăng nhập/Đăng ký tài khoản Bookverse - Nền tảng mua bán sách trực tuyến">
    <meta name="robots" content="noindex, nofollow">
    
    <?php if (!empty($extraCss)) { foreach ($extraCss as $css) { ?>
    <link rel="stylesheet" href="<?php echo $css; ?>">
    <?php }} ?>
    
    <?php if (!empty($extraJs)) { foreach ($extraJs as $js) { ?>
    <script src="<?php echo $js; ?>"></script>
    <?php }} ?>
</head>
<body class="auth-body">
    <!-- Auth Background -->
    <div class="auth-background">
        <!-- Animated Background Elements -->
        <div class="bg-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
            <div class="shape shape-4"></div>
        </div>
        
        <!-- Floating Books Animation -->
        <div class="floating-books">
            <div class="book book-1">📚</div>
            <div class="book book-2">📖</div>
            <div class="book book-3">📗</div>
            <div class="book book-4">📘</div>
            <div class="book book-5">📙</div>
        </div>
    </div>
    
    <!-- Back to Home Link -->
    <div class="auth-back-home">
        <a href="../../index.php" class="back-link">
            <span class="back-icon">←</span>
            <span>Về trang chủ</span>
        </a>
    </div>
