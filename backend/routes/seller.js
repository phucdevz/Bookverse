const express = require('express');
const router = express.Router();
const { auth, seller } = require('../middlewares/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// Apply auth and seller middleware to all routes
router.use(auth, seller);

// @route   GET /api/seller/dashboard
// @desc    Get seller dashboard statistics
// @access  Private (Seller)
router.get('/dashboard', async (req, res) => {
    try {
        const sellerId = req.user._id;
        
        // Calculate date ranges for growth comparison
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        // Get total products (current)
        const totalProducts = await Product.countDocuments({ 
            seller: sellerId 
        });
        
        // Get products from last period (30-60 days ago)
        const productsLastPeriod = await Product.countDocuments({
            seller: sellerId,
            createdAt: { $lt: thirtyDaysAgo }
        });
        
        // Get active products
        const activeProducts = await Product.countDocuments({ 
            seller: sellerId,
            isActive: true,
            status: 'approved'
        });
        
        // Get pending products
        const pendingProducts = await Product.countDocuments({ 
            seller: sellerId,
            status: 'pending'
        });
        
        // Get orders from last 30 days
        const orders = await Order.find({
            'items.seller': sellerId,
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        // Get orders from previous 30 days (30-60 days ago)
        const ordersLastPeriod = await Order.find({
            'items.seller': sellerId,
            createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
        });
        
        const totalOrders = orders.length;
        const totalOrdersLastPeriod = ordersLastPeriod.length;
        
        // Calculate revenue for current period
        let totalRevenue = 0;
        let pendingRevenue = 0;
        let completedOrders = 0;
        let pendingOrders = 0;
        
        orders.forEach(order => {
            // Calculate seller's portion from this order
            const sellerItems = order.items.filter(item => 
                item.seller && item.seller.toString() === sellerId.toString()
            );
            
            const orderRevenue = sellerItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );
            
            totalRevenue += orderRevenue;
            
            if (order.status === 'delivered' || order.status === 'completed') {
                completedOrders++;
            } else if (order.status === 'pending' || order.status === 'processing') {
                pendingOrders++;
                pendingRevenue += orderRevenue;
            }
        });
        
        // Calculate revenue for last period
        let revenueLastPeriod = 0;
        ordersLastPeriod.forEach(order => {
            const sellerItems = order.items.filter(item => 
                item.seller && item.seller.toString() === sellerId.toString()
            );
            const orderRevenue = sellerItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );
            revenueLastPeriod += orderRevenue;
        });
        
        // Get recent orders (last 5)
        const recentOrders = await Order.find({
            'items.seller': sellerId
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customer', 'username email profile')
        .lean();
        
        // Format recent orders for frontend
        const formattedOrders = recentOrders.map(order => {
            const sellerItems = order.items.filter(item => 
                item.seller && item.seller.toString() === sellerId.toString()
            );
            
            const orderTotal = sellerItems.reduce((sum, item) => 
                sum + (item.price * item.quantity), 0
            );
            
            return {
                _id: order._id,
                orderNumber: order.orderNumber,
                customer: order.customer,
                total: orderTotal,
                status: order.status,
                createdAt: order.createdAt
            };
        });
        
        // Get low stock products
        const lowStockProducts = await Product.find({
            seller: sellerId,
            stock: { $lt: 10, $gt: 0 },
            isActive: true
        })
        .select('title stock price images')
        .limit(5);
        
        // Get out of stock products
        const outOfStockCount = await Product.countDocuments({
            seller: sellerId,
            stock: 0
        });
        
        // Get top selling products (based on order items)
        const topProducts = await Product.find({
            seller: sellerId,
            isActive: true
        })
        .sort({ soldCount: -1 })
        .limit(5)
        .select('title price images stock soldCount')
        .lean();
        
        // Calculate quick stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todayOrders = await Order.find({
            'items.seller': sellerId,
            createdAt: { $gte: today }
        });
        
        const weekOrders = await Order.find({
            'items.seller': sellerId,
            createdAt: { $gte: weekAgo }
        });
        
        const monthOrders = await Order.find({
            'items.seller': sellerId,
            createdAt: { $gte: monthAgo }
        });
        
        const calculateRevenue = (orders) => {
            return orders.reduce((total, order) => {
                const sellerItems = order.items.filter(item => 
                    item.seller && item.seller.toString() === sellerId.toString()
                );
                return total + sellerItems.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0
                );
            }, 0);
        };
        
        const todaySales = calculateRevenue(todayOrders);
        const weekSales = calculateRevenue(weekOrders);
        const monthSales = calculateRevenue(monthOrders);
        
        // Get sales chart data (last 30 days)
        const salesChartData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            const dayOrders = await Order.find({
                'items.seller': sellerId,
                createdAt: { $gte: date, $lt: nextDate }
            });
            
            const dayRevenue = calculateRevenue(dayOrders);
            salesChartData.push({
                date: date.toISOString().split('T')[0],
                revenue: dayRevenue,
                orders: dayOrders.length
            });
        }
        
        // Calculate growth percentages
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };
        
        const productsGrowth = calculateGrowth(totalProducts, productsLastPeriod);
        const ordersGrowth = calculateGrowth(totalOrders, totalOrdersLastPeriod);
        const revenueGrowth = calculateGrowth(totalRevenue, revenueLastPeriod);
        const pendingOrdersGrowth = calculateGrowth(pendingOrders, 
            ordersLastPeriod.filter(o => o.status === 'pending' || o.status === 'processing').length
        );
        
        res.json({
            success: true,
            data: {
                stats: {
                    totalProducts,
                    activeProducts,
                    pendingProducts,
                    totalOrders,
                    completedOrders,
                    pendingOrders,
                    totalRevenue,
                    pendingRevenue,
                    outOfStockCount
                },
                growth: {
                    products: productsGrowth,
                    orders: ordersGrowth,
                    revenue: revenueGrowth,
                    pendingOrders: pendingOrdersGrowth
                },
                quickStats: {
                    todaySales,
                    weekSales,
                    monthSales
                },
                recentOrders: formattedOrders,
                lowStockProducts,
                topProducts,
                salesChartData
            }
        });
    } catch (error) {
        console.error('Get seller dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;

