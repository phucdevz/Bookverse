const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer is required']
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        },
        total: {
            type: Number,
            required: true,
            min: [0, 'Total cannot be negative']
        }
    }],
    shippingAddress: {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters']
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true
        },
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true,
            maxlength: [200, 'Street address cannot exceed 200 characters']
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
            maxlength: [50, 'City cannot exceed 50 characters']
        },
        state: {
            type: String,
            required: [true, 'State/Province is required'],
            trim: true,
            maxlength: [50, 'State cannot exceed 50 characters']
        },
        zipCode: {
            type: String,
            required: [true, 'ZIP code is required'],
            trim: true,
            maxlength: [20, 'ZIP code cannot exceed 20 characters']
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
            maxlength: [50, 'Country cannot exceed 50 characters'],
            default: 'Vietnam'
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['cod', 'bank_transfer', 'credit_card', 'paypal'],
            required: [true, 'Payment method is required']
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending'
        },
        transactionId: String,
        paidAt: Date,
        refundedAt: Date,
        refundAmount: Number
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    shipping: {
        cost: {
            type: Number,
            default: 0,
            min: [0, 'Shipping cost cannot be negative']
        },
        method: {
            type: String,
            enum: ['standard', 'express', 'overnight'],
            default: 'standard'
        },
        trackingNumber: String,
        carrier: String,
        estimatedDelivery: Date,
        shippedAt: Date,
        deliveredAt: Date
    },
    tax: {
        rate: {
            type: Number,
            default: 0,
            min: [0, 'Tax rate cannot be negative'],
            max: [1, 'Tax rate cannot exceed 100%']
        },
        amount: {
            type: Number,
            default: 0,
            min: [0, 'Tax amount cannot be negative']
        }
    },
    discount: {
        code: String,
        amount: {
            type: Number,
            default: 0,
            min: [0, 'Discount amount cannot be negative']
        },
        percentage: {
            type: Number,
            default: 0,
            min: [0, 'Discount percentage cannot be negative'],
            max: [1, 'Discount percentage cannot exceed 100%']
        }
    },
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    },
    notes: {
        customer: String,
        seller: String,
        admin: String
    },
    // Order tracking
    statusHistory: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    // Cancellation
    cancelledAt: Date,
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellationReason: String,
    // Return/Refund
    returnRequested: {
        type: Boolean,
        default: false
    },
    returnRequestedAt: Date,
    returnReason: String,
    returnStatus: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'returned'],
        default: 'none'
    }
}, {
    timestamps: true
});

// Indexes for better performance
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customer: 1 });
orderSchema.index({ 'items.seller': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const count = await this.constructor.countDocuments();
        this.orderNumber = `BV${Date.now().toString().slice(-8)}${(count + 1).toString().padStart(4, '0')}`;
    }
    next();
});

// Calculate totals before saving
orderSchema.pre('save', function(next) {
    // Calculate item totals
    this.items.forEach(item => {
        item.total = item.quantity * item.price;
    });
    
    // Calculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
    
    // Calculate tax
    this.tax.amount = this.subtotal * this.tax.rate;
    
    // Calculate total
    this.total = this.subtotal + this.shipping.cost + this.tax.amount - this.discount.amount;
    
    // Ensure total is not negative
    if (this.total < 0) {
        this.total = 0;
    }
    
    next();
});

// Add status to history when status changes
orderSchema.pre('save', function(next) {
    if (this.isModified('status')) {
        this.statusHistory.push({
            status: this.status,
            timestamp: new Date(),
            note: `Status changed to ${this.status}`
        });
    }
    next();
});

// Virtual for order summary
orderSchema.virtual('summary').get(function() {
    return {
        itemCount: this.items.length,
        totalQuantity: this.items.reduce((sum, item) => sum + item.quantity, 0),
        uniqueSellers: [...new Set(this.items.map(item => item.seller.toString()))].length
    };
});

// Remove sensitive data when converting to JSON
orderSchema.methods.toJSON = function() {
    const orderObject = this.toObject();
    return orderObject;
};

module.exports = mongoose.model('Order', orderSchema);

