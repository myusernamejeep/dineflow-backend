const Router = require('koa-router');
const { analyticsService } = require('../utils/analytics');
const { authGuard } = require('../utils/authGuard');

const router = new Router({ prefix: '/analytics' });

// Apply authentication guard to all analytics routes
router.use(authGuard);

// Revenue Analytics
router.get('/revenue', async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;
    const data = await analyticsService.getRevenueAnalytics(timeRange);
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Booking Analytics
router.get('/bookings', async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;
    const data = await analyticsService.getBookingAnalytics(timeRange);
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Restaurant Performance Analytics
router.get('/restaurants', async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;
    const data = await analyticsService.getRestaurantAnalytics(timeRange);
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// User Analytics
router.get('/users', async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;
    const data = await analyticsService.getUserAnalytics(timeRange);
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Peak Hours Analytics
router.get('/peak-hours', async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;
    const data = await analyticsService.getPeakHoursAnalytics(timeRange);
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Seasonal Trends Analytics
router.get('/seasonal-trends', async (ctx) => {
  try {
    const { timeRange = '1y' } = ctx.query;
    const data = await analyticsService.getSeasonalTrends(timeRange);
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Predictive Analytics
router.get('/predictive', async (ctx) => {
  try {
    const data = await analyticsService.getPredictiveAnalytics();
    
    ctx.body = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Comprehensive Analytics Dashboard
router.get('/dashboard', async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;
    
    // Get all analytics data in parallel
    const [
      revenueData,
      bookingData,
      restaurantData,
      userData,
      peakHoursData,
      predictiveData
    ] = await Promise.all([
      analyticsService.getRevenueAnalytics(timeRange),
      analyticsService.getBookingAnalytics(timeRange),
      analyticsService.getRestaurantAnalytics(timeRange),
      analyticsService.getUserAnalytics(timeRange),
      analyticsService.getPeakHoursAnalytics(timeRange),
      analyticsService.getPredictiveAnalytics()
    ]);

    // Calculate KPIs
    const kpis = {
      totalRevenue: revenueData.summary.totalRevenue,
      totalBookings: bookingData.summary.totalBookings,
      conversionRate: bookingData.summary.conversionRate,
      avgRevenuePerBooking: revenueData.summary.totalRevenue / bookingData.summary.totalBookings,
      newUsers: userData.newUsers,
      avgBookingsPerUser: userData.userStats.avgBookingsPerUser,
      topRestaurantRevenue: restaurantData.topPerformers.byRevenue[0]?.totalRevenue || 0,
      peakHourBookings: peakHoursData.peakHours[0]?.bookings || 0
    };

    // Calculate trends
    const trends = {
      revenue: revenueData.trends,
      bookings: bookingData.trends,
      users: { trend: 'increasing', percentage: 15 } // Placeholder
    };

    // Generate insights
    const insights = generateInsights({
      revenueData,
      bookingData,
      restaurantData,
      userData,
      peakHoursData,
      predictiveData
    });

    ctx.body = {
      success: true,
      data: {
        kpis,
        trends,
        insights,
        timeRange,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Export Analytics Data
router.get('/export', async (ctx) => {
  try {
    const { type, timeRange = '30d', format = 'json' } = ctx.query;
    
    let data;
    switch (type) {
      case 'revenue':
        data = await analyticsService.getRevenueAnalytics(timeRange);
        break;
      case 'bookings':
        data = await analyticsService.getBookingAnalytics(timeRange);
        break;
      case 'restaurants':
        data = await analyticsService.getRestaurantAnalytics(timeRange);
        break;
      case 'users':
        data = await analyticsService.getUserAnalytics(timeRange);
        break;
      case 'peak-hours':
        data = await analyticsService.getPeakHoursAnalytics(timeRange);
        break;
      case 'seasonal':
        data = await analyticsService.getSeasonalTrends(timeRange);
        break;
      default:
        ctx.status = 400;
        ctx.body = {
          success: false,
          error: 'Invalid export type'
        };
        return;
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      ctx.set('Content-Type', 'text/csv');
      ctx.set('Content-Disposition', `attachment; filename="${type}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`);
      ctx.body = csv;
    } else {
      ctx.body = {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Analytics Cache Management
router.get('/cache/stats', async (ctx) => {
  try {
    const stats = analyticsService.getCacheStats();
    
    ctx.body = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

router.post('/cache/clear', async (ctx) => {
  try {
    analyticsService.clearCache();
    
    ctx.body = {
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message
    };
  }
});

// Helper Functions
function generateInsights(data) {
  const insights = [];

  // Revenue insights
  if (data.revenueData.trends.trend === 'increasing') {
    insights.push({
      type: 'positive',
      category: 'revenue',
      title: 'Revenue Growth',
      description: `Revenue is growing by ${data.revenueData.trends.percentage}%`,
      impact: 'high'
    });
  }

  // Booking insights
  if (data.bookingData.summary.conversionRate < 70) {
    insights.push({
      type: 'warning',
      category: 'bookings',
      title: 'Low Conversion Rate',
      description: `Booking conversion rate is ${data.bookingData.summary.conversionRate.toFixed(1)}%`,
      impact: 'medium',
      recommendation: 'Review booking flow and user experience'
    });
  }

  // Peak hours insights
  if (data.peakHoursData.peakHours.length > 0) {
    const peakHour = data.peakHoursData.peakHours[0];
    insights.push({
      type: 'info',
      category: 'operations',
      title: 'Peak Hours Identified',
      description: `Peak booking hour is ${peakHour.hour}:00 with ${peakHour.bookings} bookings`,
      impact: 'medium',
      recommendation: 'Optimize staffing during peak hours'
    });
  }

  // Predictive insights
  if (data.predictiveData.revenuePrediction.nextWeek > data.revenueData.summary.avgDailyRevenue * 7 * 1.1) {
    insights.push({
      type: 'positive',
      category: 'prediction',
      title: 'Positive Revenue Forecast',
      description: 'Revenue is predicted to increase next week',
      impact: 'high'
    });
  }

  return insights;
}

function convertToCSV(data) {
  // Simple CSV conversion - would need to be enhanced based on data structure
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const pre = prefix.length ? prefix + '.' : '';
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flattenObject(obj[key], pre + key));
      } else {
        acc[pre + key] = obj[key];
      }
      return acc;
    }, {});
  };

  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const flattened = data.map(item => flattenObject(item));
    const headers = Object.keys(flattened[0]);
    
    const csv = [
      headers.join(','),
      ...flattened.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ].join('\n');
    
    return csv;
  } else {
    // For non-array data, convert to single row
    const flattened = flattenObject(data);
    const headers = Object.keys(flattened);
    
    return [
      headers.join(','),
      headers.map(header => JSON.stringify(flattened[header] || '')).join(',')
    ].join('\n');
  }
}

module.exports = router; 