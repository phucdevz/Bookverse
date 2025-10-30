const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, approvedSeller, optionalAuth } = require('../middlewares/auth');
const { validateProduct } = require('../middlewares/validation');
const { cache, optimizeQuery } = require('../config/database-optimized');
const { 
    cacheMiddleware, 
    queryOptimization, 
    responseTime,
    memoryMonitor 
} = require('../middlewares/performance');

const router = express.Router();

// Apply performance middleware to all routes
router.use(responseTime);
router.use(memoryMonitor);

// Get all products with advanced filtering and caching
router.get('/', 
    optionalAuth,
    queryOptimization(Product, {
        defaultLimit: 20,
        maxLimit: 100,
        allowedSorts: ['price', 'rating.average', 'createdAt', 'title'],
        allowedFilters: ['category', 'seller', 'status', 'isActive', 'isFeatured']
    }),
    cacheMiddleware(300), // Cache for 5 minutes
    async (req, res) => {
        try {
            const { page, limit, skip, sort, filter } = req.queryParams;
            const { search, minPrice, maxPrice, condition, language } = req.query;
            
            // Build query
            let query = { ...filter };
            
            // Text search
            if (search) {
                query.$text = { $search: search };
            }
            
            // Price range
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = parseFloat(minPrice);
                if (maxPrice) query.price.$lte = parseFloat(maxPrice);
            }
            
            // Additional filters
            if (condition) query.condition = condition;
            if (language) query.language = language;
            
            // Execute query with optimization
            const products = await Product.find(query)
                .populate('category', 'name slug')
                .populate('seller', 'username sellerProfile.businessName')
                .select('title author price images rating stock condition isActive isFeatured createdAt')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();
            
            // Get total count for pagination
            const total = await Product.countDocuments(query);
            
            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;
            
            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems: total,
                        itemsPerPage: limit,
                        hasNextPage,
                        hasPrevPage
                    }
                }
            });
        } catch (error) {
            console.error('Get products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch products',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

// Get featured products with caching
router.get('/featured', 
    cacheMiddleware(600), // Cache for 10 minutes
    async (req, res) => {
        try {
            const products = await Product.find({
                isFeatured: true,
                isActive: true,
                status: 'approved'
            })
            .populate('category', 'name slug')
            .populate('seller', 'username sellerProfile.businessName')
            .select('title author price images rating stock condition')
            .sort({ 'rating.average': -1, createdAt: -1 })
            .limit(12)
            .lean();
            
            res.json({
                success: true,
                data: { products }
            });
        } catch (error) {
            console.error('Get featured products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch featured products'
            });
        }
    }
);

// Get single product with caching and view tracking
router.get('/:id', 
    optionalAuth,
    cacheMiddleware(300),
    async (req, res) => {
        try {
            const product = await Product.findById(req.params.id)
                .populate('category', 'name slug description')
                .populate('seller', 'username sellerProfile.businessName sellerProfile.description')
                .populate({
                    path: 'reviews',
                    populate: {
                        path: 'user',
                        select: 'username profile.firstName profile.lastName'
                    },
                    options: { sort: { createdAt: -1 }, limit: 10 }
                })
                .lean();
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            // Increment view count (async, don't wait)
            Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
                .catch(err => console.error('View increment error:', err));
            
            res.json({
                success: true,
                data: { product }
            });
        } catch (error) {
            console.error('Get product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch product'
            });
        }
    }
);

// Get product categories with caching
router.get('/categories', 
    cacheMiddleware(1800), // Cache for 30 minutes
    async (req, res) => {
        try {
            const categories = await Category.find({ isActive: true })
                .select('name slug description isFeatured sortOrder')
                .sort({ sortOrder: 1, name: 1 })
                .lean();
            
            res.json({
                success: true,
                data: { categories }
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories'
            });
        }
    }
);

// Search products with advanced features
router.get('/search/advanced', 
    queryOptimization(Product, {
        defaultLimit: 20,
        maxLimit: 50,
        allowedSorts: ['price', 'rating.average', 'createdAt', 'title'],
        allowedFilters: ['category', 'condition', 'language']
    }),
    cacheMiddleware(180), // Cache for 3 minutes
    async (req, res) => {
        try {
            const { 
                q, 
                category, 
                minPrice, 
                maxPrice, 
                condition, 
                language,
                sortBy = 'relevance'
            } = req.query;
            
            const { page, limit, skip } = req.queryParams;
            
            // Build search query
            let query = { isActive: true, status: 'approved' };
            
            // Text search with scoring
            if (q) {
                query.$text = { $search: q };
            }
            
            // Category filter
            if (category) {
                query.category = category;
            }
            
            // Price range
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = parseFloat(minPrice);
                if (maxPrice) query.price.$lte = parseFloat(maxPrice);
            }
            
            // Additional filters
            if (condition) query.condition = condition;
            if (language) query.language = language;
            
            // Build sort object
            let sort = {};
            switch (sortBy) {
                case 'price_asc':
                    sort.price = 1;
                    break;
                case 'price_desc':
                    sort.price = -1;
                    break;
                case 'rating':
                    sort['rating.average'] = -1;
                    break;
                case 'newest':
                    sort.createdAt = -1;
                    break;
                case 'oldest':
                    sort.createdAt = 1;
                    break;
                case 'relevance':
                default:
                    if (q) {
                        sort.score = { $meta: 'textScore' };
                    } else {
                        sort.createdAt = -1;
                    }
                    break;
            }
            
            // Execute search
            const products = await Product.find(query)
                .populate('category', 'name slug')
                .populate('seller', 'username sellerProfile.businessName')
                .select('title author price images rating stock condition')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();
            
            const total = await Product.countDocuments(query);
            
            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit
                    },
                    searchInfo: {
                        query: q,
                        filters: { category, minPrice, maxPrice, condition, language },
                        sortBy
                    }
                }
            });
        } catch (error) {
            console.error('Advanced search error:', error);
            res.status(500).json({
                success: false,
                message: 'Search failed'
            });
        }
    }
);

// Create product (Seller only)
router.post('/', 
    auth, 
    approvedSeller, 
    validateProduct,
    async (req, res) => {
        try {
            const productData = {
                ...req.body,
                seller: req.user._id
            };
            
            const product = new Product(productData);
            await product.save();
            
            // Clear related caches
            await cache.clearPattern('cache:/api/products*');
            await cache.clearPattern('cache:/api/products/categories*');
            
            res.status(201).json({
                success: true,
                message: 'Product created successfully',
                data: { product }
            });
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create product',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
);

// Update product (Seller only)
router.put('/:id', 
    auth, 
    approvedSeller,
    async (req, res) => {
        try {
            const product = await Product.findOneAndUpdate(
                { _id: req.params.id, seller: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found or access denied'
                });
            }
            
            // Clear related caches
            await cache.clearPattern('cache:/api/products*');
            
            res.json({
                success: true,
                message: 'Product updated successfully',
                data: { product }
            });
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update product'
            });
        }
    }
);

// Delete product (Seller only)
router.delete('/:id', 
    auth, 
    approvedSeller,
    async (req, res) => {
        try {
            const product = await Product.findOneAndDelete({
                _id: req.params.id,
                seller: req.user._id
            });
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found or access denied'
                });
            }
            
            // Clear related caches
            await cache.clearPattern('cache:/api/products*');
            
            res.json({
                success: true,
                message: 'Product deleted successfully'
            });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete product'
            });
        }
    }
);

// Get seller's products
router.get('/seller/my-products', 
    auth, 
    approvedSeller,
    queryOptimization(Product, {
        defaultLimit: 20,
        maxLimit: 100,
        allowedSorts: ['createdAt', 'title', 'price', 'status'],
        allowedFilters: ['status', 'isActive', 'isFeatured']
    }),
    async (req, res) => {
        try {
            const { page, limit, skip, sort, filter } = req.queryParams;
            
            const query = {
                seller: req.user._id,
                ...filter
            };
            
            const products = await Product.find(query)
                .populate('category', 'name slug')
                .select('title author price images rating stock status isActive isFeatured createdAt')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean();
            
            const total = await Product.countDocuments(query);
            
            res.json({
                success: true,
                data: {
                    products,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit
                    }
                }
            });
        } catch (error) {
            console.error('Get seller products error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch seller products'
            });
        }
    }
);

module.exports = router;
