const prometheus = require('prom-client');
const os = require('os');
const fs = require('fs').promises;

// Initialize Prometheus registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeBookings = new prometheus.Gauge({
  name: 'active_bookings_total',
  help: 'Total number of active bookings'
});

const totalRestaurants = new prometheus.Gauge({
  name: 'restaurants_total',
  help: 'Total number of restaurants'
});

const totalUsers = new prometheus.Gauge({
  name: 'users_total',
  help: 'Total number of users'
});

const bookingCreationRate = new prometheus.Counter({
  name: 'bookings_created_total',
  help: 'Total number of bookings created',
  labelNames: ['restaurant_id', 'status']
});

const bookingCancellationRate = new prometheus.Counter({
  name: 'bookings_cancelled_total',
  help: 'Total number of bookings cancelled',
  labelNames: ['restaurant_id', 'reason']
});

const checkinRate = new prometheus.Counter({
  name: 'checkins_total',
  help: 'Total number of check-ins',
  labelNames: ['restaurant_id']
});

const notificationSent = new prometheus.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'status']
});

const databaseConnections = new prometheus.Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections'
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

const diskUsage = new prometheus.Gauge({
  name: 'disk_usage_bytes',
  help: 'Disk usage in bytes',
  labelNames: ['mount_point']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeBookings);
register.registerMetric(totalRestaurants);
register.registerMetric(totalUsers);
register.registerMetric(bookingCreationRate);
register.registerMetric(bookingCancellationRate);
register.registerMetric(checkinRate);
register.registerMetric(notificationSent);
register.registerMetric(databaseConnections);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);
register.registerMetric(diskUsage);

class MonitoringService {
  constructor() {
    this.startTime = Date.now();
    this.updateInterval = null;
  }

  // Start monitoring service
  start() {
    console.log('🚀 Starting monitoring service...');
    
    // Update system metrics every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, 30000);

    // Initial metrics update
    this.updateSystemMetrics();
  }

  // Stop monitoring service
  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log('🛑 Monitoring service stopped');
  }

  // Update system metrics
  async updateSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      memoryUsage.set({ type: 'rss' }, memUsage.rss);
      memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
      memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
      memoryUsage.set({ type: 'external' }, memUsage.external);

      // CPU metrics
      const cpuUsagePercent = os.loadavg()[0] * 100;
      cpuUsage.set(cpuUsagePercent);

      // Disk usage
      try {
        const diskUsageStats = await this.getDiskUsage();
        diskUsage.set({ mount_point: '/' }, diskUsageStats.used);
      } catch (error) {
        console.warn('Failed to get disk usage:', error.message);
      }

      // Uptime
      const uptime = (Date.now() - this.startTime) / 1000;
      new prometheus.Gauge({
        name: 'application_uptime_seconds',
        help: 'Application uptime in seconds'
      }).set(uptime);

    } catch (error) {
      console.error('Error updating system metrics:', error);
    }
  }

  // Get disk usage
  async getDiskUsage() {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    try {
      const { stdout } = await execAsync('df -B1 / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      return {
        total: parseInt(parts[1]),
        used: parseInt(parts[2]),
        available: parseInt(parts[3])
      };
    } catch (error) {
      throw new Error('Failed to get disk usage');
    }
  }

  // Record HTTP request metrics
  recordHttpRequest(method, route, statusCode, duration) {
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
  }

  // Update business metrics
  updateBusinessMetrics(data) {
    if (data.activeBookings !== undefined) {
      activeBookings.set(data.activeBookings);
    }
    if (data.totalRestaurants !== undefined) {
      totalRestaurants.set(data.totalRestaurants);
    }
    if (data.totalUsers !== undefined) {
      totalUsers.set(data.totalUsers);
    }
  }

  // Record booking events
  recordBookingCreated(restaurantId, status) {
    bookingCreationRate.inc({ restaurant_id: restaurantId, status });
  }

  recordBookingCancelled(restaurantId, reason) {
    bookingCancellationRate.inc({ restaurant_id: restaurantId, reason });
  }

  recordCheckin(restaurantId) {
    checkinRate.inc({ restaurant_id: restaurantId });
  }

  recordNotification(type, status) {
    notificationSent.inc({ type, status });
  }

  // Update database connection count
  updateDatabaseConnections(count) {
    databaseConnections.set(count);
  }

  // Get metrics as text
  async getMetrics() {
    return await register.metrics();
  }

  // Health check
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: os.loadavg(),
      version: process.version,
      platform: os.platform(),
      arch: os.arch()
    };

    // Check if memory usage is high
    const memUsage = process.memoryUsage();
    const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (memUsagePercent > 90) {
      health.status = 'warning';
      health.warnings = ['High memory usage detected'];
    }

    // Check if uptime is reasonable
    if (process.uptime() < 60) {
      health.status = 'warning';
      health.warnings = health.warnings || [];
      health.warnings.push('Application recently started');
    }

    return health;
  }

  // Get detailed system info
  getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        loadAverage: os.loadavg()
      },
      network: os.networkInterfaces(),
      uptime: os.uptime()
    };
  }
}

// Create singleton instance
const monitoringService = new MonitoringService();

module.exports = {
  monitoringService,
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeBookings,
  totalRestaurants,
  totalUsers,
  bookingCreationRate,
  bookingCancellationRate,
  checkinRate,
  notificationSent,
  databaseConnections,
  memoryUsage,
  cpuUsage,
  diskUsage
}; 