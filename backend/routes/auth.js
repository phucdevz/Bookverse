const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middlewares/auth');
const { validateUser, validateLogin, validatePasswordChange } = require('../middlewares/validation');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
    const jwtSecret = process.env.JWT_SECRET || 'bookverse_default_secret_key_2024_development_only';
    
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using default secret for development only!');
    }
    
    return jwt.sign({ id: userId }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUser, async (req, res) => {
    try {
        const { username, email, password, profile } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
            });
        }

        // Process profile data
        let processedProfile = profile || {};
        
        // Handle address field - convert string to object if needed
        if (processedProfile.address && typeof processedProfile.address === 'string') {
            processedProfile.address = {
                city: processedProfile.address,
                country: 'Vietnam'
            };
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            profile: processedProfile
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: user.toJSON(),
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        // Set Content-Type header explicitly
        res.setHeader('Content-Type', 'application/json');
        
        // Ensure user data is properly serialized and remove sensitive fields
        let userData = null;
        if (req.user) {
            if (req.user.toJSON && typeof req.user.toJSON === 'function') {
                userData = req.user.toJSON();
            } else if (req.user.toObject && typeof req.user.toObject === 'function') {
                userData = req.user.toObject();
            } else {
                userData = req.user;
            }
            
            // Remove sensitive fields
            if (userData && typeof userData === 'object') {
                delete userData.password;
                delete userData.resetPassword;
                delete userData.__v;
            }
        }
        
        if (!userData) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const responseData = {
            success: true,
            data: {
                user: userData
            }
        };
        
        // Debug logging (disabled for now)
        // try {
        //     console.log('Response data:', JSON.stringify(responseData, null, 2));
        // } catch (logError) {
        //     console.error('Logging error:', logError);
        // }
        
        res.json(responseData);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
    try {
        const token = generateToken(req.user._id);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                token
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, validatePasswordChange, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password change failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // Don't reveal if email exists or not
            return res.json({
                success: true,
                message: 'If the email exists, an OTP has been sent'
            });
        }

        // Rate limit simple: at most once per 60 seconds
        const now = new Date();
        if (user.resetPassword?.lastRequestedAt && (now - user.resetPassword.lastRequestedAt) < 60000) {
            return res.json({ success: true, message: 'OTP already sent. Please check your email.' });
        }

        // Generate 6-digit OTP and set expiry 10 minutes
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPassword = {
            otp: { code: otpCode, expiresAt: new Date(now.getTime() + 10 * 60 * 1000), attempts: 0 },
            lastRequestedAt: now
        };
        await user.save();

        // TODO: send email with otpCode
        res.json({
            success: true,
            message: 'OTP has been generated and (would be) sent to your email',
            data: { otp: process.env.NODE_ENV === 'development' ? otpCode : undefined }
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset request failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP and new password are required'
            });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !user.isActive || !user.resetPassword?.otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user or OTP not requested'
            });
        }

        const { code, expiresAt, attempts } = user.resetPassword.otp;
        if (attempts >= 5) {
            return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
        }
        if (new Date() > new Date(expiresAt)) {
            return res.status(400).json({ success: false, message: 'OTP expired. Request a new OTP.' });
        }
        if (otp !== code) {
            user.resetPassword.otp.attempts = attempts + 1;
            await user.save();
            return res.status(400).json({ success: false, message: 'Incorrect OTP' });
        }

        user.password = newPassword;
        user.resetPassword = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;

