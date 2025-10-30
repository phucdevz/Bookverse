const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const { User } = require('../models/User');

// ========================================
// ADVANCED SECURITY MIDDLEWARE
// ========================================

// Enhanced JWT with refresh tokens
class TokenManager {
    constructor() {
        this.accessTokenSecret = process.env.JWT_SECRET || 'bookverse_default_secret_key_2024_development_only';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.accessTokenSecret + '_refresh';
        this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';
        
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using default secret for development only!');
        }
    }

    generateTokenPair(userId) {
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

        const accessToken = jwt.sign(payload, this.accessTokenSecret, {
            expiresIn: this.accessTokenExpiry,
            issuer: 'bookverse-api',
            audience: 'bookverse-client'
        });

        const refreshToken = jwt.sign(refreshPayload, this.refreshTokenSecret, {
            expiresIn: this.refreshTokenExpiry,
            issuer: 'bookverse-api',
            audience: 'bookverse-client'
        });

        return { accessToken, refreshToken };
    }

    verifyAccessToken(token) {
        try {
            return jwt.verify(token, this.accessTokenSecret, {
                issuer: 'bookverse-api',
                audience: 'bookverse-client'
            });
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }

    verifyRefreshToken(token) {
        try {
            return jwt.verify(token, this.refreshTokenSecret, {
                issuer: 'bookverse-api',
                audience: 'bookverse-client'
            });
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async refreshAccessToken(refreshToken) {
        const decoded = this.verifyRefreshToken(refreshToken);
        
        // Check if user still exists and is active
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            throw new Error('User not found or inactive');
        }

        return this.generateTokenPair(user._id);
    }
}

// Advanced rate limiting
const createAdvancedRateLimit = (options) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        max = 100,
        message = 'Too many requests',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        keyGenerator = (req) => req.ip,
        onLimitReached = null
    } = options;

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        skipFailedRequests,
        keyGenerator,
        onLimitReached: onLimitReached || ((req, res, options) => {
            console.warn(`Rate limit exceeded for ${keyGenerator(req)}`);
        }),
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

// Input sanitization
const sanitizeInput = (req, res, next) => {
    const sanitizeObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                // Remove potentially dangerous characters
                obj[key] = obj[key]
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '')
                    .trim();
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeObject(obj[key]);
            }
        }
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

// SQL injection protection
const sqlInjectionProtection = (req, res, next) => {
    const dangerousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(UNION\s+SELECT)/i,
        /(DROP\s+TABLE)/i,
        /(INSERT\s+INTO)/i,
        /(UPDATE\s+SET)/i,
        /(DELETE\s+FROM)/i
    ];

    const checkInput = (input) => {
        if (typeof input === 'string') {
            return dangerousPatterns.some(pattern => pattern.test(input));
        } else if (typeof input === 'object' && input !== null) {
            return Object.values(input).some(checkInput);
        }
        return false;
    };

    const hasDangerousInput = 
        checkInput(req.body) || 
        checkInput(req.query) || 
        checkInput(req.params);

    if (hasDangerousInput) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
        });
    }

    next();
};

// XSS protection
const xssProtection = (req, res, next) => {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<link/gi,
        /<meta/gi
    ];

    const checkXSS = (input) => {
        if (typeof input === 'string') {
            return xssPatterns.some(pattern => pattern.test(input));
        } else if (typeof input === 'object' && input !== null) {
            return Object.values(input).some(checkXSS);
        }
        return false;
    };

    const hasXSS = 
        checkXSS(req.body) || 
        checkXSS(req.query) || 
        checkXSS(req.params);

    if (hasXSS) {
        return res.status(400).json({
            success: false,
            message: 'Potentially malicious input detected'
        });
    }

    next();
};

// CSRF protection
const csrfProtection = (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }

    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
        return res.status(403).json({
            success: false,
            message: 'CSRF token mismatch'
        });
    }

    next();
};

// Advanced authentication middleware
const advancedAuth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const tokenManager = new TokenManager();
        
        const decoded = tokenManager.verifyAccessToken(token);
        
        // Check if user exists and is active
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

        // Check if user has been compromised
        if (user.lastPasswordChange && decoded.iat < Math.floor(user.lastPasswordChange.getTime() / 1000)) {
            return res.status(401).json({
                success: false,
                message: 'Token invalidated due to password change.'
            });
        }

        req.user = user;
        req.token = token;
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

// Role-based access control
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions.'
            });
        }

        next();
    };
};

// Resource ownership check
const requireOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'user') => {
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

            // Admin can access everything
            if (req.user.role === 'admin') {
                req.resource = resource;
                return next();
            }

            // Check ownership
            const ownerId = resource[ownerField];
            if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own resources.'
                });
            }

            req.resource = resource;
            next();
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Resource ownership check failed.'
            });
        }
    };
};

// Password strength validation
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoSpaces = !/\s/.test(password);

    const strength = {
        score: 0,
        feedback: []
    };

    if (password.length >= minLength) strength.score += 1;
    else strength.feedback.push('Password must be at least 8 characters long');

    if (hasUpperCase) strength.score += 1;
    else strength.feedback.push('Password must contain at least one uppercase letter');

    if (hasLowerCase) strength.score += 1;
    else strength.feedback.push('Password must contain at least one lowercase letter');

    if (hasNumbers) strength.score += 1;
    else strength.feedback.push('Password must contain at least one number');

    if (hasSpecialChar) strength.score += 1;
    else strength.feedback.push('Password must contain at least one special character');

    if (hasNoSpaces) strength.score += 1;
    else strength.feedback.push('Password cannot contain spaces');

    return strength;
};

// Advanced password hashing
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Password verification with timing attack protection
const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

// Generate secure random tokens
const generateSecureToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Session security
const sessionSecurity = (req, res, next) => {
    // Regenerate session ID on login
    if (req.session && req.session.regenerate) {
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
            }
            next();
        });
    } else {
        next();
    }
};

// IP whitelist/blacklist
const ipFilter = (whitelist = [], blacklist = []) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (blacklist.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied from this IP address.'
            });
        }

        if (whitelist.length > 0 && !whitelist.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. IP not in whitelist.'
            });
        }

        next();
    };
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSizeBytes = parseInt(maxSize) * 1024 * 1020; // Convert MB to bytes

        if (contentLength > maxSizeBytes) {
            return res.status(413).json({
                success: false,
                message: 'Request entity too large'
            });
        }

        next();
    };
};

// Security audit logging
const securityAudit = (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            statusCode: res.statusCode,
            duration: duration,
            userId: req.user?._id || null
        };

        // Log suspicious activities
        if (res.statusCode >= 400) {
            console.warn('Security Event:', logData);
        }

        // Log authentication events
        if (req.originalUrl.includes('/auth/')) {
            console.log('Auth Event:', logData);
        }
    });

    next();
};

module.exports = {
    TokenManager,
    createAdvancedRateLimit,
    securityHeaders,
    sanitizeInput,
    sqlInjectionProtection,
    xssProtection,
    csrfProtection,
    advancedAuth,
    requireRole,
    requireOwnership,
    validatePasswordStrength,
    hashPassword,
    verifyPassword,
    generateSecureToken,
    sessionSecurity,
    ipFilter,
    requestSizeLimiter,
    securityAudit
};
