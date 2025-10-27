    <!-- Auth Footer -->
    <footer class="auth-footer">
        <div class="auth-footer-content">
            <p>&copy; 2025 Bookverse. Tất cả quyền được bảo lưu.</p>
            <div class="auth-footer-links">
                <a href="../../index.php">Trang chủ</a>
                <a href="../../pages/products/list.php">Sản phẩm</a>
                <a href="../../about.php">Giới thiệu</a>
                <a href="../../contact.php">Liên hệ</a>
            </div>
        </div>
    </footer>
    
    <!-- Auth Background Script -->
    <script>
        // Add floating animation to books
        document.addEventListener('DOMContentLoaded', function() {
            const books = document.querySelectorAll('.book');
            books.forEach((book, index) => {
                book.style.animationDelay = `${index * 0.5}s`;
            });
        });
    </script>
</body>
</html>
