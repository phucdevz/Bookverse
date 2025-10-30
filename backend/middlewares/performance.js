const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { cache } = require('../config/database-optimized');

// Compression middleware
const compressionMiddleware = compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
});

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'Too many requests, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                success: false,
                message: message || 'Too many requests, please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts, please try again later.');
const apiRateLimit = createRateLimit(15 * 60 * 1000, 100, 'Too many API requests, please try again later.');
const searchRateLimit = createRateLimit(1 * 60 * 1000, 20, 'Too many search requests, please slow down.');
const uploadRateLimit = createRateLimit(60 * 60 * 1000, 10, 'Too many file uploads, please try again later.');

// Speed limiter for gradual slowdown
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes, then...
    delayMs: 500 // Add 500ms delay per request above 50
});

// Caching middleware
const cacheMiddleware = (duration = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }
        
        const cacheKey = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
        
        try {
            // Try to get from cache
            const cached = await cache.get(cacheKey);
            if (cached) {
                res.set('X-Cache', 'HIT');
                return res.json(cached);
            }
            
            // Store original json method
            const originalJson = res.json;
            
            // Override json method to cache response
            res.json = function(data) {
                // Cache the response
                cache.set(cacheKey, data, duration);
                res.set('X-Cache', 'MISS');
                return originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

// Query optimization middleware
const queryOptimization = (Model, options = {}) => {
    return async (req, res, next) => {
        const {
            defaultLimit = 20,
            maxLimit = 100,
            allowedSorts = [],
            allowedFilters = []
        } = options;
        
        // Parse query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);
        const skip = (page - 1) * limit;
        
        // Parse sort parameter
        let sort = {};
        if (req.query.sort) {
            const sortField = req.query.sort.replace(/^-/, '');
            const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
            
            if (allowedSorts.length === 0 || allowedSorts.includes(sortField)) {
                sort[sortField] = sortOrder;
            }
        }
        
        // Parse filter parameters
        const filter = {};
        allowedFilters.forEach(filterField => {
            if (req.query[filterField]) {
                filter[filterField] = req.query[filterField];
            }
        });
        
        // Store optimized query parameters
        req.queryParams = {
            page,
            limit,
            skip,
            sort,
            filter
        };
        
        next();
    };
};

// Response time middleware
const responseTime = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        res.set('X-Response-Time', `${duration}ms`);
        
        // Log slow requests
        if (duration > 1000) {
            console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
    });
    
    next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
    const memUsage = process.memoryUsage();
    res.set('X-Memory-Usage', JSON.stringify({
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
    }));
    
    next();
};

// Database connection monitoring
const dbHealthCheck = async (req, res, next) => {
    try {
        const dbState = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        res.set('X-DB-Status', states[dbState]);
        
        if (dbState !== 1) {
            console.warn(`⚠️ Database connection state: ${states[dbState]}`);
        }
        
        next();
    } catch (error) {
        console.error('Database health check error:', error);
        next();
    }
};

// Request size limiter
const requestSizeLimiter = (maxSize = '10mb') => {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSizeBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes
        
        if (contentLength > maxSizeBytes) {
            return res.status(413).json({
                success: false,
                message: 'Request entity too large'
            });
        }
        
        next();
    };
};

// Cleanup middleware for memory management
const cleanup = (req, res, next) => {
    res.on('finish', () => {
        // Clear any temporary data
        if (req.tempData) {
            delete req.tempData;
        }
        
        // Force garbage collection in development
        if (process.env.NODE_ENV === 'development' && global.gc) {
            global.gc();
        }
    });
    
    next();
};

module.exports = {
    compressionMiddleware,
    authRateLimit,
    apiRateLimit,
    searchRateLimit,
    uploadRateLimit,
    speedLimiter,
    cacheMiddleware,
    queryOptimization,
    responseTime,
    memoryMonitor,
    dbHealthCheck,
    requestSizeLimiter,
    cleanup
};
