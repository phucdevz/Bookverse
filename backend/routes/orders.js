const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { auth, resourceOwner } = require('../middlewares/auth');
const { validateOrder, validateObjectId, validateQuery } = require('../middlewares/validation');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, validateOrder, async (req, res) => {
    try {
        const { items, shippingAddress, payment } = req.body;

        // Validate products and calculate totals
        let subtotal = 0;
        const validatedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product with ID ${item.product} not found`
                });
            }

            if (!product.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Product "${product.title}" is not available`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product "${product.title}". Available: ${product.stock}`
                });
            }

            const itemTotal = item.quantity * product.price;
            subtotal += itemTotal;

            validatedItems.push({
                product: product._id,
                seller: product.seller,
                quantity: item.quantity,
                price: product.price,
                total: itemTotal
            });
        }

        // Create order
        const order = new Order({
            customer: req.user._id,
            items: validatedItems,
            shippingAddress,
            payment,
            subtotal,
            total: subtotal // Will be calculated with shipping and tax in pre-save
        });

        await order.save();

        // Update product stock
        for (const item of validatedItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity, sales: item.quantity }
            });
        }

        await order.populate('items.product', 'title author images price');
        await order.populate('items.seller', 'username profile.firstName profile.lastName sellerProfile.businessName');

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: order.toJSON()
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Order creation failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        const query = { customer: req.user._id };
        
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
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, validateObjectId(), resourceOwner(Order), async (req, res) => {
    try {
        await req.resource.populate('items.product', 'title author images price');
        await req.resource.populate('items.seller', 'username profile.firstName profile.lastName sellerProfile.businessName');

        res.json({
            success: true,
            data: {
                order: req.resource.toJSON()
            }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', auth, validateObjectId(), resourceOwner(Order), async (req, res) => {
    try {
        const { status, note } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Check if user can update status
        const order = req.resource;
        
        // Only customer can cancel, only seller can update other statuses
        if (status === 'cancelled') {
            if (order.customer.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Only the customer can cancel an order'
                });
            }
            
            if (['shipped', 'delivered'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel order that has been shipped or delivered'
                });
            }
        } else {
            // Check if user is seller of any item in the order
            const isSeller = order.items.some(item => 
                item.seller.toString() === req.user._id.toString()
            );
            
            if (!isSeller && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only sellers can update order status'
                });
            }
        }

        order.status = status;
        if (note) {
            order.statusHistory.push({
                status,
                timestamp: new Date(),
                note,
                updatedBy: req.user._id
            });
        }

        // Set specific timestamps
        if (status === 'shipped') {
            order.shipping.shippedAt = new Date();
        } else if (status === 'delivered') {
            order.shipping.deliveredAt = new Date();
        } else if (status === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancelledBy = req.user._id;
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                order: order.toJSON()
            }
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Order status update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/orders/seller/my-orders
// @desc    Get seller's orders
// @access  Private (Seller)
router.get('/seller/my-orders', auth, validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const sort = req.query.sort || 'createdAt';
        const order = req.query.order || 'desc';

        const query = {
            'items.seller': req.user._id
        };
        
        // Status filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        const orders = await Order.find(query)
            .populate('customer', 'username profile.firstName profile.lastName')
            .populate('items.product', 'title author images price')
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
        console.error('Get seller orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get seller orders',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/orders/:id/tracking
// @desc    Add tracking information
// @access  Private (Seller)
router.post('/:id/tracking', auth, validateObjectId(), async (req, res) => {
    try {
        const { trackingNumber, carrier, estimatedDelivery } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user is seller of any item in the order
        const isSeller = order.items.some(item => 
            item.seller.toString() === req.user._id.toString()
        );

        if (!isSeller && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only sellers can add tracking information'
            });
        }

        order.shipping.trackingNumber = trackingNumber;
        order.shipping.carrier = carrier;
        order.shipping.estimatedDelivery = estimatedDelivery;

        await order.save();

        res.json({
            success: true,
            message: 'Tracking information added successfully',
            data: {
                order: order.toJSON()
            }
        });
    } catch (error) {
        console.error('Add tracking error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add tracking information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;

