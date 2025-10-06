const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const { auth, admin } = require('../middlewares/auth');
const { validateObjectId, validateQuery, validateCategory } = require('../middlewares/validation');

const router = express.Router();

// Apply admin middleware to all routes
router.use(auth, admin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalUsers,
            totalSellers,
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue,
            recentUsers,
            recentOrders
        ] = await Promise.all([
            User.countDocuments({ role: 'user', isActive: true }),
            User.countDocuments({ role: 'seller', isActive: true }),
            Product.countDocuments({ isActive: true }),
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.aggregate([
                { $match: { status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ]),
            User.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('username email role createdAt'),
            Order.find()
                .populate('customer', 'username profile.firstName profile.lastName')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    totalSellers,
                    totalProducts,
                    totalOrders,
                    pendingOrders,
                    totalRevenue: revenue
                },
                recentUsers,
                recentOrders
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        const query = { isActive: true };
        
        // Role filter
        if (req.query.role) {
            query.role = req.query.role;
        }

        // Search filter
        if (req.query.search) {
            query.$or = [
                { username: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        const users = await User.find(query)
            .select('-password')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status
// @access  Private (Admin)
router.put('/users/:id/status', validateObjectId(), async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User status updated successfully',
            data: {
                user
            }
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/admin/sellers/pending
// @desc    Get pending seller applications
// @access  Private (Admin)
router.get('/sellers/pending', validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            role: 'seller',
            'sellerProfile.isApproved': false,
            isActive: true
        };

        const sellers = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: {
                sellers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get pending sellers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pending sellers',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/admin/sellers/:id/approve
// @desc    Approve seller application
// @access  Private (Admin)
router.put('/sellers/:id/approve', validateObjectId(), async (req, res) => {
    try {
        const { approved, note } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        if (user.role !== 'seller') {
            return res.status(400).json({
                success: false,
                message: 'User is not a seller'
            });
        }

        user.sellerProfile.isApproved = approved;
        user.sellerProfile.approvedAt = new Date();
        user.sellerProfile.approvedBy = req.user._id;

        if (note) {
            user.sellerProfile.note = note;
        }

        await user.save();

        res.json({
            success: true,
            message: `Seller application ${approved ? 'approved' : 'rejected'} successfully`,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Approve seller error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve seller',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/admin/products
// @desc    Get all products for admin
// @access  Private (Admin)
router.get('/products', validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        const query = {};
        
        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Active filter
        if (req.query.isActive !== undefined) {
            query.isActive = req.query.isActive === 'true';
        }

        // Search filter
        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { author: { $regex: req.query.search, $options: 'i' } }
            ];
        }

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
        console.error('Get admin products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get products',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/admin/products/:id/status
// @desc    Update product status
// @access  Private (Admin)
router.put('/products/:id/status', validateObjectId(), async (req, res) => {
    try {
        const { status, note } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.status = status;
        
        if (note) {
            product.adminNote = note;
        }

        await product.save();

        res.json({
            success: true,
            message: 'Product status updated successfully',
            data: {
                product: product.toJSON()
            }
        });
    } catch (error) {
        console.error('Update product status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/admin/orders
// @desc    Get all orders for admin
// @access  Private (Admin)
router.get('/orders', validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        const query = {};
        
        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Payment status filter
        if (req.query.paymentStatus) {
            query['payment.status'] = req.query.paymentStatus;
        }

        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        const orders = await Order.find(query)
            .populate('customer', 'username profile.firstName profile.lastName')
            .populate('items.product', 'title author images price')
            .populate('items.seller', 'username profile.firstName profile.lastName sellerProfile.businessName')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Private (Admin)
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find()
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

// @route   POST /api/admin/categories
// @desc    Create new category
// @access  Private (Admin)
router.post('/categories', validateCategory, async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                category: category.toJSON()
            }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            message: 'Category creation failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update category
// @access  Private (Admin)
router.put('/categories/:id', validateObjectId(), validateCategory, async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: {
                category: category.toJSON()
            }
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            message: 'Category update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category
// @access  Private (Admin)
router.delete('/categories/:id', validateObjectId(), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Check if category has products
        const productCount = await Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with products. Please move or delete products first.'
            });
        }

        // Check if category has subcategories
        const subcategoryCount = await Category.countDocuments({ parent: category._id });
        if (subcategoryCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with subcategories. Please delete subcategories first.'
            });
        }

        await Category.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            message: 'Category deletion failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;


