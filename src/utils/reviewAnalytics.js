const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const mongoose = require('mongoose');

class ReviewAnalytics {
  // Get overall review statistics
  async getOverallStats(timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const stats = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          totalHelpful: { $sum: '$helpful.count' },
          totalPhotos: { $sum: { $size: '$photos' } },
          verifiedReviews: {
            $sum: { $cond: ['$verified', 1, 0] }
          },
          pendingReviews: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          flaggedReviews: {
            $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
          }
        }
      }
    ]);

    const sentimentStats = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          averageScore: { $avg: '$sentiment.score' }
        }
      }
    ]);

    const ratingDistribution = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: '$overallRating',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      overall: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        totalHelpful: 0,
        totalPhotos: 0,
        verifiedReviews: 0,
        pendingReviews: 0,
        flaggedReviews: 0
      },
      sentiment: sentimentStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          averageScore: stat.averageScore
        };
        return acc;
      }, {}),
      ratingDistribution: ratingDistribution.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };
  }

  // Get restaurant-specific review analytics
  async getRestaurantStats(restaurantId, timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const stats = await Review.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          totalHelpful: { $sum: '$helpful.count' },
          totalPhotos: { $sum: { $size: '$photos' } },
          detailedRatings: {
            food: { $avg: '$ratings.food' },
            service: { $avg: '$ratings.service' },
            ambiance: { $avg: '$ratings.ambiance' },
            value: { $avg: '$ratings.value' }
          },
          sentimentBreakdown: {
            positive: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] } },
            neutral: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] } }
          }
        }
      }
    ]);

    const monthlyTrends = await Review.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$overallRating' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const topKeywords = await this.getTopKeywords(restaurantId, timeRange);

    return {
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        totalHelpful: 0,
        totalPhotos: 0,
        detailedRatings: { food: 0, service: 0, ambiance: 0, value: 0 },
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
      },
      monthlyTrends,
      topKeywords
    };
  }

  // Get review trends over time
  async getReviewTrends(timeRange = '90d', groupBy = 'day') {
    const dateFilter = this.getDateFilter(timeRange);
    
    let groupStage;
    switch (groupBy) {
      case 'hour':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: { $hour: '$createdAt' }
          }
        };
        break;
      case 'day':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          }
        };
        break;
      case 'week':
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          }
        };
        break;
      case 'month':
      default:
        groupStage = {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          }
        };
        break;
    }

    const trends = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          ...groupStage,
          count: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          totalHelpful: { $sum: '$helpful.count' },
          sentimentScores: {
            positive: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] } },
            neutral: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] } }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
      }
    ]);

    return trends.map(trend => ({
      date: this.formatDateFromGroup(trend._id, groupBy),
      count: trend.count,
      averageRating: Math.round(trend.averageRating * 10) / 10,
      totalHelpful: trend.totalHelpful,
      sentimentBreakdown: trend.sentimentScores
    }));
  }

  // Get top performing restaurants by reviews
  async getTopRestaurants(limit = 10, timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const restaurants = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          status: 'approved',
          deleted: false
        }
      },
      {
        $group: {
          _id: '$restaurantId',
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          totalHelpful: { $sum: '$helpful.count' },
          totalPhotos: { $sum: { $size: '$photos' } }
        }
      },
      {
        $sort: { averageRating: -1, totalReviews: -1 }
      },
      {
        $limit: limit
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $project: {
          restaurantId: '$_id',
          restaurantName: '$restaurant.name',
          restaurantImage: '$restaurant.image',
          totalReviews: 1,
          averageRating: { $round: ['$averageRating', 1] },
          totalHelpful: 1,
          totalPhotos: 1
        }
      }
    ]);

    return restaurants;
  }

  // Get user review analytics
  async getUserReviewStats(userId, timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const stats = await Review.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          totalHelpful: { $sum: '$helpful.count' },
          totalPhotos: { $sum: { $size: '$photos' } },
          verifiedReviews: { $sum: { $cond: ['$verified', 1, 0] } }
        }
      }
    ]);

    const reviewHistory = await Review.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurantId',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $project: {
          reviewId: '$_id',
          restaurantName: '$restaurant.name',
          restaurantImage: '$restaurant.image',
          rating: '$overallRating',
          title: '$title',
          content: '$content',
          createdAt: 1,
          helpful: '$helpful.count',
          status: 1
        }
      }
    ]);

    return {
      stats: stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        totalHelpful: 0,
        totalPhotos: 0,
        verifiedReviews: 0
      },
      reviewHistory
    };
  }

  // Get sentiment analysis trends
  async getSentimentTrends(timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const trends = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalReviews: { $sum: 1 },
          positiveReviews: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] } },
          neutralReviews: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0] } },
          negativeReviews: { $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] } },
          averageSentimentScore: { $avg: '$sentiment.score' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return trends.map(trend => ({
      date: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`,
      totalReviews: trend.totalReviews,
      positiveReviews: trend.positiveReviews,
      neutralReviews: trend.neutralReviews,
      negativeReviews: trend.negativeReviews,
      positivePercentage: Math.round((trend.positiveReviews / trend.totalReviews) * 100),
      negativePercentage: Math.round((trend.negativeReviews / trend.totalReviews) * 100),
      averageSentimentScore: Math.round(trend.averageSentimentScore * 100) / 100
    }));
  }

  // Get moderation analytics
  async getModerationStats(timeRange = '30d') {
    const dateFilter = this.getDateFilter(timeRange);
    
    const stats = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const flagStats = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          'flags.0': { $exists: true },
          deleted: false
        }
      },
      {
        $unwind: '$flags'
      },
      {
        $group: {
          _id: '$flags.reason',
          count: { $sum: 1 },
          pendingCount: { $sum: { $cond: [{ $eq: ['$flags.status', 'pending'] }, 1, 0] } },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$flags.status', 'resolved'] }, 1, 0] } },
          dismissedCount: { $sum: { $cond: [{ $eq: ['$flags.status', 'dismissed'] }, 1, 0] } }
        }
      }
    ]);

    const moderationTrends = await Review.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          deleted: false
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalReviews: { $sum: 1 },
          pendingReviews: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approvedReviews: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedReviews: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          flaggedReviews: { $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    return {
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      flagBreakdown: flagStats,
      moderationTrends: moderationTrends.map(trend => ({
        date: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`,
        totalReviews: trend.totalReviews,
        pendingReviews: trend.pendingReviews,
        approvedReviews: trend.approvedReviews,
        rejectedReviews: trend.rejectedReviews,
        flaggedReviews: trend.flaggedReviews
      }))
    };
  }

  // Get top keywords from reviews
  async getTopKeywords(restaurantId = null, timeRange = '30d', limit = 20) {
    const dateFilter = this.getDateFilter(timeRange);
    const matchStage = {
      createdAt: dateFilter,
      deleted: false,
      status: 'approved'
    };

    if (restaurantId) {
      matchStage.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }

    const reviews = await Review.find(matchStage, 'title content');
    
    // Simple keyword extraction (in production, use NLP libraries)
    const words = reviews.reduce((acc, review) => {
      const text = `${review.title} ${review.content}`.toLowerCase();
      const wordList = text.match(/\b\w+\b/g) || [];
      
      wordList.forEach(word => {
        if (word.length > 3) { // Filter out short words
          acc[word] = (acc[word] || 0) + 1;
        }
      });
      
      return acc;
    }, {});

    // Remove common stop words
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'a', 'an', 'very', 'really', 'quite', 'just', 'only', 'also', 'even', 'still', 'again', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'food', 'good', 'great', 'nice', 'bad', 'terrible', 'restaurant', 'place', 'service', 'staff', 'time', 'price', 'money', 'worth', 'value', 'quality', 'taste', 'delicious', 'amazing', 'wonderful', 'fantastic', 'excellent', 'perfect', 'love', 'enjoyed', 'disappointed', 'worst', 'poor', 'mediocre', 'okay', 'fine', 'decent', 'average'];
    
    Object.keys(words).forEach(word => {
      if (stopWords.includes(word)) {
        delete words[word];
      }
    });

    return Object.entries(words)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  // Helper methods
  getDateFilter(timeRange) {
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { $gte: startDate };
  }

  formatDateFromGroup(group, groupBy) {
    const { year, month, day, hour, week } = group;
    
    switch (groupBy) {
      case 'hour':
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:00`;
      case 'day':
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      case 'week':
        return `${year}-W${week.toString().padStart(2, '0')}`;
      case 'month':
      default:
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
  }
}

module.exports = new ReviewAnalytics(); 