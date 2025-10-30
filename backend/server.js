const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Enhanced Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:8000',
            'http://localhost:3000',
            'http://localhost',
            'https://bookverse.com',
            'https://staging.bookverse.com'
        ];
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Debug-Mode'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Enhanced logging
app.use(morgan('combined', {
    skip: function (req, res) { 
        return res.statusCode < 400; 
    }
}));

// Debug logging middleware (disabled for now)
// app.use((req, res, next) => {
//     console.log(`📥 ${req.method} ${req.url}`);
//     console.log('Headers:', req.headers);
//     if (req.body && Object.keys(req.body).length > 0) {
//         console.log('Body:', req.body);
//     }
//     next();
// });

// Body parsing with size limits and error handling
app.use(express.json({ 
    limit: '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Handle JSON parsing errors (only for requests with body)
app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        // Only handle JSON parsing errors for requests that should have body
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format',
                error: 'Malformed JSON in request body'
            });
        }
        // For GET requests, just continue to next middleware
        return next();
    }
    next(error);
});

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Response interceptor to ensure proper Content-Type and valid JSON (disabled for now)
// app.use((req, res, next) => {
//     const originalJson = res.json;
//     res.json = function(data) {
//         try {
//             // Handle circular references and ensure clean JSON
//             const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
//                 if (typeof value === 'object' && value !== null) {
//                     // Handle Mongoose documents
//                     if (value.toJSON && typeof value.toJSON === 'function') {
//                         return value.toJSON();
//                     }
//                     // Handle Mongoose objects
//                     if (value.toObject && typeof value.toObject === 'function') {
//                         return value.toObject();
//                     }
//                     // Handle arrays
//                     if (Array.isArray(value)) {
//                         return value;
//                     }
//                     // Handle Date objects
//                     if (value instanceof Date) {
//                         return value.toISOString();
//                     }
//                     // Remove circular references
//                     if (value.constructor && value.constructor.name === 'Object') {
//                         return value;
//                     }
//                 }
//                 return value;
//             }));
//             
//             res.setHeader('Content-Type', 'application/json');
//             
//             // Debug logging
//             console.log(`📤 Response for ${req.method} ${req.url}:`, JSON.stringify(cleanData, null, 2));
//             
//             return originalJson.call(this, cleanData);
//         } catch (error) {
//             console.error('JSON serialization error:', error);
//             res.setHeader('Content-Type', 'application/json');
//             return originalJson.call(this, {
//                 success: false,
//                 message: 'Response serialization failed',
//                 error: 'Invalid response data'
//             });
//         }
//     };
//     next();
// });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/payments', require('./routes/payments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Bookverse API is running!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Import response middleware
const { globalErrorHandler, notFoundHandler } = require('./middlewares/response');

// Global error handling middleware
app.use(globalErrorHandler);

// 404 handler
app.use('*', notFoundHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 Bookverse Marketplace API v1.0.0`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
