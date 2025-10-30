const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    level: {
        type: Number,
        default: 0,
        min: 0,
        max: 3
    },
    path: {
        type: String,
        required: true
    },
    image: {
        url: String,
        alt: String
    },
    icon: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true,
        match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    // SEO fields
    metaTitle: {
        type: String,
        trim: true,
        maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
        type: String,
        trim: true,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
        type: String,
        trim: true,
        maxlength: [30, 'Keyword cannot exceed 30 characters']
    }],
    // Analytics
    productCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    // Category rules
    minPrice: {
        type: Number,
        min: [0, 'Minimum price cannot be negative']
    },
    maxPrice: {
        type: Number,
        min: [0, 'Maximum price cannot be negative']
    },
    requiredFields: [{
        type: String,
        enum: ['author', 'publisher', 'isbn', 'publishYear', 'pages', 'language']
    }],
    // Category settings
    allowSubcategories: {
        type: Boolean,
        default: true
    },
    maxSubcategoryLevel: {
        type: Number,
        default: 2,
        min: 0,
        max: 3
    }
}, {
    timestamps: true
});

// Indexes for better performance
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ sortOrder: 1 });

// Generate slug before saving
categorySchema.pre('save', function(next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }
    next();
});

// Generate path before saving
categorySchema.pre('save', async function(next) {
    if (this.isModified('parent') || this.isNew) {
        if (this.parent) {
            const parentCategory = await this.constructor.findById(this.parent);
            if (parentCategory) {
                this.level = parentCategory.level + 1;
                this.path = `${parentCategory.path}/${this.slug}`;
            } else {
                this.level = 0;
                this.path = this.slug;
            }
        } else {
            this.level = 0;
            this.path = this.slug;
        }
    }
    next();
});

// Update product count when category is used
categorySchema.methods.updateProductCount = async function() {
    const count = await mongoose.model('Product').countDocuments({ 
        category: this._id, 
        isActive: true 
    });
    this.productCount = count;
    await this.save();
};

// Get all subcategories
categorySchema.methods.getSubcategories = async function() {
    return await this.constructor.find({
        path: { $regex: `^${this.path}/` },
        isActive: true
    }).sort({ sortOrder: 1, name: 1 });
};

// Get all parent categories
categorySchema.methods.getParentCategories = async function() {
    if (!this.parent) return [];
    
    const parents = [];
    let currentParent = await this.constructor.findById(this.parent);
    
    while (currentParent) {
        parents.unshift(currentParent);
        currentParent = currentParent.parent ? 
            await this.constructor.findById(currentParent.parent) : null;
    }
    
    return parents;
};

// Virtual for full category path
categorySchema.virtual('fullPath').get(function() {
    return this.path;
});

// Virtual for breadcrumb
categorySchema.virtual('breadcrumb').get(async function() {
    const parents = await this.getParentCategories();
    return [...parents, this];
});

// Remove sensitive data when converting to JSON
categorySchema.methods.toJSON = function() {
    const categoryObject = this.toObject();
    return categoryObject;
};

module.exports = mongoose.model('Category', categorySchema);

