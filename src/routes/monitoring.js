const Router = require('koa-router');
const { monitoringService, register } = require('../utils/monitoring');
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

const router = new Router({ prefix: '/monitoring' });

// Prometheus metrics endpoint
router.get('/metrics', async (ctx) => {
  try {
    ctx.set('Content-Type', register.contentType);
    ctx.body = await register.metrics();
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get metrics' };
  }
});

// Health check endpoint
router.get('/health', async (ctx) => {
  try {
    const health = await monitoringService.healthCheck();
    ctx.body = health;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// System information endpoint
router.get('/system', async (ctx) => {
  try {
    const systemInfo = monitoringService.getSystemInfo();
    ctx.body = systemInfo;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get system information' };
  }
});

// Business metrics endpoint
router.get('/business', async (ctx) => {
  try {
    const [
      activeBookingsCount,
      totalRestaurantsCount,
      totalUsersCount,
      todayBookings,
      todayRevenue,
      monthlyBookings,
      monthlyRevenue
    ] = await Promise.all([
      Booking.countDocuments({ status: { $in: ['confirmed', 'checked_in'] } }),
      Restaurant.countDocuments(),
      User.countDocuments(),
      Booking.countDocuments({
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
      }),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
            status: { $in: ['confirmed', 'checked_in'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      Booking.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      }),
      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            status: { $in: ['confirmed', 'checked_in'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    const businessMetrics = {
      activeBookings: activeBookingsCount,
      totalRestaurants: totalRestaurantsCount,
      totalUsers: totalUsersCount,
      today: {
        bookings: todayBookings,
        revenue: todayRevenue[0]?.total || 0
      },
      monthly: {
        bookings: monthlyBookings,
        revenue: monthlyRevenue[0]?.total || 0
      },
      timestamp: new Date().toISOString()
    };

    // Update Prometheus metrics
    monitoringService.updateBusinessMetrics(businessMetrics);

    ctx.body = businessMetrics;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get business metrics' };
  }
});

// Performance metrics endpoint
router.get('/performance', async (ctx) => {
  try {
    const performanceMetrics = {
      memory: process.memoryUsage(),
      cpu: {
        loadAverage: require('os').loadavg(),
        usage: process.cpuUsage()
      },
      uptime: {
        process: process.uptime(),
        system: require('os').uptime()
      },
      timestamp: new Date().toISOString()
    };

    ctx.body = performanceMetrics;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get performance metrics' };
  }
});

// Database metrics endpoint
router.get('/database', async (ctx) => {
  try {
    const db = ctx.state.db;
    const adminDb = db.admin();
    
    const [serverStatus, dbStats] = await Promise.all([
      adminDb.serverStatus(),
      db.db('dineflow').stats()
    ]);

    const databaseMetrics = {
      connections: {
        current: serverStatus.connections.current,
        available: serverStatus.connections.available,
        active: serverStatus.connections.active
      },
      operations: {
        insert: serverStatus.opcounters.insert,
        query: serverStatus.opcounters.query,
        update: serverStatus.opcounters.update,
        delete: serverStatus.opcounters.delete
      },
      storage: {
        dataSize: dbStats.dataSize,
        indexSize: dbStats.indexSize,
        storageSize: dbStats.storageSize
      },
      timestamp: new Date().toISOString()
    };

    // Update Prometheus metrics
    monitoringService.updateDatabaseConnections(databaseMetrics.connections.active);

    ctx.body = databaseMetrics;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get database metrics' };
  }
});

// Error logs endpoint
router.get('/errors', async (ctx) => {
  try {
    const { limit = 100, since } = ctx.query;
    
    // In a real implementation, you'd query your error log storage
    // For now, we'll return a mock structure
    const errorLogs = {
      recent: [],
      summary: {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0
      },
      timestamp: new Date().toISOString()
    };

    ctx.body = errorLogs;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get error logs' };
  }
});

// Alert configuration endpoint
router.get('/alerts', async (ctx) => {
  try {
    const alerts = {
      memory: {
        threshold: 90,
        enabled: true
      },
      cpu: {
        threshold: 80,
        enabled: true
      },
      disk: {
        threshold: 85,
        enabled: true
      },
      database: {
        connections: {
          threshold: 100,
          enabled: true
        }
      },
      business: {
        bookingFailures: {
          threshold: 10,
          timeWindow: '1h',
          enabled: true
        }
      }
    };

    ctx.body = alerts;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Failed to get alert configuration' };
  }
});

module.exports = router; 