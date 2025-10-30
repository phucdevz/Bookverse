const prometheus = require('prom-client');
const { register } = require('prom-client');

// ========================================
// PROMETHEUS METRICS COLLECTION
// ========================================

// HTTP request metrics
const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// Database metrics
const dbOperationDuration = new prometheus.Histogram({
    name: 'database_operation_duration_seconds',
    help: 'Duration of database operations in seconds',
    labelNames: ['operation', 'collection'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const dbOperationTotal = new prometheus.Counter({
    name: 'database_operations_total',
    help: 'Total number of database operations',
    labelNames: ['operation', 'collection', 'status']
});

// Business metrics
const userRegistrations = new prometheus.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['source']
});

const productViews = new prometheus.Counter({
    name: 'product_views_total',
    help: 'Total number of product views',
    labelNames: ['product_id', 'category']
});

const ordersCreated = new prometheus.Counter({
    name: 'orders_created_total',
    help: 'Total number of orders created',
    labelNames: ['status']
});

const revenue = new prometheus.Counter({
    name: 'revenue_total',
    help: 'Total revenue in VND',
    labelNames: ['currency']
});

// System metrics
const activeUsers = new prometheus.Gauge({
    name: 'active_users_current',
    help: 'Current number of active users'
});

const memoryUsage = new prometheus.Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type']
});

const cpuUsage = new prometheus.Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage'
});

// Cache metrics
const cacheHits = new prometheus.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_type']
});

const cacheMisses = new prometheus.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_type']
});

// ========================================
// MONITORING MIDDLEWARE
// ========================================

// HTTP request monitoring
const httpMonitoring = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route?.path || req.path;
        
        httpRequestDuration
            .labels(req.method, route, res.statusCode)
            .observe(duration);
            
        httpRequestTotal
            .labels(req.method, route, res.statusCode)
            .inc();
    });
    
    next();
};

// Database operation monitoring
const dbMonitoring = (operation, collection) => {
    return async (req, res, next) => {
        const start = Date.now();
        
        try {
            await next();
            
            const duration = (Date.now() - start) / 1000;
            dbOperationDuration
                .labels(operation, collection)
                .observe(duration);
                
            dbOperationTotal
                .labels(operation, collection, 'success')
                .inc();
        } catch (error) {
            const duration = (Date.now() - start) / 1000;
            dbOperationDuration
                .labels(operation, collection)
                .observe(duration);
                
            dbOperationTotal
                .labels(operation, collection, 'error')
                .inc();
            
            throw error;
        }
    };
};

// Cache monitoring
const cacheMonitoring = (cacheType) => {
    return {
        hit: () => cacheHits.labels(cacheType).inc(),
        miss: () => cacheMisses.labels(cacheType).inc()
    };
};

// System metrics collection
const collectSystemMetrics = () => {
    const memUsage = process.memoryUsage();
    
    memoryUsage.labels('rss').set(memUsage.rss);
    memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
    memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
    memoryUsage.labels('external').set(memUsage.external);
    
    // CPU usage (simplified)
    const cpuUsagePercent = process.cpuUsage();
    cpuUsage.set(cpuUsagePercent.user / 1000000); // Convert to percentage
};

// Business metrics helpers
const trackUserRegistration = (source = 'web') => {
    userRegistrations.labels(source).inc();
};

const trackProductView = (productId, category) => {
    productViews.labels(productId, category).inc();
};

const trackOrderCreated = (status) => {
    ordersCreated.labels(status).inc();
};

const trackRevenue = (amount, currency = 'VND') => {
    revenue.labels(currency).inc(amount);
};

const updateActiveUsers = (count) => {
    activeUsers.set(count);
};

// ========================================
// HEALTH CHECK ENDPOINT
// ========================================

const healthCheck = async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: await checkDatabaseHealth(),
                redis: await checkRedisHealth(),
                memory: checkMemoryHealth(),
                cpu: checkCPUHealth()
            }
        };
        
        const isHealthy = Object.values(health.services).every(service => 
            service.status === 'healthy'
        );
        
        res.status(isHealthy ? 200 : 503).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
};

// Service health checks
const checkDatabaseHealth = async () => {
    try {
        const mongoose = require('mongoose');
        const state = mongoose.connection.readyState;
        
        return {
            status: state === 1 ? 'healthy' : 'unhealthy',
            state: ['disconnected', 'connected', 'connecting', 'disconnecting'][state],
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

const checkRedisHealth = async () => {
    try {
        const { redisClient } = require('../config/database-optimized');
        await redisClient.ping();
        
        return {
            status: 'healthy',
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

const checkMemoryHealth = () => {
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    return {
        status: memUsagePercent < 90 ? 'healthy' : 'warning',
        usage: {
            rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
        },
        percentage: Math.round(memUsagePercent) + '%'
    };
};

const checkCPUHealth = () => {
    const cpuUsage = process.cpuUsage();
    
    return {
        status: 'healthy',
        usage: {
            user: cpuUsage.user,
            system: cpuUsage.system
        }
    };
};

// ========================================
// METRICS ENDPOINT
// ========================================

const metricsEndpoint = async (req, res) => {
    try {
        // Collect system metrics
        collectSystemMetrics();
        
        // Get metrics in Prometheus format
        const metrics = await register.metrics();
        
        res.set('Content-Type', register.contentType);
        res.send(metrics);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to collect metrics',
            message: error.message
        });
    }
};

// ========================================
// ALERTING SYSTEM
// ========================================

class AlertManager {
    constructor() {
        this.alerts = new Map();
        this.thresholds = {
            memory: 90, // 90%
            cpu: 80,   // 80%
            responseTime: 5, // 5 seconds
            errorRate: 5 // 5%
        };
    }
    
    checkAlerts() {
        this.checkMemoryAlert();
        this.checkCPUAlert();
        this.checkResponseTimeAlert();
        this.checkErrorRateAlert();
    }
    
    checkMemoryAlert() {
        const memUsage = process.memoryUsage();
        const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        
        if (memUsagePercent > this.thresholds.memory) {
            this.triggerAlert('memory', `Memory usage is ${Math.round(memUsagePercent)}%`);
        }
    }
    
    checkCPUAlert() {
        const cpuUsage = process.cpuUsage();
        const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000;
        
        if (cpuPercent > this.thresholds.cpu) {
            this.triggerAlert('cpu', `CPU usage is ${Math.round(cpuPercent)}%`);
        }
    }
    
    checkResponseTimeAlert() {
        // This would be implemented with actual response time tracking
        // For now, it's a placeholder
    }
    
    checkErrorRateAlert() {
        // This would be implemented with actual error rate tracking
        // For now, it's a placeholder
    }
    
    triggerAlert(type, message) {
        const alertKey = `${type}_${Date.now()}`;
        
        if (!this.alerts.has(alertKey)) {
            this.alerts.set(alertKey, {
                type,
                message,
                timestamp: new Date().toISOString(),
                resolved: false
            });
            
            console.warn(`🚨 ALERT: ${type.toUpperCase()} - ${message}`);
            
            // Here you would send alerts to external services
            // like Slack, email, PagerDuty, etc.
        }
    }
    
    resolveAlert(type) {
        for (const [key, alert] of this.alerts) {
            if (alert.type === type && !alert.resolved) {
                alert.resolved = true;
                alert.resolvedAt = new Date().toISOString();
                console.log(`✅ ALERT RESOLVED: ${type.toUpperCase()}`);
            }
        }
    }
    
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    }
}

// ========================================
// PERFORMANCE TRACKING
// ========================================

class PerformanceTracker {
    constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
    }
    
    startTimer(name) {
        this.metrics.set(name, { start: Date.now() });
    }
    
    endTimer(name) {
        const metric = this.metrics.get(name);
        if (metric) {
            metric.duration = Date.now() - metric.start;
            metric.end = Date.now();
        }
        return metric;
    }
    
    getMetrics() {
        return Object.fromEntries(this.metrics);
    }
    
    getAverageResponseTime() {
        const timers = Array.from(this.metrics.values())
            .filter(metric => metric.duration)
            .map(metric => metric.duration);
            
        return timers.length > 0 
            ? timers.reduce((sum, time) => sum + time, 0) / timers.length 
            : 0;
    }
}

// Initialize alert manager
const alertManager = new AlertManager();

// Start system monitoring
setInterval(() => {
    alertManager.checkAlerts();
}, 30000); // Check every 30 seconds

module.exports = {
    // Metrics
    httpRequestDuration,
    httpRequestTotal,
    dbOperationDuration,
    dbOperationTotal,
    userRegistrations,
    productViews,
    ordersCreated,
    revenue,
    activeUsers,
    memoryUsage,
    cpuUsage,
    cacheHits,
    cacheMisses,
    
    // Middleware
    httpMonitoring,
    dbMonitoring,
    cacheMonitoring,
    
    // Business metrics
    trackUserRegistration,
    trackProductView,
    trackOrderCreated,
    trackRevenue,
    updateActiveUsers,
    
    // Health checks
    healthCheck,
    metricsEndpoint,
    
    // Alerting
    AlertManager,
    PerformanceTracker
};
