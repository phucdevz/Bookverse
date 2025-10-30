const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product is required']
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer is required']
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, 'Order is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        maxlength: [1000, 'Review comment cannot exceed 1000 characters']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String
    }],
    // Review helpfulness
    helpful: {
        count: {
            type: Number,
            default: 0
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    // Seller response
    sellerResponse: {
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Seller response cannot exceed 500 characters']
        },
        respondedAt: {
            type: Date
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    // Review status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'pending'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    // Review categories (for detailed ratings)
    detailedRatings: {
        quality: {
            type: Number,
            min: 1,
            max: 5
        },
        value: {
            type: Number,
            min: 1,
            max: 5
        },
        shipping: {
            type: Number,
            min: 1,
            max: 5
        },
        communication: {
            type: Number,
            min: 1,
            max: 5
        }
    },
    // Review moderation
    moderatedAt: Date,
    moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    moderationNote: String,
    // Review analytics
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    dislikes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for better performance
reviewSchema.index({ product: 1 });
reviewSchema.index({ customer: 1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

// Ensure one review per customer per product
reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

// Virtual for review summary
reviewSchema.virtual('summary').get(function() {
    return {
        isPositive: this.rating >= 4,
        isNegative: this.rating <= 2,
        isNeutral: this.rating === 3,
        hasImages: this.images && this.images.length > 0,
        hasSellerResponse: !!this.sellerResponse.comment
    };
});

// Update product rating when review is saved
reviewSchema.post('save', async function() {
    if (this.status === 'approved') {
        await this.constructor.updateProductRating(this.product);
    }
});

// Update product rating when review is deleted
reviewSchema.post('deleteOne', async function() {
    await this.constructor.updateProductRating(this.product);
});

// Static method to update product rating
reviewSchema.statics.updateProductRating = async function(productId) {
    const stats = await this.aggregate([
        { $match: { product: productId, status: 'approved' } },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            'rating.average': Math.round(stats[0].averageRating * 10) / 10,
            'rating.count': stats[0].totalReviews
        });
    } else {
        await mongoose.model('Product').findByIdAndUpdate(productId, {
            'rating.average': 0,
            'rating.count': 0
        });
    }
};

// Remove sensitive data when converting to JSON
reviewSchema.methods.toJSON = function() {
    const reviewObject = this.toObject();
    
    // Hide customer info if anonymous
    if (this.isAnonymous) {
        delete reviewObject.customer;
    }
    
    return reviewObject;
};

module.exports = mongoose.model('Review', reviewSchema);

