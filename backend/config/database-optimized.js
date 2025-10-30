const mongoose = require('mongoose');
const redis = require('redis');

// Redis client for caching
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

// Connection pooling and optimization
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse', {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferMaxEntries: 0, // Disable mongoose buffering
            bufferCommands: false, // Disable mongoose buffering
            // Enable compression
            compressors: ['zlib'],
            zlibCompressionLevel: 6,
            // Connection options
            connectTimeoutMS: 10000,
            maxIdleTimeMS: 30000,
            retryWrites: true,
            retryReads: true
        });
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Connect to Redis
        await redisClient.connect();
        console.log('✅ Redis Connected');
        
        // Setup Redis error handling
        redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        
        // Setup connection monitoring
        mongoose.connection.on('connected', () => {
            console.log('📊 MongoDB connection established');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });
        
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

// Cache helper functions
const cache = {
    async get(key) {
        try {
            const value = await redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    },
    
    async set(key, value, expireInSeconds = 3600) {
        try {
            await redisClient.setEx(key, expireInSeconds, JSON.stringify(value));
        } catch (error) {
            console.error('Cache set error:', error);
        }
    },
    
    async del(key) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    },
    
    async clearPattern(pattern) {
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } catch (error) {
            console.error('Cache clear pattern error:', error);
        }
    }
};

// Database optimization middleware
const optimizeQuery = (Model, options = {}) => {
    return async (req, res, next) => {
        const { 
            populate = [], 
            select = '', 
            lean = true, 
            cacheKey = null,
            cacheExpire = 300 
        } = options;
        
        // Try to get from cache first
        if (cacheKey) {
            const cached = await cache.get(cacheKey);
            if (cached) {
                req.cachedData = cached;
                return next();
            }
        }
        
        // Store query options for later use
        req.queryOptions = {
            populate,
            select,
            lean,
            cacheKey,
            cacheExpire
        };
        
        next();
    };
};

// Index optimization
const createOptimizedIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        
        // User indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });
        await db.collection('users').createIndex({ 'sellerProfile.isApproved': 1 });
        await db.collection('users').createIndex({ createdAt: -1 });
        
        // Product indexes
        await db.collection('products').createIndex({ title: 'text', description: 'text', author: 'text' });
        await db.collection('products').createIndex({ category: 1 });
        await db.collection('products').createIndex({ seller: 1 });
        await db.collection('products').createIndex({ status: 1 });
        await db.collection('products').createIndex({ isActive: 1 });
        await db.collection('products').createIndex({ price: 1 });
        await db.collection('products').createIndex({ 'rating.average': -1 });
        await db.collection('products').createIndex({ createdAt: -1 });
        await db.collection('products').createIndex({ isFeatured: 1 });
        
        // Order indexes
        await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
        await db.collection('orders').createIndex({ customer: 1 });
        await db.collection('orders').createIndex({ 'items.seller': 1 });
        await db.collection('orders').createIndex({ status: 1 });
        await db.collection('orders').createIndex({ 'payment.status': 1 });
        await db.collection('orders').createIndex({ createdAt: -1 });
        
        // Category indexes
        await db.collection('categories').createIndex({ slug: 1 }, { unique: true });
        await db.collection('categories').createIndex({ isActive: 1 });
        await db.collection('categories').createIndex({ isFeatured: 1 });
        await db.collection('categories').createIndex({ sortOrder: 1 });
        
        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
};

module.exports = {
    connectDB,
    cache,
    optimizeQuery,
    createOptimizedIndexes,
    redisClient
};
