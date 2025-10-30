// ========================================
// BOOKVERSE ENVIRONMENT CONFIGURATION
// Environment-based settings
// ========================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const environment = process.env.NODE_ENV || 'development';

const config = {
    development: {
        port: process.env.PORT || 5000,
        mongodb: {
            uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse',
            options: {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            }
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || null,
            db: 0
        },
        jwt: {
            secret: process.env.JWT_SECRET || 'dev_secret_key',
            refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
            expiresIn: process.env.JWT_EXPIRE || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
        },
        cors: {
            origin: ['http://localhost:8000', 'http://localhost:3000'],
            credentials: true
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limit each IP to 100 requests per windowMs
        },
        logging: {
            level: 'debug',
            format: 'combined'
        },
        security: {
            bcryptRounds: 10,
            sessionSecret: 'dev_session_secret'
        }
    },

    staging: {
        port: process.env.PORT || 5000,
        mongodb: {
            uri: process.env.MONGODB_URI,
            options: {
                maxPoolSize: 20,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                retryWrites: true
            }
        },
        redis: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: 0
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            refreshSecret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_EXPIRE || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
        },
        cors: {
            origin: [
                'https://staging.bookverse.com',
                'https://api-staging.bookverse.com'
            ],
            credentials: true
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 200
        },
        logging: {
            level: 'info',
            format: 'combined'
        },
        security: {
            bcryptRounds: 12,
            sessionSecret: process.env.SESSION_SECRET
        }
    },

    production: {
        port: process.env.PORT || 5000,
        mongodb: {
            uri: process.env.MONGODB_URI,
            options: {
                maxPoolSize: 50,
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                retryReads: true,
                compressors: ['zlib'],
                connectTimeoutMS: 30000,
                maxIdleTimeMS: 30000
            }
        },
        redis: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: 0,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            maxRetriesPerRequest: null
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            refreshSecret: process.env.JWT_REFRESH_SECRET,
            expiresIn: process.env.JWT_EXPIRE || '15m',
            refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
        },
        cors: {
            origin: [
                'https://bookverse.com',
                'https://www.bookverse.com',
                'https://api.bookverse.com'
            ],
            credentials: true
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 500
        },
        logging: {
            level: 'warn',
            format: 'combined'
        },
        security: {
            bcryptRounds: 14,
            sessionSecret: process.env.SESSION_SECRET
        }
    }
};

// Validate required environment variables
const validateEnvironment = () => {
    const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    
    if (environment === 'production') {
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
};

// Get current configuration
const getConfig = () => {
    validateEnvironment();
    return config[environment];
};

// Export configuration
module.exports = {
    environment,
    config: getConfig(),
    isDevelopment: environment === 'development',
    isStaging: environment === 'staging',
    isProduction: environment === 'production'
};
