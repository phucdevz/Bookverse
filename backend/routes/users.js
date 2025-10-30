const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const User = require('../models/User');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    profile: {
                        firstName: user.profile?.firstName || '',
                        lastName: user.profile?.lastName || '',
                        phone: user.profile?.phone || '',
                        birthDate: user.profile?.birthDate || '',
                        gender: user.profile?.gender || '',
                        bio: user.profile?.bio || '',
                        avatar: user.profile?.avatar || '',
                        address: user.profile?.address || {}
                    },
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { firstName, lastName, phone, birthDate, gender, bio, address } = req.body;
        
        const updateData = {
            'profile.firstName': firstName,
            'profile.lastName': lastName,
            'profile.phone': phone,
            'profile.birthDate': birthDate,
            'profile.gender': gender,
            'profile.bio': bio
        };

        if (address) {
            // Handle address field - convert string to object if needed
            if (typeof address === 'string') {
                updateData['profile.address'] = {
                    city: address,
                    country: 'Vietnam'
                };
            } else {
                updateData['profile.address'] = address;
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                    profile: {
                        firstName: user.profile?.firstName || '',
                        lastName: user.profile?.lastName || '',
                        phone: user.profile?.phone || '',
                        birthDate: user.profile?.birthDate || '',
                        gender: user.profile?.gender || '',
                        bio: user.profile?.bio || '',
                        avatar: user.profile?.avatar || '',
                        address: user.profile?.address || {}
                    },
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
    try {
        // This would typically aggregate data from orders, reviews, etc.
        // For now, return mock data
        const stats = {
            totalOrders: 0,
            totalWishlist: 0,
            totalReviews: 0,
            memberSince: new Date().getFullYear()
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Upload avatar
router.post('/avatar', auth, async (req, res) => {
    try {
        // This would typically handle file upload
        // For now, return mock response
        const avatarUrl = 'https://via.placeholder.com/150x150?text=Avatar';
        
        await User.findByIdAndUpdate(req.user._id, {
            'profile.avatar': avatarUrl
        });

        res.json({
            success: true,
            data: {
                avatarUrl: avatarUrl
            }
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const { emailNotifications, smsNotifications, marketingEmails, theme, language } = req.body;
        
        const updateData = {
            'preferences.emailNotifications': emailNotifications,
            'preferences.smsNotifications': smsNotifications,
            'preferences.marketingEmails': marketingEmails,
            'preferences.theme': theme,
            'preferences.language': language
        };

        await User.findByIdAndUpdate(req.user._id, {
            $set: updateData
        });

        res.json({
            success: true,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/sellers
// @desc    Get top sellers
// @access  Public
router.get('/sellers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        
        const sellers = await User.find({ 
            role: 'seller',
            isActive: true,
            'sellerProfile.isApproved': true
        })
        .select('username profile sellerProfile')
        .sort({ 'sellerProfile.rating': -1, createdAt: -1 })
        .limit(limit);

        res.json({
            success: true,
            data: {
                sellers
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

module.exports = router;