const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'commission', 'refund'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    method: {
        type: String,
        enum: ['bank_transfer', 'cash', 'online_payment'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    transactionId: {
        type: String
    },
    // For seller payments
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For order-related payments
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    // Commission details
    commission: {
        amount: {
            type: Number,
            default: 0
        },
        rate: {
            type: Number,
            default: 0.02 // 2%
        }
    },
    // Bank account details for seller
    bankAccount: {
        bankName: String,
        accountNumber: String,
        accountHolder: String
    },
    // Admin approval
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    notes: String
}, {
    timestamps: true
});

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ seller: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

// Virtual for commission calculation
paymentSchema.virtual('commissionAmount').get(function() {
    if (this.type === 'commission' && this.amount) {
        return this.amount * this.commission.rate;
    }
    return 0;
});

// Methods
paymentSchema.methods.approve = function(adminId) {
    this.status = 'completed';
    this.approvedBy = adminId;
    this.approvedAt = new Date();
    return this.save();
};

paymentSchema.methods.reject = function(adminId, reason) {
    this.status = 'failed';
    this.approvedBy = adminId;
    this.approvedAt = new Date();
    this.notes = reason;
    return this.save();
};

// Static methods
paymentSchema.statics.createDeposit = function(userId, amount, method, description) {
    return this.create({
        user: userId,
        amount: amount,
        type: 'deposit',
        method: method,
        description: description,
        status: 'pending'
    });
};

paymentSchema.statics.createSellerPayment = function(sellerId, amount, orderId, bankAccount) {
    return this.create({
        seller: sellerId,
        amount: amount,
        type: 'withdrawal',
        method: 'bank_transfer',
        order: orderId,
        bankAccount: bankAccount,
        description: `Thanh toán cho đơn hàng #${orderId}`,
        status: 'pending'
    });
};

paymentSchema.statics.createCommission = function(orderId, amount) {
    return this.create({
        type: 'commission',
        amount: amount,
        order: orderId,
        description: `Hoa hồng 2% từ đơn hàng #${orderId}`,
        status: 'completed',
        commission: {
            amount: amount * 0.02,
            rate: 0.02
        }
    });
};

module.exports = mongoose.model('Payment', paymentSchema);
