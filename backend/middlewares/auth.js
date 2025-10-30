const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }
        
        const jwtSecret = process.env.JWT_SECRET || 'bookverse_default_secret_key_2024_development_only';
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }
        
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated.'
            });
        }
        
        // Ensure user data is properly serialized
        req.user = user.toJSON ? user.toJSON() : user.toObject ? user.toObject() : user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Token verification failed.'
        });
    }
};

// Check if user is admin
const admin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

// Check if user is seller
const seller = (req, res, next) => {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Seller role required.'
        });
    }
    next();
};

// Check if user is approved seller
const approvedSeller = async (req, res, next) => {
    try {
        if (req.user.role === 'admin') {
            return next();
        }
        
        if (req.user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Seller role required.'
            });
        }
        
        if (!req.user.sellerProfile?.isApproved) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Seller account not approved.'
            });
        }
        
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization check failed.'
        });
    }
};

// Optional auth (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (token) {
            const jwtSecret = process.env.JWT_SECRET || 'bookverse_default_secret_key_2024_development_only';
        const decoded = jwt.verify(token, jwtSecret);
            const user = await User.findById(decoded.id).select('-password');
            
            if (user && user.isActive) {
                // Ensure user data is properly serialized
                req.user = user.toJSON ? user.toJSON() : user.toObject ? user.toObject() : user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without user if token is invalid
        next();
    }
};

// Check if user owns resource
const resourceOwner = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const resource = await resourceModel.findById(resourceId);
            
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found.'
                });
            }
            
            // Check if user owns the resource or is admin
            if (req.user.role === 'admin') {
                return next();
            }
            
            const ownerField = resource.customer || resource.seller || resource.user;
            if (ownerField && ownerField.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own resources.'
                });
            }
            
            // Ensure resource data is properly serialized
            req.resource = resource.toJSON ? resource.toJSON() : resource.toObject ? resource.toObject() : resource;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Resource ownership check failed.'
            });
        }
    };
};

// Rate limiting middleware
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Clean old requests
        if (requests.has(key)) {
            const userRequests = requests.get(key).filter(time => time > windowStart);
            requests.set(key, userRequests);
        } else {
            requests.set(key, []);
        }
        
        const userRequests = requests.get(key);
        
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        userRequests.push(now);
        requests.set(key, userRequests);
        
        next();
    };
};

module.exports = {
    auth,
    admin,
    seller,
    approvedSeller,
    optionalAuth,
    resourceOwner,
    rateLimit
};

