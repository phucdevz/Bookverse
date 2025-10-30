// ========================================
// BOOKVERSE SECURE AUTHENTICATION
// Enhanced JWT with secure token handling
// ========================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authError, authzError } = require('./response');

// Token configuration
const TOKEN_CONFIG = {
    access: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRE || '15m'
    },
    refresh: {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    }
};

// Generate secure token pair
const generateTokenPair = (userId) => {
    const payload = { 
        id: userId, 
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
    };
    
    const refreshPayload = { 
        id: userId, 
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, TOKEN_CONFIG.access.secret, {
        expiresIn: TOKEN_CONFIG.access.expiresIn
    });

    const refreshToken = jwt.sign(refreshPayload, TOKEN_CONFIG.refresh.secret, {
        expiresIn: TOKEN_CONFIG.refresh.expiresIn
    });

    return { accessToken, refreshToken };
};

// Verify JWT token with enhanced security
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return authError(res, 'Access denied. No token provided.');
        }

        const token = authHeader.replace('Bearer ', '');
        
        // Verify token
        const decoded = jwt.verify(token, TOKEN_CONFIG.access.secret);
        
        // Check token type
        if (decoded.type !== 'access') {
            return authError(res, 'Invalid token type.');
        }

        // Get user with security checks
        const user = await User.findById(decoded.id)
            .select('-password -refreshTokens')
            .lean();

        if (!user) {
            return authError(res, 'User not found.');
        }

        if (!user.isActive) {
            return authError(res, 'Account is deactivated.');
        }

        if (!user.isEmailVerified && req.path !== '/verify-email') {
            return authError(res, 'Email not verified.', 'EMAIL_NOT_VERIFIED');
        }

        // Add user to request
        req.user = user;
        req.token = token;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return authError(res, 'Invalid token.');
        }
        
        if (error.name === 'TokenExpiredError') {
            return authError(res, 'Token expired.', 'TOKEN_EXPIRED');
        }

        console.error('Token verification error:', error);
        return authError(res, 'Token verification failed.');
    }
};

// Role-based authorization
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return authError(res, 'Authentication required.');
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return authzError(res, 'Insufficient permissions.', userRole);
        }

        next();
    };
};

// Admin only access
const requireAdmin = requireRole('admin');

// Seller or Admin access
const requireSeller = requireRole(['seller', 'admin']);

// Resource ownership check
const requireOwnership = (resourceField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return authError(res, 'Authentication required.');
        }

        const resourceId = req.params[resourceField] || req.body[resourceField];
        const userId = req.user._id.toString();

        if (resourceId !== userId && req.user.role !== 'admin') {
            return authzError(res, 'Access denied. You can only access your own resources.');
        }

        next();
    };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, TOKEN_CONFIG.access.secret);
        
        if (decoded.type === 'access') {
            const user = await User.findById(decoded.id)
                .select('-password -refreshTokens')
                .lean();
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Rate limiting for auth endpoints
const authRateLimit = (req, res, next) => {
    const key = `auth:${req.ip}`;
    const attempts = req.rateLimit?.attempts || 0;
    
    if (attempts > 5) {
        return authError(res, 'Too many authentication attempts. Please try again later.');
    }
    
    next();
};

// Session security middleware
const sessionSecurity = (req, res, next) => {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Clear sensitive data from response
    if (req.user) {
        delete req.user.password;
        delete req.user.refreshTokens;
    }
    
    next();
};

// Token refresh endpoint
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return authError(res, 'Refresh token required.');
        }

        const decoded = jwt.verify(refreshToken, TOKEN_CONFIG.refresh.secret);
        
        if (decoded.type !== 'refresh') {
            return authError(res, 'Invalid refresh token.');
        }

        const user = await User.findById(decoded.id);
        
        if (!user || !user.isActive) {
            return authError(res, 'User not found or inactive.');
        }

        // Generate new token pair
        const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);
        
        // Update refresh token in database (optional)
        // await user.updateRefreshToken(newRefreshToken);

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            },
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return authError(res, 'Invalid refresh token.');
        }
        
        if (error.name === 'TokenExpiredError') {
            return authError(res, 'Refresh token expired.');
        }

        console.error('Token refresh error:', error);
        return authError(res, 'Token refresh failed.');
    }
};

module.exports = {
    generateTokenPair,
    verifyToken,
    requireRole,
    requireAdmin,
    requireSeller,
    requireOwnership,
    optionalAuth,
    authRateLimit,
    sessionSecurity,
    refreshToken
};
