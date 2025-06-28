const Router = require('@koa/router');
const reviewAnalytics = require('../utils/reviewAnalytics');
const { authenticate } = require('../utils/auth');
const { adminOnly } = require('../utils/authGuard');

const router = new Router({
  prefix: '/api/review-analytics'
});

// Public routes (basic stats)
router.get('/stats/:restaurantId', async (ctx) => {
  try {
    const { restaurantId } = ctx.params;
    const { timeRange = '30d' } = ctx.query;

    const stats = await reviewAnalytics.getRestaurantStats(restaurantId, timeRange);

    ctx.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Protected routes (detailed analytics)
router.use(authenticate);

// Get overall review statistics
router.get('/overall', adminOnly, async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;

    const stats = await reviewAnalytics.getOverallStats(timeRange);

    ctx.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get review trends
router.get('/trends', adminOnly, async (ctx) => {
  try {
    const { timeRange = '90d', groupBy = 'day' } = ctx.query;

    const trends = await reviewAnalytics.getReviewTrends(timeRange, groupBy);

    ctx.body = {
      success: true,
      data: trends
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get top restaurants by reviews
router.get('/top-restaurants', adminOnly, async (ctx) => {
  try {
    const { limit = 10, timeRange = '30d' } = ctx.query;

    const restaurants = await reviewAnalytics.getTopRestaurants(parseInt(limit), timeRange);

    ctx.body = {
      success: true,
      data: restaurants
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get user review statistics
router.get('/user/:userId', async (ctx) => {
  try {
    const { userId } = ctx.params;
    const { timeRange = '30d' } = ctx.query;

    // Check if user is requesting their own stats or is admin
    if (ctx.state.user.id !== userId && ctx.state.user.role !== 'admin') {
      ctx.status = 403;
      ctx.body = { error: 'Access denied' };
      return;
    }

    const stats = await reviewAnalytics.getUserReviewStats(userId, timeRange);

    ctx.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get sentiment trends
router.get('/sentiment-trends', adminOnly, async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;

    const trends = await reviewAnalytics.getSentimentTrends(timeRange);

    ctx.body = {
      success: true,
      data: trends
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get moderation statistics
router.get('/moderation', adminOnly, async (ctx) => {
  try {
    const { timeRange = '30d' } = ctx.query;

    const stats = await reviewAnalytics.getModerationStats(timeRange);

    ctx.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get top keywords
router.get('/keywords', adminOnly, async (ctx) => {
  try {
    const { restaurantId, timeRange = '30d', limit = 20 } = ctx.query;

    const keywords = await reviewAnalytics.getTopKeywords(restaurantId, timeRange, parseInt(limit));

    ctx.body = {
      success: true,
      data: keywords
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Get restaurant comparison
router.get('/compare', adminOnly, async (ctx) => {
  try {
    const { restaurantIds, timeRange = '30d' } = ctx.query;
    
    if (!restaurantIds) {
      ctx.status = 400;
      ctx.body = { error: 'restaurantIds parameter is required' };
      return;
    }

    const ids = restaurantIds.split(',');
    const comparison = await Promise.all(
      ids.map(id => reviewAnalytics.getRestaurantStats(id, timeRange))
    );

    ctx.body = {
      success: true,
      data: comparison
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Export analytics data
router.get('/export', adminOnly, async (ctx) => {
  try {
    const { type, timeRange = '30d', format = 'json' } = ctx.query;

    let data;
    switch (type) {
      case 'overall':
        data = await reviewAnalytics.getOverallStats(timeRange);
        break;
      case 'trends':
        data = await reviewAnalytics.getReviewTrends(timeRange);
        break;
      case 'top-restaurants':
        data = await reviewAnalytics.getTopRestaurants(50, timeRange);
        break;
      case 'sentiment':
        data = await reviewAnalytics.getSentimentTrends(timeRange);
        break;
      case 'moderation':
        data = await reviewAnalytics.getModerationStats(timeRange);
        break;
      default:
        ctx.status = 400;
        ctx.body = { error: 'Invalid export type' };
        return;
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      ctx.set('Content-Type', 'text/csv');
      ctx.set('Content-Disposition', `attachment; filename="${type}-${timeRange}.csv"`);
      ctx.body = csv;
    } else {
      ctx.body = {
        success: true,
        data: data
      };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error.message };
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }
  
  // For non-array data, convert to string
  return JSON.stringify(data, null, 2);
}

module.exports = router; 