// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Helper Functions
class BookverseAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('bookverse_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('bookverse_token', token);
    }

    // Clear authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('bookverse_token');
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authentication token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication APIs
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    // Product APIs
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products?${queryString}`);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async getFeaturedProducts() {
        return this.request('/products/featured');
    }

    async getCategories() {
        return this.request('/products/categories');
    }

    // User APIs
    async getUserProfile() {
        return this.request('/users/profile');
    }

    async updateUserProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ profile: profileData })
        });
    }

    async getSellers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/users/sellers?${queryString}`);
    }

    // Order APIs
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/orders?${queryString}`);
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    // Cart Management (Local Storage)
    getCart() {
        const cart = localStorage.getItem('bookverse_cart');
        return cart ? JSON.parse(cart) : [];
    }

    addToCart(product, quantity = 1) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.product.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                product: {
                    id: product._id,
                    title: product.title,
                    price: product.price,
                    images: product.images
                },
                quantity: quantity
            });
        }

        localStorage.setItem('bookverse_cart', JSON.stringify(cart));
        this.updateCartUI();
        return cart;
    }

    removeFromCart(productId) {
        const cart = this.getCart();
        const updatedCart = cart.filter(item => item.product.id !== productId);
        localStorage.setItem('bookverse_cart', JSON.stringify(updatedCart));
        this.updateCartUI();
        return updatedCart;
    }

    updateCartQuantity(productId, quantity) {
        const cart = this.getCart();
        const item = cart.find(item => item.product.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                return this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
            }
        }

        localStorage.setItem('bookverse_cart', JSON.stringify(cart));
        this.updateCartUI();
        return cart;
    }

    clearCart() {
        localStorage.removeItem('bookverse_cart');
        this.updateCartUI();
    }

    updateCartUI() {
        const cart = this.getCart();
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
    }

    // Search functionality
    async searchProducts(query, filters = {}) {
        return this.getProducts({
            search: query,
            ...filters
        });
    }

    // Utility functions
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('vi-VN');
    }

    // Error handling
    handleError(error) {
        console.error('API Error:', error);
        
        // Show user-friendly error message
        const errorMessage = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
        
        // You can implement a toast notification system here
        alert(errorMessage);
    }
}

// Create global API instance
const api = new BookverseAPI();

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', () => {
    api.updateCartUI();
});

// Export for use in other scripts
window.BookverseAPI = BookverseAPI;
window.api = api;


