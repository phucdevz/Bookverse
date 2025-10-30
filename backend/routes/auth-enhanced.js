const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { 
    advancedAuth, 
    requireRole, 
    validatePasswordStrength,
    hashPassword,
    verifyPassword,
    generateSecureToken,
    createAdvancedRateLimit,
    sanitizeInput,
    xssProtection,
    securityAudit
} = require('../middlewares/security');
const { TokenManager } = require('../middlewares/security');
const { validateUser, validateLogin } = require('../middlewares/validation');

const router = express.Router();

// Apply security middleware to all routes
router.use(sanitizeInput);
router.use(xssProtection);
router.use(securityAudit);

// Rate limiting for authentication endpoints
const authRateLimit = createAdvancedRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts. Please try again later.',
    keyGenerator: (req) => `${req.ip}:${req.body.email || req.body.username || 'unknown'}`,
    onLimitReached: (req, res, options) => {
        console.warn(`Authentication rate limit exceeded for ${req.ip}`);
        // Could implement account lockout here
    }
});

// Password reset rate limiting
const passwordResetRateLimit = createAdvancedRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts. Please try again later.'
});

// ========================================
// ENHANCED AUTHENTICATION ROUTES
// ========================================

// Register with enhanced security
router.post('/register', 
    authRateLimit,
    validateUser,
    async (req, res) => {
        try {
            const { username, email, password, profile } = req.body;

            // Check password strength
            const passwordStrength = validatePasswordStrength(password);
            if (passwordStrength.score < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'Password does not meet security requirements',
                    details: passwordStrength.feedback
                });
            }

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

            // Hash password with high salt rounds
            const hashedPassword = await hashPassword(password);

            // Create new user with enhanced security
            const user = new User({
                username,
                email,
                password: hashedPassword,
                profile: profile || {},
                isEmailVerified: false,
                lastPasswordChange: new Date()
            });

            await user.save();

            // Generate secure tokens
            const tokenManager = new TokenManager();
            const { accessToken, refreshToken } = tokenManager.generateTokenPair(user._id);

            // Store refresh token securely (in production, use Redis or database)
            user.refreshToken = refreshToken;
            await user.save();

            // Send verification email (implement email service)
            // await sendVerificationEmail(user.email, user._id);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: user.toJSON(),
                    accessToken,
                    refreshToken,
                    expiresIn: process.env.JWT_EXPIRE || '15m'
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
    }
);

// Enhanced login with security features
router.post('/login', 
    authRateLimit,
    validateLogin,
    async (req, res) => {
        try {
            const { email, password, rememberMe = false } = req.body;

            // Find user by email
            const user = await User.findOne({ email }).select('+password');

            if (!user) {
                // Use same timing for security (prevent user enumeration)
                await bcrypt.compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');
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

            // Check if account is locked
            if (user.lockedUntil && user.lockedUntil > Date.now()) {
                return res.status(423).json({
                    success: false,
                    message: 'Account is temporarily locked due to too many failed login attempts'
                });
            }

            // Verify password
            const isPasswordValid = await verifyPassword(password, user.password);

            if (!isPasswordValid) {
                // Increment failed login attempts
                user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
                
                // Lock account after 5 failed attempts
                if (user.failedLoginAttempts >= 5) {
                    user.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
                }
                
                await user.save();
                
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Reset failed login attempts on successful login
            user.failedLoginAttempts = 0;
            user.lockedUntil = undefined;
            user.lastLogin = new Date();
            user.loginCount = (user.loginCount || 0) + 1;
            
            // Update last login IP
            user.lastLoginIP = req.ip;
            user.lastLoginUserAgent = req.get('User-Agent');

            await user.save();

            // Generate tokens
            const tokenManager = new TokenManager();
            const tokenExpiry = rememberMe ? '30d' : '15m';
            const { accessToken, refreshToken } = tokenManager.generateTokenPair(user._id);

            // Store refresh token
            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: user.toJSON(),
                    accessToken,
                    refreshToken,
                    expiresIn: tokenExpiry
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
    }
);

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const tokenManager = new TokenManager();
        const { accessToken, refreshToken: newRefreshToken } = await tokenManager.refreshAccessToken(refreshToken);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: process.env.JWT_EXPIRE || '15m'
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token'
        });
    }
);

// Enhanced logout with token invalidation
router.post('/logout', 
    advancedAuth,
    async (req, res) => {
        try {
            // Invalidate refresh token
            await User.findByIdAndUpdate(req.user._id, {
                $unset: { refreshToken: 1 }
            });

            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
    }
);

// Get current user with enhanced security
router.get('/me', 
    advancedAuth,
    async (req, res) => {
        try {
            // Return user data without sensitive information
            const userData = {
                ...req.user.toObject(),
                lastLogin: req.user.lastLogin,
                loginCount: req.user.loginCount,
                isEmailVerified: req.user.isEmailVerified
            };

            res.json({
                success: true,
                data: { user: userData }
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user information'
            });
        }
    }
);

// Enhanced password change
router.post('/change-password', 
    advancedAuth,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required'
                });
            }

            // Validate new password strength
            const passwordStrength = validatePasswordStrength(newPassword);
            if (passwordStrength.score < 4) {
                return res.status(400).json({
                    success: false,
                    message: 'New password does not meet security requirements',
                    details: passwordStrength.feedback
                });
            }

            // Get user with password
            const user = await User.findById(req.user._id).select('+password');

            // Verify current password
            const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);

            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Check if new password is different from current
            const isSamePassword = await verifyPassword(newPassword, user.password);
            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be different from current password'
                });
            }

            // Hash new password
            const hashedNewPassword = await hashPassword(newPassword);

            // Update password
            user.password = hashedNewPassword;
            user.lastPasswordChange = new Date();
            user.failedLoginAttempts = 0; // Reset failed attempts
            user.lockedUntil = undefined; // Unlock account if locked

            await user.save();

            // Invalidate all refresh tokens
            user.refreshToken = undefined;
            await user.save();

            res.json({
                success: true,
                message: 'Password changed successfully. Please login again.'
            });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                message: 'Password change failed'
            });
        }
    }
);

// Enhanced forgot password with rate limiting
router.post('/forgot-password', 
    passwordResetRateLimit,
    async (req, res) => {
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
                // Don't reveal if email exists or not for security
                return res.json({
                    success: true,
                    message: 'If the email exists, a password reset link has been sent'
                });
            }

            // Rate limit: at most once per 60 seconds
            const now = new Date();
            if (user.resetPassword?.lastRequestedAt && (now - user.resetPassword.lastRequestedAt) < 60000) {
                return res.json({ 
                    success: true, 
                    message: 'Password reset already requested. Please check your email.' 
                });
            }

            // Generate secure OTP
            const otpCode = generateSecureToken(6);
            const otpHash = await hashPassword(otpCode);

            user.resetPassword = {
                otp: { 
                    code: otpHash, 
                    expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
                    attempts: 0 
                },
                lastRequestedAt: now
            };

            await user.save();

            // TODO: Send email with OTP
            // await sendPasswordResetEmail(user.email, otpCode);

            res.json({
                success: true,
                message: 'Password reset OTP has been sent to your email',
                data: { 
                    otp: process.env.NODE_ENV === 'development' ? otpCode : undefined 
                }
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                message: 'Password reset request failed'
            });
        }
    }
);

// Enhanced password reset
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

        const { code: otpHash, expiresAt, attempts } = user.resetPassword.otp;
        
        // Check attempts limit
        if (attempts >= 5) {
            return res.status(429).json({ 
                success: false, 
                message: 'Too many OTP attempts. Request a new OTP.' 
            });
        }

        // Check expiry
        if (new Date() > new Date(expiresAt)) {
            return res.status(400).json({ 
                success: false, 
                message: 'OTP expired. Request a new OTP.' 
            });
        }

        // Verify OTP
        const isOtpValid = await verifyPassword(otp, otpHash);
        if (!isOtpValid) {
            user.resetPassword.otp.attempts = attempts + 1;
            await user.save();
            return res.status(400).json({ 
                success: false, 
                message: 'Incorrect OTP' 
            });
        }

        // Validate new password strength
        const passwordStrength = validatePasswordStrength(newPassword);
        if (passwordStrength.score < 4) {
            return res.status(400).json({
                success: false,
                message: 'New password does not meet security requirements',
                details: passwordStrength.feedback
            });
        }

        // Update password
        user.password = await hashPassword(newPassword);
        user.lastPasswordChange = new Date();
        user.resetPassword = undefined;
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;

        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed'
        });
    }
});

// Account verification
router.post('/verify-email', 
    advancedAuth,
    async (req, res) => {
        try {
            const { verificationCode } = req.body;

            if (!verificationCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Verification code is required'
                });
            }

            // TODO: Implement email verification logic
            // For now, just mark as verified
            await User.findByIdAndUpdate(req.user._id, {
                isEmailVerified: true
            });

            res.json({
                success: true,
                message: 'Email verified successfully'
            });
        } catch (error) {
            console.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Email verification failed'
            });
        }
    }
);

// Resend verification email
router.post('/resend-verification', 
    advancedAuth,
    async (req, res) => {
        try {
            if (req.user.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already verified'
                });
            }

            // TODO: Implement resend verification email
            // await sendVerificationEmail(req.user.email, req.user._id);

            res.json({
                success: true,
                message: 'Verification email sent'
            });
        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to resend verification email'
            });
        }
    }
);

// Account deactivation
router.post('/deactivate', 
    advancedAuth,
    async (req, res) => {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required to deactivate account'
                });
            }

            // Verify password
            const user = await User.findById(req.user._id).select('+password');
            const isPasswordValid = await verifyPassword(password, user.password);

            if (!isPasswordValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Incorrect password'
                });
            }

            // Deactivate account
            await User.findByIdAndUpdate(req.user._id, {
                isActive: false,
                deactivatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Account deactivated successfully'
            });
        } catch (error) {
            console.error('Account deactivation error:', error);
            res.status(500).json({
                success: false,
                message: 'Account deactivation failed'
            });
        }
    }
);

module.exports = router;
