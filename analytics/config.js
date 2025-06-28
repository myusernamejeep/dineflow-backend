module.exports = {
  // Cache configuration
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100 // Maximum number of cached items
  },
  
  // Export configuration
  export: {
    formats: ['json', 'csv', 'xlsx', 'pdf'],
    defaultFormat: 'json',
    compression: true
  },
  
  // Email configuration
  email: {
    enabled: true,
    templateDir: './templates/email',
    defaultSender: 'analytics@dineflow.com'
  },
  
  // Scheduling configuration
  scheduling: {
    enabled: true,
    timezone: 'UTC',
    defaultSchedule: '0 9 * * *' // Daily at 9 AM
  },
  
  // Report retention
  retention: {
    daily: 30, // Keep daily reports for 30 days
    weekly: 12, // Keep weekly reports for 12 weeks
    monthly: 24, // Keep monthly reports for 24 months
    custom: 90 // Keep custom reports for 90 days
  },
  
  // Analytics thresholds
  thresholds: {
    revenue: {
      warning: 1000,
      critical: 500
    },
    bookings: {
      warning: 50,
      critical: 20
    },
    conversion: {
      warning: 70,
      critical: 50
    }
  }
};
