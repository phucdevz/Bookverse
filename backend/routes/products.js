const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, seller, approvedSeller, optionalAuth } = require('../middlewares/auth');
const { validateProduct, validateObjectId, validateQuery } = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', validateQuery, optionalAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        // Build query
        const query = {
            isActive: true,
            status: 'approved'
        };

        // Category filter
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Price range filter
        if (req.query.minPrice) {
            query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
        }
        if (req.query.maxPrice) {
            query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
        }

        // Search filter
        if (req.query.search) {
            query.$text = { $search: req.query.search };
        }

        // Condition filter
        if (req.query.condition) {
            query.condition = req.query.condition;
        }

        // Language filter
        if (req.query.language) {
            query.language = req.query.language;
        }

        // Seller filter
        if (req.query.seller) {
            query.seller = req.query.seller;
        }

        // Featured filter
        if (req.query.featured === 'true') {
            query.isFeatured = true;
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        const products = await Product.find(query)
            .populate('category', 'name slug')
            .populate('seller', 'username profile.firstName profile.lastName sellerProfile.businessName')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/products/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ sortOrder: 1, name: 1 });

        res.json({
            success: true,
            data: {
                categories
            }
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get categories',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;

        const products = await Product.find({
            isActive: true,
            status: 'approved',
            isFeatured: true
        })
        .populate('category', 'name slug')
        .populate('seller', 'username profile.firstName profile.lastName sellerProfile.businessName')
        .sort({ createdAt: -1 })
        .limit(limit);

        res.json({
            success: true,
            data: {
                products
            }
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get featured products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Public
router.get('/:id', validateObjectId(), optionalAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name slug')
            .populate('seller', 'username profile.firstName profile.lastName sellerProfile.businessName')
            .populate({
                path: 'reviews',
                populate: {
                    path: 'customer',
                    select: 'username profile.firstName profile.lastName'
                }
            });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Increment view count
        product.views += 1;
        await product.save();

        res.json({
            success: true,
            data: {
                product: product.toJSON()
            }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get product',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Seller)
router.post('/', auth, approvedSeller, validateProduct, async (req, res) => {
    try {
        const productData = {
            ...req.body,
            seller: req.user._id
        };

        const product = new Product(productData);
        await product.save();

        await product.populate('category', 'name slug');
        await product.populate('seller', 'username profile.firstName profile.lastName sellerProfile.businessName');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: {
                product: product.toJSON()
            }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Product creation failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Seller/Owner)
router.put('/:id', auth, validateObjectId(), validateProduct, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user owns the product or is admin
        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own products.'
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('category', 'name slug')
         .populate('seller', 'username profile.firstName profile.lastName sellerProfile.businessName');

        res.json({
            success: true,
            message: 'Product updated successfully',
            data: {
                product: updatedProduct.toJSON()
            }
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Product update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Seller/Owner)
router.delete('/:id', auth, validateObjectId(), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Check if user owns the product or is admin
        if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own products.'
            });
        }

        // Soft delete - deactivate product
        product.isActive = false;
        await product.save();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Product deletion failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/products/seller/my-products
// @desc    Get seller's products
// @access  Private (Seller)
router.get('/seller/my-products', auth, approvedSeller, validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        const query = { seller: req.user._id };
        
        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Active filter
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }

        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        const products = await Product.find(query)
            .populate('category', 'name slug')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get seller products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;

