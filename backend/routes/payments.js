const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth, admin, seller } = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

// Get user's payment history
router.get('/history', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, type, status } = req.query;
        const query = { user: req.user.id };
        
        if (type) query.type = type;
        if (status) query.status = status;
        
        const payments = await Payment.find(query)
            .populate('order', 'orderNumber totalAmount')
            .populate('seller', 'username profile.firstName profile.lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Payment.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán',
            error: error.message
        });
    }
});

// Get user's wallet balance
router.get('/balance', auth, async (req, res) => {
    try {
        const balance = await Transaction.getUserBalance(req.user.id);
        
        res.json({
            success: true,
            data: { balance }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy số dư ví',
            error: error.message
        });
    }
});

// Deposit money to wallet
router.post('/deposit', [
    auth,
    body('amount').isNumeric().withMessage('Số tiền phải là số'),
    body('amount').isFloat({ min: 1000 }).withMessage('Số tiền tối thiểu là 1,000 VND'),
    body('method').isIn(['bank_transfer', 'cash']).withMessage('Phương thức thanh toán không hợp lệ'),
    body('description').optional().isString().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }
        
        const { amount, method, description } = req.body;
        
        // Create payment record
        const payment = await Payment.createDeposit(
            req.user.id,
            amount,
            method,
            description || `Nạp tiền vào ví - ${method}`
        );
        
        res.json({
            success: true,
            message: 'Yêu cầu nạp tiền đã được gửi, chờ admin xử lý',
            data: { payment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo yêu cầu nạp tiền',
            error: error.message
        });
    }
});

// Seller: Add/Update bank account
router.post('/bank-account', [
    seller,
    body('bankName').notEmpty().withMessage('Tên ngân hàng là bắt buộc'),
    body('accountNumber').notEmpty().withMessage('Số tài khoản là bắt buộc'),
    body('accountHolder').notEmpty().withMessage('Tên chủ tài khoản là bắt buộc'),
    body('branch').optional().isString().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ',
                errors: errors.array()
            });
        }
        
        const { bankName, accountNumber, accountHolder, branch } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        // Update bank account info
        user.sellerProfile.bankAccount = {
            bankName,
            accountNumber,
            accountHolder,
            branch,
            isVerified: false
        };
        
        await user.save();
        
        res.json({
            success: true,
            message: 'Thông tin tài khoản ngân hàng đã được cập nhật, chờ admin xác minh',
            data: { bankAccount: user.sellerProfile.bankAccount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật tài khoản ngân hàng',
            error: error.message
        });
    }
});

// Seller: Get bank account info
router.get('/bank-account', seller, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }
        
        res.json({
            success: true,
            data: { bankAccount: user.sellerProfile.bankAccount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin tài khoản ngân hàng',
            error: error.message
        });
    }
});

// Seller: Get payment history
router.get('/seller/payments', seller, async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { seller: req.user.id };
        
        if (status) query.status = status;
        
        const payments = await Payment.find(query)
            .populate('order', 'orderNumber totalAmount')
            .populate('user', 'username profile.firstName profile.lastName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Payment.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử thanh toán',
            error: error.message
        });
    }
});

// Admin: Get all pending payments
router.get('/admin/pending', admin, async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        const query = { status: 'pending' };
        
        if (type) query.type = type;
        
        const payments = await Payment.find(query)
            .populate('user', 'username email profile.firstName profile.lastName')
            .populate('seller', 'username email profile.firstName profile.lastName')
            .populate('order', 'orderNumber totalAmount')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Payment.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                payments,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thanh toán chờ xử lý',
            error: error.message
        });
    }
});

// Admin: Approve deposit
router.post('/admin/approve-deposit/:paymentId', [
    admin,
    body('notes').optional().isString().trim()
], async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { notes } = req.body;
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }
        
        if (payment.type !== 'deposit') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể duyệt giao dịch nạp tiền'
            });
        }
        
        if (payment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Giao dịch đã được xử lý'
            });
        }
        
        // Approve payment
        await payment.approve(req.user.id);
        
        // Create transaction record
        await Transaction.createDeposit(
            payment.user,
            payment.amount,
            `Nạp tiền vào ví - ${payment.method}`,
            payment._id
        );
        
        // Update user wallet balance
        const user = await User.findById(payment.user);
        if (user) {
            user.wallet.balance += payment.amount;
            await user.save();
        }
        
        res.json({
            success: true,
            message: 'Đã duyệt nạp tiền thành công',
            data: { payment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt nạp tiền',
            error: error.message
        });
    }
});

// Admin: Approve seller payment
router.post('/admin/approve-seller-payment/:paymentId', [
    admin,
    body('notes').optional().isString().trim()
], async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { notes } = req.body;
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }
        
        if (payment.type !== 'withdrawal') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể duyệt thanh toán cho seller'
            });
        }
        
        if (payment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Giao dịch đã được xử lý'
            });
        }
        
        // Approve payment
        await payment.approve(req.user.id);
        
        // Create transaction record
        await Transaction.createSellerWithdrawal(
            payment.seller,
            payment.amount,
            payment.order,
            `Thanh toán cho đơn hàng #${payment.order}`
        );
        
        res.json({
            success: true,
            message: 'Đã duyệt thanh toán cho seller thành công',
            data: { payment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt thanh toán cho seller',
            error: error.message
        });
    }
});

// Admin: Reject payment
router.post('/admin/reject/:paymentId', [
    admin,
    body('reason').notEmpty().withMessage('Lý do từ chối là bắt buộc')
], async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { reason } = req.body;
        
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giao dịch'
            });
        }
        
        if (payment.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Giao dịch đã được xử lý'
            });
        }
        
        // Reject payment
        await payment.reject(req.user.id, reason);
        
        res.json({
            success: true,
            message: 'Đã từ chối giao dịch',
            data: { payment }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối giao dịch',
            error: error.message
        });
    }
});

// Admin: Get commission statistics
router.get('/admin/commission-stats', admin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = { type: 'commission' };
        
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const commissions = await Payment.find(query)
            .populate('order', 'orderNumber totalAmount')
            .sort({ createdAt: -1 });
            
        const totalCommission = commissions.reduce((sum, commission) => {
            return sum + commission.commission.amount;
        }, 0);
        
        res.json({
            success: true,
            data: {
                commissions,
                totalCommission,
                count: commissions.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hoa hồng',
            error: error.message
        });
    }
});

module.exports = router;
