const express = require('express');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const { validateUser, validateObjectId, validateQuery } = require('../middlewares/validation');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { profile } = req.body;
        const allowedFields = ['firstName', 'lastName', 'phone', 'address'];

        // Filter only allowed fields
        const updateData = {};
        if (profile) {
            allowedFields.forEach(field => {
                if (profile[field] !== undefined) {
                    updateData[`profile.${field}`] = profile[field];
                }
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Profile update failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (public info only)
// @access  Public
router.get('/:id', validateObjectId(), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -email -phone');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Soft delete - deactivate account
        user.isActive = false;
        await user.save();

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Account deletion failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/users/become-seller
// @desc    Request to become a seller
// @access  Private
router.post('/become-seller', auth, async (req, res) => {
    try {
        const { businessName, businessType, businessLicense, taxId, description } = req.body;

        // Check if user is already a seller
        if (req.user.role === 'seller' || req.user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'User is already a seller'
            });
        }

        // Update user with seller profile
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                role: 'seller',
                sellerProfile: {
                    businessName,
                    businessType: businessType || 'individual',
                    businessLicense,
                    taxId,
                    description,
                    isApproved: false
                }
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Seller application submitted successfully. Waiting for approval.',
            data: {
                user: user.toJSON()
            }
        });
    } catch (error) {
        console.error('Become seller error:', error);
        res.status(500).json({
            success: false,
            message: 'Seller application failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/users/sellers
// @desc    Get all sellers (public info)
// @access  Public
router.get('/sellers', validateQuery, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            role: 'seller',
            'sellerProfile.isApproved': true,
            isActive: true
        };

        const sellers = await User.find(query)
            .select('-password -email -phone')
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
        console.error('Get sellers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get sellers',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/users/sellers/:id
// @desc    Get seller by ID (public info)
// @access  Public
router.get('/sellers/:id', validateObjectId(), async (req, res) => {
    try {
        const seller = await User.findOne({
            _id: req.params.id,
            role: 'seller',
            'sellerProfile.isApproved': true,
            isActive: true
        }).select('-password -email -phone');

        if (!seller) {
            return res.status(404).json({
                success: false,
                message: 'Seller not found'
            });
        }

        res.json({
            success: true,
            data: {
                seller: seller.toJSON()
            }
        });
    } catch (error) {
        console.error('Get seller error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get seller',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/users/activity
// @desc    Get user activity (orders, reviews, etc.)
// @access  Private
router.get('/activity', auth, async (req, res) => {
    try {
        // TODO: Implement user activity tracking
        // This would include orders, reviews, wishlist, etc.
        
        res.json({
            success: true,
            message: 'User activity feature coming soon',
            data: {
                orders: [],
                reviews: [],
                wishlist: []
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user activity',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;


