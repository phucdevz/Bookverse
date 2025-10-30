const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Product title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
        trim: true,
        maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    isbn: {
        type: String,
        trim: true,
        match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9X]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    originalPrice: {
        type: Number,
        min: [0, 'Original price cannot be negative']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Seller is required']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: String,
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0
    },
    condition: {
        type: String,
        enum: ['new', 'like_new', 'good', 'fair', 'poor'],
        default: 'new'
    },
    language: {
        type: String,
        default: 'Vietnamese',
        maxlength: [50, 'Language cannot exceed 50 characters']
    },
    publisher: {
        type: String,
        trim: true,
        maxlength: [100, 'Publisher name cannot exceed 100 characters']
    },
    publishYear: {
        type: Number,
        min: [1000, 'Invalid publish year'],
        max: [new Date().getFullYear() + 1, 'Invalid publish year']
    },
    pages: {
        type: Number,
        min: [1, 'Pages must be at least 1']
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            enum: ['cm', 'in'],
            default: 'cm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            enum: ['g', 'kg', 'lb'],
            default: 'g'
        }
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected', 'inactive'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    // SEO fields
    slug: {
        type: String
    },
    metaTitle: String,
    metaDescription: String,
    // Analytics
    views: {
        type: Number,
        default: 0
    },
    sales: {
        type: Number,
        default: 0
    },
    // Reviews summary
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
productSchema.index({ title: 'text', description: 'text', author: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isbn: 1 }, { unique: true, sparse: true });
productSchema.index({ slug: 1 }, { unique: true, sparse: true });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.originalPrice && this.originalPrice > this.price) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
    return this.stock > 0 && this.isActive && this.status === 'approved';
});

// Virtual populate for reviews
productSchema.virtual('reviews', {
	ref: 'Review',
	localField: '_id',
	foreignField: 'product'
});

// Generate slug before saving
productSchema.pre('save', function(next) {
    if (this.isModified('title') && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    next();
});

// Remove sensitive data when converting to JSON
productSchema.methods.toJSON = function() {
    const productObject = this.toObject();
    return productObject;
};

module.exports = mongoose.model('Product', productSchema);

