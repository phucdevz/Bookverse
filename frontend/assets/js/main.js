// Main JavaScript functionality for Bookverse

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
});

function initializeApp() {
    // Load initial data
    loadCategories();
    loadFeaturedProducts();
    loadTopSellers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize user interface
    initializeUI();
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await api.getCategories();
        if (response.success) {
            displayCategories(response.data.categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('Không thể tải danh mục sách');
    }
}

// Display categories in the grid
function displayCategories(categories) {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    const categoriesHTML = categories.slice(0, 6).map(category => `
        <div class="category-card">
            <div class="category-icon">📚</div>
            <h3 class="category-name">${category.name}</h3>
            <p class="category-description">${category.description || 'Khám phá bộ sưu tập sách đa dạng'}</p>
            <a href="category.php?id=${category._id}" class="category-link">Xem sách</a>
        </div>
    `).join('');

    categoriesGrid.innerHTML = categoriesHTML;
}

// Load featured products from API
async function loadFeaturedProducts() {
    try {
        const response = await api.getFeaturedProducts();
        if (response.success) {
            displayProducts(response.data.products);
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        showError('Không thể tải sách nổi bật');
    }
}

// Display products in the grid
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const productsHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${product.images[0]?.url || 'assets/images/no-image.jpg'}" 
                     alt="${product.title}" 
                     class="product-image"
                     onerror="this.src='assets/images/no-image.jpg'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-author">Tác giả: ${product.author}</p>
                <div class="product-rating">
                    <div class="stars">${generateStars(product.rating.average)}</div>
                    <span class="rating-text">(${product.rating.count} đánh giá)</span>
                </div>
                <div class="product-price">${api.formatPrice(product.price)}</div>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="addToCart('${product._id}')">
                        Thêm vào giỏ
                    </button>
                    <a href="product.php?id=${product._id}" class="btn btn-outline">
                        Xem chi tiết
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    productsGrid.innerHTML = productsHTML;
}

// Load top sellers from API
async function loadTopSellers() {
    try {
        const response = await api.getSellers({ limit: 6 });
        if (response.success) {
            displaySellers(response.data.sellers);
        }
    } catch (error) {
        console.error('Error loading top sellers:', error);
        showError('Không thể tải danh sách người bán');
    }
}

// Display sellers in the grid
function displaySellers(sellers) {
    const sellersGrid = document.getElementById('sellersGrid');
    if (!sellersGrid) return;

    const sellersHTML = sellers.map(seller => `
        <div class="seller-card">
            <div class="seller-avatar">
                <img src="${seller.profile?.avatar || 'assets/images/default-avatar.jpg'}" 
                     alt="${seller.username}" 
                     class="avatar-image"
                     onerror="this.src='assets/images/default-avatar.jpg'">
            </div>
            <div class="seller-info">
                <h3 class="seller-name">${seller.sellerProfile?.businessName || seller.username}</h3>
                <p class="seller-description">${seller.sellerProfile?.description || 'Người bán uy tín'}</p>
                <div class="seller-stats">
                    <span class="stat">⭐ 4.8/5</span>
                    <span class="stat">📦 100+ sản phẩm</span>
                </div>
                <a href="seller.php?id=${seller._id}" class="btn btn-outline">
                    Xem cửa hàng
                </a>
            </div>
        </div>
    `).join('');

    sellersGrid.innerHTML = sellersHTML;
}

// Generate star rating display
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
}

// Add product to cart
async function addToCart(productId) {
    try {
        // Get product details first
        const response = await api.getProduct(productId);
        if (response.success) {
            api.addToCart(response.data.product);
            showSuccess('Đã thêm sản phẩm vào giỏ hàng');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showError('Không thể thêm sản phẩm vào giỏ hàng');
    }
}

// Setup event listeners
function setupEventListeners() {
    // User dropdown toggle
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
        });
    }

    // Search form submission
    const searchForm = document.querySelector('.search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const searchInput = this.querySelector('.search-input');
            const query = searchInput.value.trim();
            
            if (query) {
                window.location.href = `search.php?q=${encodeURIComponent(query)}`;
            }
        });
    }

    // Check authentication status
    checkAuthStatus();
}

// Check if user is authenticated
async function checkAuthStatus() {
    try {
        const response = await api.getCurrentUser();
        if (response.success) {
            updateUserInterface(response.data.user);
        }
    } catch (error) {
        // User is not authenticated
        console.log('User not authenticated');
    }
}

// Update user interface based on authentication status
function updateUserInterface(user) {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown && user) {
        userDropdown.innerHTML = `
            <a href="profile.php" class="dropdown-link">Hồ sơ cá nhân</a>
            <a href="orders.php" class="dropdown-link">Đơn hàng</a>
            <a href="wishlist.php" class="dropdown-link">Yêu thích</a>
            <a href="settings.php" class="dropdown-link">Cài đặt</a>
            <hr>
            <a href="#" class="dropdown-link" onclick="logout()">Đăng xuất</a>
        `;
    }
}

// Logout function
async function logout() {
    try {
        await api.logout();
        api.clearToken();
        location.reload();
    } catch (error) {
        console.error('Logout error:', error);
        // Clear token anyway
        api.clearToken();
        location.reload();
    }
}

// Initialize UI components
function initializeUI() {
    // Add loading states
    addLoadingStates();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize animations
    initializeAnimations();
}

// Add loading states to dynamic content
function addLoadingStates() {
    const grids = ['categoriesGrid', 'productsGrid', 'sellersGrid'];
    
    grids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            `;
        }
    });
}

// Initialize tooltips
function initializeTooltips() {
    // Add tooltip functionality if needed
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

// Show tooltip
function showTooltip(e) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = e.target.dataset.tooltip;
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// Initialize animations
function initializeAnimations() {
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.category-card, .product-card, .seller-card');
    animateElements.forEach(el => observer.observe(el));
}

// Show success message
function showSuccess(message) {
    // You can implement a toast notification system here
    alert(message);
}

// Show error message
function showError(message) {
    // You can implement a toast notification system here
    alert(message);
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export functions for global use
window.addToCart = addToCart;
window.logout = logout;


